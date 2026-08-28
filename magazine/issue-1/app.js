/* ==========================================================================
   TAPPA Quarterly — interactions
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Reading progress + current section in the rail
     ------------------------------------------------------------------ */
  (function progressRail() {
    var bar = document.getElementById('progress');
    var links = [].slice.call(document.querySelectorAll('#nav a'));
    if (!bar || !links.length) return;
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var ticking = false;

    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      var current = -1;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] && sections[i].getBoundingClientRect().top <= 120) current = i;
      }
      links.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------
     Reveal figures and cards on scroll
     ------------------------------------------------------------------ */
  (function reveal() {
    var targets = document.querySelectorAll('.fig, .card, .break, .stat-tile');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      [].forEach.call(targets, function (t) { t.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    [].forEach.call(targets, function (t) { io.observe(t); });
  })();

  /* ------------------------------------------------------------------
     Estimated reading time
     ------------------------------------------------------------------ */
  (function readingTime() {
    var el = document.getElementById('read-time');
    if (!el) return;
    var article = document.getElementById('people');
    var words = article.textContent.trim().split(/\s+/).length;
    el.textContent = Math.max(1, Math.round(words / 220)) + ' min read';
  })();

  /* ------------------------------------------------------------------
     Cover — a drifting field of sampled curves
     ------------------------------------------------------------------ */
  (function coverField() {
    var canvas = document.getElementById('cover-field');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, raf = null;

    // each curve is a sum of sines with its own phases and drift speeds
    var curves = [];
    for (var i = 0; i < 7; i++) {
      var terms = [];
      for (var k = 0; k < 4; k++) {
        terms.push({
          amp: (18 + Math.random() * 42) / (k + 1),
          freq: (0.6 + Math.random() * 1.8) * (k + 1),
          phase: Math.random() * Math.PI * 2,
          speed: (0.06 + Math.random() * 0.16) * (Math.random() < 0.5 ? -1 : 1)
        });
      }
      curves.push({ terms: terms, offset: 0.16 + i * 0.115, alpha: 0.10 + Math.random() * 0.16 });
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var steps = Math.max(60, Math.round(w / 8));
      curves.forEach(function (c) {
        ctx.beginPath();
        for (var s = 0; s <= steps; s++) {
          var x = s / steps;
          var y = c.offset * h;
          for (var j = 0; j < c.terms.length; j++) {
            var tm = c.terms[j];
            y += tm.amp * Math.sin(tm.freq * x * Math.PI * 2 + tm.phase + tm.speed * t);
          }
          s === 0 ? ctx.moveTo(x * w, y) : ctx.lineTo(x * w, y);
        }
        ctx.strokeStyle = 'rgba(123, 224, 192, ' + c.alpha + ')';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });
    }

    function loop(now) {
      draw(now / 1000);
      raf = window.requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', function () {
      resize();
      if (reduceMotion) draw(0);
    });

    if (reduceMotion) { draw(0); return; }

    // pause the animation when the cover scrolls out of view
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && raf === null) raf = window.requestAnimationFrame(loop);
          else if (!e.isIntersecting && raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(canvas);
    } else {
      raf = window.requestAnimationFrame(loop);
    }
  })();

  /* ------------------------------------------------------------------
     Interactive figure — a Gaussian process posterior the reader feeds
     ------------------------------------------------------------------ */
  (function gpFigure() {
    var canvas = document.getElementById('gp-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var resetBtn = document.getElementById('gp-reset');
    var countEl = document.getElementById('gp-count');

    var LENGTH = 0.13, SIGMA_F = 1.0, SIGMA_N = 0.06;
    var GRID = 160;
    var seed = [[0.16, 0.62], [0.44, -0.35], [0.78, 0.30]];
    var points = seed.map(function (p) { return p.slice(); });
    var w = 0, h = 0;

    function kernel(a, b) {
      var d = a - b;
      return SIGMA_F * SIGMA_F * Math.exp(-(d * d) / (2 * LENGTH * LENGTH));
    }

    // Cholesky decomposition of a small symmetric positive-definite matrix
    function cholesky(A) {
      var n = A.length, L = [];
      for (var i = 0; i < n; i++) L.push(new Array(n).fill(0));
      for (i = 0; i < n; i++) {
        for (var j = 0; j <= i; j++) {
          var sum = A[i][j];
          for (var k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
          if (i === j) L[i][j] = Math.sqrt(Math.max(sum, 1e-9));
          else L[i][j] = sum / L[j][j];
        }
      }
      return L;
    }

    function solveWithChol(L, b) {
      var n = L.length, y = new Array(n), x = new Array(n), i, k, s;
      for (i = 0; i < n; i++) {
        s = b[i];
        for (k = 0; k < i; k++) s -= L[i][k] * y[k];
        y[i] = s / L[i][i];
      }
      for (i = n - 1; i >= 0; i--) {
        s = y[i];
        for (k = i + 1; k < n; k++) s -= L[k][i] * x[k];
        x[i] = s / L[i][i];
      }
      return x;
    }

    function posterior() {
      var n = points.length;
      var xs = [], mean = [], sd = [], i, j;
      for (i = 0; i <= GRID; i++) xs.push(i / GRID);

      if (n === 0) {
        for (i = 0; i <= GRID; i++) { mean.push(0); sd.push(SIGMA_F); }
        return { xs: xs, mean: mean, sd: sd };
      }

      var K = [], y = [];
      for (i = 0; i < n; i++) {
        K.push([]);
        y.push(points[i][1]);
        for (j = 0; j < n; j++) {
          K[i].push(kernel(points[i][0], points[j][0]) + (i === j ? SIGMA_N * SIGMA_N : 0));
        }
      }
      var L = cholesky(K);
      var alpha = solveWithChol(L, y);

      for (i = 0; i <= GRID; i++) {
        var ks = [];
        for (j = 0; j < n; j++) ks.push(kernel(xs[i], points[j][0]));
        var m = 0;
        for (j = 0; j < n; j++) m += ks[j] * alpha[j];
        var v = solveWithChol(L, ks);
        var varr = SIGMA_F * SIGMA_F;
        for (j = 0; j < n; j++) varr -= ks[j] * v[j];
        mean.push(m);
        sd.push(Math.sqrt(Math.max(varr, 0)));
      }
      return { xs: xs, mean: mean, sd: sd };
    }

    function toPx(x, yv) {
      return [x * w, h / 2 - yv * (h / 2 - 22) / 1.9];
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function band(p, mult, alpha) {
      ctx.beginPath();
      var i, pt;
      for (i = 0; i <= GRID; i++) {
        pt = toPx(p.xs[i], p.mean[i] + mult * p.sd[i]);
        i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
      }
      for (i = GRID; i >= 0; i--) {
        pt = toPx(p.xs[i], p.mean[i] - mult * p.sd[i]);
        ctx.lineTo(pt[0], pt[1]);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 122, 95, ' + alpha + ')';
      ctx.fill();
    }

    function draw() {
      var p = posterior();
      ctx.clearRect(0, 0, w, h);

      // baseline
      ctx.beginPath();
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.strokeStyle = '#D8D8D2'; ctx.lineWidth = 1; ctx.stroke();

      band(p, 2, 0.09);
      band(p, 1, 0.14);

      // posterior mean
      ctx.beginPath();
      for (var i = 0; i <= GRID; i++) {
        var pt = toPx(p.xs[i], p.mean[i]);
        i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
      }
      ctx.strokeStyle = '#0F7A5F'; ctx.lineWidth = 2.4; ctx.stroke();

      // observations
      points.forEach(function (pt) {
        var c = toPx(pt[0], pt[1]);
        ctx.beginPath(); ctx.arc(c[0], c[1], 5, 0, Math.PI * 2);
        ctx.fillStyle = '#141414'; ctx.fill();
        ctx.strokeStyle = '#FAF7F1'; ctx.lineWidth = 1.5; ctx.stroke();
      });

      if (countEl) {
        countEl.textContent = points.length === 1
          ? '1 observation'
          : points.length + ' observations';
      }
    }

    function addPoint(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      var x = (clientX - r.left) / r.width;
      var yv = ((r.height / 2) - (clientY - r.top)) / ((r.height / 2 - 22) / 1.9);
      if (x < 0 || x > 1) return;
      points.push([x, Math.max(-1.9, Math.min(1.9, yv))]);
      if (points.length > 14) points.shift();
      draw();
    }

    canvas.addEventListener('click', function (e) { addPoint(e.clientX, e.clientY); });

    canvas.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        points.push([Math.random(), (Math.random() * 2 - 1) * 1.4]);
        if (points.length > 14) points.shift();
        draw();
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        points = seed.map(function (p) { return p.slice(); });
        draw();
      });
    }

    window.addEventListener('resize', resize);
    resize();
  })();

  /* ------------------------------------------------------------------
     Coffee poll
     ------------------------------------------------------------------ */
  (function coffeePoll() {
    var poll = document.getElementById('poll');
    if (!poll) return;

    // Set this to the deployed Worker URL (see backend/README.md).
    // While it is empty the poll runs against a local mock so the page still
    // works offline and on a plain `python -m http.server`.
    var API = poll.dataset.api || '';

    var pollId = poll.dataset.poll;
    var storeKey = 'tappa-poll-' + pollId;
    var mockKey = 'tappa-mock-' + pollId;
    var options = [].slice.call(poll.querySelectorAll('.poll-option'));
    var status = document.getElementById('poll-status');
    var reset = document.getElementById('poll-reset');
    var busy = false;

    function readVote() {
      try { return window.localStorage.getItem(storeKey); } catch (e) { return null; }
    }
    function writeVote(v) {
      try {
        v === null ? window.localStorage.removeItem(storeKey)
                   : window.localStorage.setItem(storeKey, v);
      } catch (e) { /* private mode — the marker just won't persist */ }
    }

    /* -- local mock, used only when no API URL is configured -------------- */
    function mockRead() {
      var base = {};
      options.forEach(function (o) { base[o.dataset.key] = Number(o.dataset.base); });
      try {
        var saved = JSON.parse(window.localStorage.getItem(mockKey) || 'null');
        if (saved) Object.keys(base).forEach(function (k) {
          if (typeof saved[k] === 'number') base[k] = saved[k];
        });
      } catch (e) { /* fall back to the seeded counts */ }
      return base;
    }
    function mockWrite(counts) {
      try { window.localStorage.setItem(mockKey, JSON.stringify(counts)); } catch (e) {}
    }

    /* -- transport -------------------------------------------------------- */
    function getCounts() {
      if (!API) return Promise.resolve(mockRead());
      return fetch(API + '?poll=' + encodeURIComponent(pollId), { mode: 'cors' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (rows) {
          var counts = {};
          rows.forEach(function (row) { counts[row.id] = Number(row.votes) || 0; });
          return counts;
        });
    }

    function sendVote(key, previous) {
      if (!API) {
        var counts = mockRead();
        if (previous && counts[previous] > 0) counts[previous]--;
        if (key) counts[key] = (counts[key] || 0) + 1;
        mockWrite(counts);
        return Promise.resolve(counts);
      }
      return fetch(API, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll: pollId, option: key, previous: previous })
      }).then(function (r) {
        if (r.status === 429) throw new Error('rate-limited');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (rows) {
        var counts = {};
        rows.forEach(function (row) { counts[row.id] = Number(row.votes) || 0; });
        return counts;
      });
    }

    /* -- rendering -------------------------------------------------------- */
    function paint(counts, animate) {
      var vote = readVote(), total = 0;
      options.forEach(function (o) { total += Number(counts[o.dataset.key] || 0); });

      options.forEach(function (o) {
        var n = Number(counts[o.dataset.key] || 0);
        var pct = total ? Math.round(n / total * 100) : 0;
        var fill = o.querySelector('.fill');
        fill.style.transition = animate && !reduceMotion ? 'width .45s cubic-bezier(.2,.7,.3,1)' : 'none';
        fill.style.width = pct + '%';
        o.querySelector('.pct').textContent = pct + '%';
        var mine = vote === o.dataset.key;
        o.classList.toggle('is-mine', mine);
        o.setAttribute('aria-pressed', mine ? 'true' : 'false');
      });

      if (vote) {
        var chosen = options.filter(function (o) { return o.dataset.key === vote; })[0];
        status.textContent = 'You voted for ' + chosen.querySelector('.poll-label').textContent +
                             ' · ' + total + ' votes counted.';
        reset.hidden = false;
      } else {
        status.textContent = 'Cast your vote — pick one. ' + total + ' votes so far.';
        reset.hidden = true;
      }
    }

    function refresh(animate) {
      return getCounts()
        .then(function (counts) { paint(counts, animate); })
        .catch(function () {
          status.textContent = 'Could not reach the vote server — showing the last known counts.';
        });
    }

    function cast(key) {
      if (busy) return;
      busy = true;
      poll.classList.add('is-busy');
      var previous = readVote();
      var next = previous === key ? null : key;   // clicking your own choice clears it
      writeVote(next);
      sendVote(next, previous)
        .then(function (counts) { paint(counts, true); })
        .catch(function (err) {
          writeVote(previous);                    // roll the marker back
          status.textContent = err.message === 'rate-limited'
            ? 'Too many votes from this connection — try again in a minute.'
            : 'Your vote did not reach the server. Please try again.';
        })
        .then(function () { busy = false; poll.classList.remove('is-busy'); });
    }

    options.forEach(function (o) {
      o.addEventListener('click', function () { cast(o.dataset.key); });
    });
    reset.addEventListener('click', function () {
      var previous = readVote();
      if (previous) cast(previous);               // casting the same key clears it
    });

    refresh(false);
  })();

  /* ------------------------------------------------------------------
     Conference footprint estimator
     ------------------------------------------------------------------ */
  (function flightEstimator() {
    var form = document.getElementById('estimator');
    if (!form) return;

    var trips = document.getElementById('est-trips');
    var km = document.getElementById('est-km');
    var factor = document.getElementById('est-factor');
    var outTotal = document.getElementById('est-total');
    var outTrain = document.getElementById('est-compare');
    var outBar = document.getElementById('est-bar');

    function fmt(n) {
      return n >= 1000 ? (n / 1000).toFixed(1) + ' t' : Math.round(n) + ' kg';
    }

    function update() {
      var t = Math.max(0, Number(trips.value) || 0);
      var d = Math.max(0, Number(km.value) || 0);
      var f = Math.max(0, Number(factor.value) || 0);
      var total = t * d * 2 * f;                 // return trips
      outTotal.textContent = fmt(total);
      // a rough reference point the editors should replace with a sourced figure
      outTrain.textContent = fmt(total * 0.12);
      outBar.style.width = Math.min(100, total / 40) + '%';
      [].forEach.call(form.querySelectorAll('output'), function (o) {
        o.classList.remove('flash');
        void o.offsetWidth;
        if (!reduceMotion) o.classList.add('flash');
      });
    }

    [trips, km, factor].forEach(function (i) {
      i.addEventListener('input', update);
    });
    update();
  })();

  /* ------------------------------------------------------------------
     Copy a link to any chapter
     ------------------------------------------------------------------ */
  (function chapterLinks() {
    var heads = document.querySelectorAll('.chapter[id] .chapter-head');
    [].forEach.call(heads, function (head) {
      var id = head.closest('.chapter').id;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter-link';
      btn.setAttribute('aria-label', 'Copy a link to this section');
      btn.textContent = 'Link';
      btn.addEventListener('click', function () {
        var href = location.origin + location.pathname + '#' + id;
        var done = function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-done');
          window.setTimeout(function () {
            btn.textContent = 'Link';
            btn.classList.remove('is-done');
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(href).then(done, function () { location.hash = id; });
        } else {
          location.hash = id;
        }
      });
      head.appendChild(btn);
    });
  })();

  /* ------------------------------------------------------------------
     Lightbox — enlarge any figure
     ------------------------------------------------------------------ */
  (function lightbox() {
    var dialog = document.getElementById('lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var stage = document.getElementById('lightbox-stage');
    var caption = document.getElementById('lightbox-caption');
    var closeBtn = document.getElementById('lightbox-close');

    // every figure image except the live canvas and the deliberately empty slot
    var frames = document.querySelectorAll('figure .ph:not(.gp-stage):not(.ph-empty)');

    [].forEach.call(frames, function (frame) {
      var zoom = document.createElement('button');
      zoom.type = 'button';
      zoom.className = 'ph-zoom';
      zoom.innerHTML = '<span aria-hidden="true">⤢</span>';
      zoom.setAttribute('aria-label', 'Enlarge this figure');

      zoom.addEventListener('click', function () {
        var art = frame.querySelector('svg, img');
        stage.innerHTML = '';
        if (art) stage.appendChild(art.cloneNode(true));

        var fig = frame.closest('figure');
        var cap = fig && fig.querySelector('figcaption');
        caption.textContent = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '';
        dialog.showModal();
      });

      frame.appendChild(zoom);
    });

    closeBtn.addEventListener('click', function () { dialog.close(); });

    // click the backdrop to dismiss
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () { stage.innerHTML = ''; });
  })();

  /* ------------------------------------------------------------------
     Flashcards — German word and idiom
     ------------------------------------------------------------------ */
  (function flashcards() {
    var cards = document.querySelectorAll('.flash');
    [].forEach.call(cards, function (card) {
      card.addEventListener('click', function () {
        var open = card.getAttribute('aria-pressed') === 'true';
        card.setAttribute('aria-pressed', open ? 'false' : 'true');
        card.classList.toggle('is-flipped', !open);
      });
    });
  })();

  /* ------------------------------------------------------------------
     What's on — filtering and .ics download
     ------------------------------------------------------------------ */
  (function calendar() {
    var cal = document.getElementById('calendar');
    if (!cal) return;

    var chips = [].slice.call(cal.querySelectorAll('.cal-chip'));
    var items = [].slice.call(cal.querySelectorAll('.cal-item'));
    var count = document.getElementById('cal-count');
    var allBtn = document.getElementById('cal-all');

    function applyFilter(kind) {
      var shown = 0;
      items.forEach(function (li) {
        // events carry several tags, e.g. "academic scientific entrepreneurial"
        var tags = (li.dataset.kind || '').split(/\s+/);
        var match = kind === 'all' || tags.indexOf(kind) !== -1;
        li.hidden = !match;
        if (match) shown++;
      });
      count.textContent = shown === 1 ? '1 event' : shown + ' events';
      chips.forEach(function (c) {
        var on = c.dataset.filter === kind;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () { applyFilter(c.dataset.filter); });
    });

    /* -- iCalendar generation ------------------------------------------ */
    // timed values are floating local times; all-day values are plain dates
    function stampTime(local) { return local.replace(/[-:]/g, '') + '00'; }
    function stampDate(local) { return local.replace(/-/g, ''); }

    function escapeICS(s) {
      return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    }

    function toEvent(li) {
      var allDay = li.dataset.allday === 'true';
      var link = li.querySelector('.cal-title');
      var desc = li.querySelector('.cal-desc');
      var body = (desc ? desc.textContent.trim() + ' ' : '') +
                 (link && link.href ? link.href + ' ' : '') +
                 '— TAPPA Quarterly, Issue 00.';

      var lines = [
        'BEGIN:VEVENT',
        'UID:' + stampDate(li.dataset.start) + '-' +
                 Math.random().toString(36).slice(2, 8) + '@tappa-quarterly',
        'DTSTAMP:' + stampTime(new Date().toISOString().slice(0, 16)) + 'Z'
      ];

      if (allDay) {
        // DTEND is exclusive for all-day events: the day *after* the last one
        lines.push('DTSTART;VALUE=DATE:' + stampDate(li.dataset.start));
        lines.push('DTEND;VALUE=DATE:' + stampDate(li.dataset.end));
      } else {
        lines.push('DTSTART:' + stampTime(li.dataset.start));
        lines.push('DTEND:' + stampTime(li.dataset.end));
      }

      lines.push('SUMMARY:' + escapeICS(li.dataset.title));
      lines.push('LOCATION:' + escapeICS(li.dataset.where));
      lines.push('DESCRIPTION:' + escapeICS(body));
      if (link && link.href) lines.push('URL:' + link.href);
      lines.push('END:VEVENT');
      return lines.join('\r\n');
    }
    function download(events, name) {
      var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TAPPA Quarterly//EN',
        'CALSCALE:GREGORIAN'
      ].concat(events).concat(['END:VCALENDAR']).join('\r\n');

      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    items.forEach(function (li) {
      li.querySelector('.cal-add').addEventListener('click', function (e) {
        var btn = e.currentTarget;
        download([toEvent(li)], 'tappa-event.ics');
        btn.textContent = 'Added';
        btn.classList.add('is-done');
        window.setTimeout(function () {
          btn.textContent = 'Add';
          btn.classList.remove('is-done');
        }, 1600);
      });
    });

    allBtn.addEventListener('click', function () {
      var visible = items.filter(function (li) { return !li.hidden; });
      download(visible.map(toEvent), 'tappa-quarterly.ics');
    });

    applyFilter('all');
  })();

  /* ------------------------------------------------------------------
     Ice cream parlours — the ordering really is i.i.d.
     ------------------------------------------------------------------ */
  (function scoops() {
    var wrap = document.getElementById('scoops');
    if (!wrap) return;

    var cards = [].slice.call(wrap.querySelectorAll('.scoop'));
    var count = document.getElementById('scoops-count');
    var favBtn = document.getElementById('scoops-fav');
    var shuffleBtn = document.getElementById('scoops-shuffle');
    var favOnly = false;

    function tally() {
      var shown = cards.filter(function (c) { return !c.hidden; }).length;
      count.textContent = shown === 1 ? '1 parlour' : shown + ' parlours';
    }

    function applyFav() {
      cards.forEach(function (c) {
        c.hidden = favOnly && c.dataset.fav !== 'true';
      });
      favBtn.classList.toggle('is-on', favOnly);
      favBtn.setAttribute('aria-pressed', favOnly ? 'true' : 'false');
      tally();
    }

    function shuffle() {
      // Fisher–Yates, so the claim in the byline stays true
      var order = cards.slice();
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = order[i]; order[i] = order[j]; order[j] = t;
      }
      order.forEach(function (c) { wrap.appendChild(c); });
    }

    favBtn.addEventListener('click', function () { favOnly = !favOnly; applyFav(); });
    shuffleBtn.addEventListener('click', shuffle);

    shuffle();
    tally();
  })();

  /* ------------------------------------------------------------------
     Do You Know Your Reps? — quiz
     ------------------------------------------------------------------ */
  (function repsQuiz() {
    var quiz = document.getElementById('quiz');
    if (!quiz) return;

    // Placeholder content — replace with the real reps before publishing.
    var QUESTIONS = [
      {
        q: '[Question 1 — e.g. how many student reps does the programme have?]',
        options: ['[Answer A]', '[Answer B — correct]', '[Answer C]'],
        correct: 1
      },
      {
        q: '[Question 2 — e.g. who chairs the PhD council this year?]',
        options: ['[Answer A — correct]', '[Answer B]', '[Answer C]'],
        correct: 0
      },
      {
        q: '[Question 3 — e.g. how often does the council meet?]',
        options: ['[Answer A]', '[Answer B]', '[Answer C — correct]'],
        correct: 2
      },
      {
        q: '[Question 4 — e.g. where are the minutes published?]',
        options: ['[Answer A]', '[Answer B — correct]', '[Answer C]'],
        correct: 1
      },
      {
        q: '[Question 5 — e.g. who do you contact about contracts?]',
        options: ['[Answer A — correct]', '[Answer B]', '[Answer C]'],
        correct: 0
      }
    ];

    var stage = document.getElementById('quiz-stage');
    var stepEl = document.getElementById('quiz-step');
    var qEl = document.getElementById('quiz-q');
    var optsEl = document.getElementById('quiz-options');
    var fbEl = document.getElementById('quiz-feedback');
    var barEl = document.getElementById('quiz-bar');
    var resultEl = document.getElementById('quiz-result');
    var scoreEl = document.getElementById('quiz-score');
    var verdictEl = document.getElementById('quiz-verdict');
    var againBtn = document.getElementById('quiz-again');

    var index = 0, score = 0, locked = false;

    function paintBar() {
      barEl.style.width = (index / QUESTIONS.length * 100) + '%';
    }

    function show() {
      var item = QUESTIONS[index];
      locked = false;
      stepEl.textContent = 'Question ' + (index + 1) + ' of ' + QUESTIONS.length;
      qEl.textContent = item.q;
      fbEl.textContent = '';
      fbEl.className = 'quiz-feedback';
      optsEl.innerHTML = '';

      item.options.forEach(function (label, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-option';
        b.textContent = label;
        b.addEventListener('click', function () { answer(i, b); });
        optsEl.appendChild(b);
      });
      paintBar();
    }

    function answer(picked, btn) {
      if (locked) return;
      locked = true;

      var item = QUESTIONS[index];
      var right = picked === item.correct;
      if (right) score++;

      [].forEach.call(optsEl.children, function (b, i) {
        b.disabled = true;
        if (i === item.correct) b.classList.add('is-right');
        else if (i === picked) b.classList.add('is-wrong');
      });

      fbEl.textContent = right ? 'Correct.' : 'Not quite — the right answer is highlighted.';
      fbEl.className = 'quiz-feedback ' + (right ? 'is-right' : 'is-wrong');

      window.setTimeout(function () {
        index++;
        if (index < QUESTIONS.length) show();
        else finish();
      }, right ? 700 : 1400);
    }

    function finish() {
      barEl.style.width = '100%';
      stage.hidden = true;
      resultEl.hidden = false;
      scoreEl.textContent = score;
      verdictEl.textContent =
        score === QUESTIONS.length ? 'Full marks. You are almost certainly a rep.' :
        score >= QUESTIONS.length - 1 ? 'Close enough — you have been reading the minutes.' :
        score >= 2 ? 'A respectable showing. The minutes are online.' :
                     'Worth a look at the council page before the next meeting.';
    }

    againBtn.addEventListener('click', function () {
      index = 0; score = 0;
      stage.hidden = false;
      resultEl.hidden = true;
      show();
    });

    show();
  })();

  /* ------------------------------------------------------------------
     Guess the PI — matching puzzle
     ------------------------------------------------------------------ */
  (function matchPuzzle() {
    var puzzle = document.getElementById('puzzle');
    if (!puzzle) return;

    var status = document.getElementById('puzzle-status');
    var resetBtn = document.getElementById('puzzle-reset');
    var selected = null;
    var solved = 0;

    var tiles = [].slice.call(puzzle.querySelectorAll('.tile'));
    var totalPairs = tiles.length / 2;

    function shuffleColumn(sel) {
      var col = puzzle.querySelector(sel);
      var kids = [].slice.call(col.children);
      for (var i = kids.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        col.appendChild(kids[j]);
        kids.splice(j, 1);
      }
    }

    function clearSelection() {
      tiles.forEach(function (t) { t.classList.remove('is-selected'); });
      selected = null;
    }

    function onPick(tile) {
      if (tile.classList.contains('is-solved')) return;

      if (!selected) {
        selected = tile;
        tile.classList.add('is-selected');
        status.textContent = 'Now pick its match from the other column.';
        return;
      }
      if (selected === tile) { clearSelection(); status.textContent = 'Pick a name, then its first paper.'; return; }
      if (selected.dataset.side === tile.dataset.side) {
        clearSelection();
        selected = tile;
        tile.classList.add('is-selected');
        return;
      }

      if (selected.dataset.pair === tile.dataset.pair) {
        [selected, tile].forEach(function (t) {
          t.classList.remove('is-selected');
          t.classList.add('is-solved');
          t.setAttribute('aria-disabled', 'true');
        });
        selected = null;
        solved++;
        status.textContent = solved === totalPairs
          ? 'All matched — no peeking at the back page required.'
          : solved + ' of ' + totalPairs + ' matched.';
      } else {
        var wrong = [selected, tile];
        wrong.forEach(function (t) { t.classList.add('is-wrong'); });
        status.textContent = 'Not that one.';
        window.setTimeout(function () {
          wrong.forEach(function (t) { t.classList.remove('is-wrong', 'is-selected'); });
        }, 480);
        selected = null;
      }
    }

    tiles.forEach(function (t) {
      t.addEventListener('click', function () { onPick(t); });
    });

    resetBtn.addEventListener('click', function () {
      solved = 0;
      clearSelection();
      tiles.forEach(function (t) {
        t.classList.remove('is-solved', 'is-wrong');
        t.removeAttribute('aria-disabled');
      });
      shuffleColumn('.tile-col-b');
      status.textContent = 'Pick a name, then its first paper.';
    });

    shuffleColumn('.tile-col-b');
  })();

})();
