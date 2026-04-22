-- Migration: Pre-Sale 1 whitelist application tracking.
-- Created: 2026-04-22
--
-- Stores one row per (wallet, token) application. The user clicks "Apply
-- Whitelist" on the Pre-Sale 1 eligibility page; the server re-runs the same
-- eligibility checks (trading volume, Twitter connected, social post) and, if
-- they pass, inserts a pending row. Admins review via the admin page and flip
-- status to 'approved' or 'rejected'. Pre-Sale 2 has no manual application —
-- it is automatic — so this table is Pre-Sale-1-only.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS presale_whitelist_applications (
  wallet_address        TEXT NOT NULL,
  token_id              TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  trading_volume_usd    REAL,
  twitter_handle        TEXT,
  twitter_connected     INTEGER NOT NULL DEFAULT 0,
  social_post_found     INTEGER NOT NULL DEFAULT 0,
  social_post_tweet_url TEXT,
  admin_note            TEXT,
  applied_at            TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at           TEXT,
  PRIMARY KEY (wallet_address, token_id)
);

CREATE INDEX IF NOT EXISTS idx_presale_whitelist_applications_status
  ON presale_whitelist_applications (status, applied_at DESC);
