-- TAPPA Quarterly poll — D1 schema
--
-- Two tables. `poll_options` holds the tally; `voters` holds nothing but a
-- salted hash and a timestamp, so there is no personal data to protect.

DROP TABLE IF EXISTS poll_options;
DROP TABLE IF EXISTS voters;

CREATE TABLE poll_options (
  poll  TEXT NOT NULL,
  id    TEXT NOT NULL,
  label TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (poll, id)
);

CREATE TABLE voters (
  poll         TEXT    NOT NULL,
  voter        TEXT    NOT NULL,   -- salted SHA-256 of the client IP
  hits         INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  seen_at      INTEGER NOT NULL,
  PRIMARY KEY (poll, voter)
);

CREATE INDEX idx_voters_seen ON voters (seen_at);

-- Issue 00 · Best Coffee, Settled.
-- Seeded with the counts printed in the magazine; set them to 0 to start clean.
INSERT INTO poll_options (poll, id, label, votes) VALUES
  ('coffee-2026-00', 'cafe1', 'Café no. 1',      41),
  ('coffee-2026-00', 'cafe2', 'Café no. 2',      29),
  ('coffee-2026-00', 'cafe3', 'Café no. 3',      19),
  ('coffee-2026-00', 'lab',   'The lab machine', 11);
