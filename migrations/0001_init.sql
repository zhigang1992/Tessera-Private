PRAGMA foreign_keys = ON;

-- Core user record for each wallet interacting with the referral system.
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verification_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Referral codes generated or owned by affiliates.
CREATE TABLE IF NOT EXISTS referral_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  code_slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  active_layer INTEGER NOT NULL DEFAULT 1 CHECK(active_layer BETWEEN 1 AND 3),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_wallet ON referral_codes(wallet_address);

-- Trader binding to referral code (one active binding per trader wallet).
CREATE TABLE IF NOT EXISTS trader_bindings (
  wallet_address TEXT PRIMARY KEY,
  referrer_code_id INTEGER NOT NULL,
  bound_at TEXT NOT NULL DEFAULT (datetime('now')),
  bound_by_wallet TEXT NOT NULL,
  last_modified TEXT NOT NULL DEFAULT (datetime('now')),
  signature_hash TEXT,
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address),
  FOREIGN KEY (referrer_code_id) REFERENCES referral_codes(id)
);

CREATE INDEX IF NOT EXISTS idx_trader_bindings_code ON trader_bindings(referrer_code_id);

-- Materialized referral tree edges for fast aggregation (supports up to 3 levels).
CREATE TABLE IF NOT EXISTS referral_tree_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ancestor_wallet TEXT NOT NULL,
  descendant_wallet TEXT NOT NULL,
  level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 3),
  referrer_code_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ancestor_wallet) REFERENCES users(wallet_address),
  FOREIGN KEY (descendant_wallet) REFERENCES users(wallet_address),
  FOREIGN KEY (referrer_code_id) REFERENCES referral_codes(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tree_descendant_level ON referral_tree_edges(descendant_wallet, level);
CREATE INDEX IF NOT EXISTS idx_tree_ancestor_level ON referral_tree_edges(ancestor_wallet, level);

-- Trader performance metrics (aggregated from trading service).
CREATE TABLE IF NOT EXISTS metrics_trader (
  wallet_address TEXT PRIMARY KEY,
  trading_volume REAL NOT NULL DEFAULT 0,
  fee_rebate_total REAL NOT NULL DEFAULT 0,
  trading_points INTEGER NOT NULL DEFAULT 0,
  fee_discount_pct REAL NOT NULL DEFAULT 0,
  snapshot_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

-- Affiliate performance metrics.
CREATE TABLE IF NOT EXISTS metrics_referrer (
  wallet_address TEXT PRIMARY KEY,
  rebates_total REAL NOT NULL DEFAULT 0,
  referral_points INTEGER NOT NULL DEFAULT 0,
  l1_trader_count INTEGER NOT NULL DEFAULT 0,
  l2_trader_count INTEGER NOT NULL DEFAULT 0,
  l3_trader_count INTEGER NOT NULL DEFAULT 0,
  snapshot_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

-- Cached leaderboard snapshots.
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_at TEXT NOT NULL,
  expires_at TEXT,
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_expires ON leaderboard_snapshots(expires_at);

-- Auth nonces used for wallet signature verification.
CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'session',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet ON auth_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires ON auth_nonces(expires_at);
