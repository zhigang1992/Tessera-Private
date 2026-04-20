PRAGMA foreign_keys = ON;

-- Cache of twitterapi.io advanced_search lookups for eligibility "social card posted" checks.
CREATE TABLE IF NOT EXISTS social_post_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  twitter_handle TEXT NOT NULL,
  found INTEGER NOT NULL DEFAULT 0,
  tweet_id TEXT,
  tweet_url TEXT,
  tweet_created_at TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_post_checks_wallet_token
  ON social_post_checks(wallet_address, token_id);
