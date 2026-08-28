# TAPPA Quarterly — poll backend

One Cloudflare Worker and one D1 (SQLite) table. That is the whole backend.

Everything else on the site is static, so there is no server to patch and
nothing that breaks when the editors change over.

**The site works without this.** If `data-api` on the poll is left empty, the
poll falls back to a browser-local mock. Deploy this when you want the counts
to add up across readers.

---

## Deploy (about 10 minutes, once)

You need a free Cloudflare account and Node installed locally.

```bash
cd backend
npm install -g wrangler
wrangler login
```

**1. Create the database**

```bash
wrangler d1 create tappa-poll
```

Copy the `database_id` it prints into `wrangler.toml`.

**2. Create the tables and seed the options**

```bash
wrangler d1 execute tappa-poll --remote --file=schema.sql
```

**3. Set the IP salt** — any long random string. This is a *secret*, so it
never goes in `wrangler.toml` or the repo:

```bash
wrangler secret put IP_SALT
```

Generate one with `openssl rand -hex 32`.

**4. Check the allowed origins** in `wrangler.toml`. Only these sites can call
the endpoint from a browser.

**5. Deploy**

```bash
wrangler deploy
```

Wrangler prints a URL like `https://tappa-poll.<your-account>.workers.dev`.

**6. Point the site at it** — in `index.html`:

```html
<div class="poll" id="poll" data-poll="coffee-2026-00"
     data-api="https://tappa-poll.<your-account>.workers.dev">
```

Done. Commit and push; GitHub Pages picks it up.

---

## Running it locally

```bash
wrangler d1 execute tappa-poll --local --file=schema.sql
wrangler dev
```

Then set `data-api="http://localhost:8787"` while you test. `localhost:8000` is
already in the allowed origins.

---

## A new poll each issue

Add rows with a new poll id, then point the markup at it:

```sql
INSERT INTO poll_options (poll, id, label, votes) VALUES
  ('lunch-2026-01', 'a', 'Option A', 0),
  ('lunch-2026-01', 'b', 'Option B', 0);
```

```html
<div class="poll" id="poll" data-poll="lunch-2026-01" data-api="...">
```

The button markup needs matching `data-key` values. Old polls keep their counts.

## Reading the results

```bash
wrangler d1 execute tappa-poll --remote \
  --command="SELECT id, label, votes FROM poll_options WHERE poll='coffee-2026-00'"
```

---

## What this stores

| Table | Contents |
|---|---|
| `poll_options` | poll id, option id, label, vote count |
| `voters` | poll id, **salted SHA-256 of the IP**, request count, timestamps |

No names, no email addresses, no raw IPs, no cookies set by the server. The
only thing in the reader's browser is a `localStorage` key remembering which
option *they* picked, so the page can show it ticked.

The IP hash exists solely to rate-limit, is salted with a secret so it cannot
be reversed by anyone reading the database, and the nightly cron deletes rows
older than 90 days.

Because no personal data is retained, this needs no consent banner. Mention it
in your privacy notice anyway — one sentence is enough.

---

## Known limits — worth being honest about

- **It is not ballot-proof.** Rate limiting by IP hash stops casual repeat
  voting. It does not stop someone determined with a VPN, and shared
  university NAT means a whole building can look like one address (the limit
  is 20/hour to allow for that). It is a coffee poll — do not report the result
  as a survey.
- **`Origin` checking is not authentication.** It stops other websites
  embedding the endpoint. A script can send whatever it likes. Never put
  anything behind this endpoint you would mind being public.
- **Cost.** Cloudflare's free tier is far above anything this will see, and it
  stops serving rather than billing you — which is the failure mode you want
  for a student organisation. Do not add a payment method.

## If you want to turn it off

Delete the `data-api` value in `index.html`. The poll silently reverts to the
local mock and the page keeps working. Then `wrangler delete` at your leisure.
