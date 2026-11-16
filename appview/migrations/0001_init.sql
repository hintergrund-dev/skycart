-- Every DID that has published an indexed record. handle is only set once it verified in both directions.
CREATE TABLE actors (
  did TEXT PRIMARY KEY,
  handle TEXT,
  pds TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

-- check_status: pending | ok | failed; check_reason says why a check failed.
CREATE TABLE stores (
  did TEXT PRIMARY KEY,
  cid TEXT NOT NULL,
  json TEXT NOT NULL,
  name TEXT NOT NULL,
  check_status TEXT NOT NULL DEFAULT 'pending',
  check_reason TEXT,
  checked_at TEXT
);

CREATE TABLE items (
  uri TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  cid TEXT NOT NULL,
  json TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  condition TEXT NOT NULL,
  stock_status TEXT NOT NULL,
  gtin TEXT,
  group_id TEXT,
  host TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX items_did ON items (did, created_at DESC);
CREATE INDEX items_gtin ON items (gtin);
CREATE INDEX items_created ON items (created_at DESC);

CREATE VIRTUAL TABLE search USING fts5(uri UNINDEXED, did UNINDEXED, title, description, brand, shop);

CREATE TABLE reviews (
  uri TEXT PRIMARY KEY,
  cid TEXT NOT NULL,
  did TEXT NOT NULL,
  store_did TEXT NOT NULL,
  item_uri TEXT,
  rating INTEGER NOT NULL,
  text TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX reviews_store ON reviews (store_did, created_at DESC);
CREATE INDEX reviews_item ON reviews (item_uri);

CREATE TABLE replies (
  uri TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  review_uri TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX replies_review ON replies (review_uri);

-- Rating statistics used by the relevance boost: verified-purchase reviews only.
CREATE VIEW verified_stats AS
  SELECT store_did, COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE verified = 1 GROUP BY store_did;

-- Items (at-uri) or stores (did) hidden by an admin.
CREATE TABLE hidden (subject TEXT PRIMARY KEY);

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  reason TEXT NOT NULL,
  text TEXT,
  contact TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
