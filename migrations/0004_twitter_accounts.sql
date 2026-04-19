PRAGMA foreign_keys = ON;

-- Persisted X/Twitter identity linked to a wallet after Dynamic-JWT verification.
CREATE TABLE IF NOT EXISTS user_twitter_accounts (
  wallet_address TEXT PRIMARY KEY,
  twitter_id TEXT NOT NULL,
  twitter_handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_user_twitter_handle ON user_twitter_accounts(twitter_handle);

-- Cache of twitterapi.io advanced_search lookups so we don't hammer the costliest endpoint.
CREATE TABLE IF NOT EXISTS referral_tweet_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  code_slug TEXT NOT NULL,
  twitter_handle TEXT NOT NULL,
  found INTEGER NOT NULL DEFAULT 0,
  tweet_id TEXT,
  tweet_url TEXT,
  tweet_created_at TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tweet_checks_wallet_code
  ON referral_tweet_checks(wallet_address, code_slug);
