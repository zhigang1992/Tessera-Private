-- Migration: Eligibility-only mock trading volumes for QA/testing.
-- Created: 2026-04-20
--
-- Lets us seed a USD volume for a specific wallet so we can exercise the
-- eligibility check without requiring real swap activity on-chain. This table
-- is read ONLY by functions/api/eligibility/trading-volume.ts — do not wire it
-- into any other surface (leaderboard, referral payouts, etc.).
--
-- Populate via `wrangler d1 execute tessera-referral-db --command "..."`.
-- A row keyed on a parent wallet short-circuits the Hasura aggregation and
-- returns the stored volume_usd verbatim.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mock_trading_volumes (
  wallet_address TEXT PRIMARY KEY,
  volume_usd     REAL NOT NULL,
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
