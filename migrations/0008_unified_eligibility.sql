-- Migration: Unified pre-sale eligibility.
-- Created: 2026-04-23
--
-- Consolidates the two eligibility flows (Pre-Sale 1 + Pre-Sale 2) into one
-- any-of-three qualification model and reworks the application record:
--
--   * Drops token_id — the whitelist is now global per wallet, not per token.
--   * Drops status / reviewed_at — approve/reject flow is gone.
--   * Adds presale_1_selected — admin-controlled boolean for final selection.
--   * Adds qualified_via — which of the three options passed first.
--   * Adds snapshot_volume_usd + solana_mobile_eligible snapshots.
--   * Renames applied_at → qualified_at.
--
-- All existing rows are test data per product direction, so this is a
-- destructive drop + recreate rather than an in-place ALTER.

PRAGMA foreign_keys = ON;

DROP INDEX IF EXISTS idx_presale_whitelist_applications_status;
DROP TABLE IF EXISTS presale_whitelist_applications;

CREATE TABLE presale_whitelist_applications (
  wallet_address         TEXT NOT NULL PRIMARY KEY,
  qualified_via          TEXT NOT NULL,
  trading_volume_usd     REAL,
  snapshot_volume_usd    REAL,
  solana_mobile_eligible INTEGER,
  twitter_handle         TEXT,
  twitter_connected      INTEGER NOT NULL DEFAULT 0,
  social_post_found      INTEGER NOT NULL DEFAULT 0,
  social_post_tweet_url  TEXT,
  presale_1_selected     INTEGER NOT NULL DEFAULT 0,
  admin_note             TEXT,
  qualified_at           TEXT NOT NULL DEFAULT (datetime('now')),
  selected_at            TEXT
);

CREATE INDEX idx_presale_whitelist_applications_selected
  ON presale_whitelist_applications (presale_1_selected, qualified_at DESC);
