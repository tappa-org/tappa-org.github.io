/**
 * TAPPA Quarterly — poll endpoint
 *
 * One Cloudflare Worker backed by one D1 (SQLite) table. No accounts, no
 * personal data: the only thing stored per vote is a salted hash of the
 * client IP, kept so the same connection cannot stuff the ballot, and it
 * expires on its own.
 *
 * Routes
 *   GET  /?poll=<id>   -> [{ id, votes }, ...]
 *   POST /             -> { poll, option, previous } then the same array back
 */

const RATE_LIMIT = 20;              // votes allowed per window, per IP
const RATE_WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const VOTER_TTL_MS = 90 * 24 * 60 * 60 * 1000;  // forget voters after 90 days

/** Origins allowed to call this endpoint from a browser. */
function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const list = allowedOrigins(env);
  const ok = origin && list.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : list[0] || 'null',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * Salted SHA-256 of the client IP. The salt is a Worker secret, so the
 * stored digests cannot be reversed into addresses by anyone reading the DB.
 */
async function voterHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const data = new TextEncoder().encode(`${env.IP_SALT || 'dev-salt'}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function tally(env, pollId) {
  const { results } = await env.DB.prepare(
    'SELECT id, votes FROM poll_options WHERE poll = ? ORDER BY rowid'
  ).bind(pollId).all();
  return results || [];
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    /* ---------------- read the current tally ---------------- */
    if (request.method === 'GET') {
      const pollId = url.searchParams.get('poll');
      if (!pollId) return json({ error: 'missing poll' }, 400, cors);
      return json(await tally(env, pollId), 200, cors);
    }

    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, cors);
    }

    /* ---------------- cast a vote ---------------- */

    // Browsers cannot forge Origin, so this stops other sites embedding the
    // endpoint. It is not authentication — a script can send anything.
    if (origin && !allowedOrigins(env).includes(origin)) {
      return json({ error: 'origin not allowed' }, 403, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400, cors);
    }

    const pollId = String(body.poll || '');
    const option = body.option === null ? null : String(body.option || '');
    const previous = body.previous === null || body.previous === undefined
      ? null
      : String(body.previous);

    if (!pollId) return json({ error: 'missing poll' }, 400, cors);

    // Only options that already exist in the table can be voted for. This is
    // the whitelist — never trust the client to name a column or a row.
    const valid = new Set((await tally(env, pollId)).map((r) => r.id));
    if (option !== null && !valid.has(option)) {
      return json({ error: 'unknown option' }, 400, cors);
    }
    if (previous !== null && !valid.has(previous)) {
      return json({ error: 'unknown previous option' }, 400, cors);
    }
    if (option === null && previous === null) {
      return json({ error: 'nothing to do' }, 400, cors);
    }

    const voter = await voterHash(request, env);
    const now = Date.now();

    /* -- rate limit: cap how many times one connection can vote per hour -- */
    const seen = await env.DB.prepare(
      'SELECT hits, window_start FROM voters WHERE poll = ? AND voter = ?'
    ).bind(pollId, voter).first();

    let hits = 1;
    let windowStart = now;
    if (seen) {
      const fresh = now - Number(seen.window_start) < RATE_WINDOW_MS;
      hits = fresh ? Number(seen.hits) + 1 : 1;
      windowStart = fresh ? Number(seen.window_start) : now;
      if (hits > RATE_LIMIT) {
        return json({ error: 'rate limited' }, 429, { ...cors, 'Retry-After': '3600' });
      }
    }

    /* -- apply the change atomically ------------------------------------- */
    const statements = [];
    if (previous) {
      statements.push(
        env.DB.prepare(
          'UPDATE poll_options SET votes = MAX(votes - 1, 0) WHERE poll = ? AND id = ?'
        ).bind(pollId, previous)
      );
    }
    if (option) {
      statements.push(
        env.DB.prepare(
          'UPDATE poll_options SET votes = votes + 1 WHERE poll = ? AND id = ?'
        ).bind(pollId, option)
      );
    }
    statements.push(
      env.DB.prepare(
        `INSERT INTO voters (poll, voter, hits, window_start, seen_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(poll, voter) DO UPDATE SET
           hits = ?3, window_start = ?4, seen_at = ?5`
      ).bind(pollId, voter, hits, windowStart, now)
    );

    await env.DB.batch(statements);

    return json(await tally(env, pollId), 200, cors);
  },

  /** Housekeeping: drop voter hashes we no longer need. */
  async scheduled(event, env) {
    await env.DB.prepare('DELETE FROM voters WHERE seen_at < ?')
      .bind(Date.now() - VOTER_TTL_MS).run();
  },
};
