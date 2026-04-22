-- Migration: Pre-Sale 2 eligibility mock surfaces.
-- Created: 2026-04-22
--
-- Pre-Sale 2 introduces two new eligibility checks that need QA-controllable
-- mock data while the real backend/on-chain wiring catches up:
--
--   1. Snapshot trading volume (≥$1000 before the event snapshot date).
--      Piggy-backs on the existing mock_trading_volumes table via a new
--      snapshot_volume_usd column so one row per wallet covers both the
--      lifetime volume (Pre-Sale 1) and the snapshot volume (Pre-Sale 2).
--
--   2. Solana Mobile device ownership (Saga / Chapter 2 / Seeker Genesis
--      Token). Gets its own table — Solana Mobile eligibility is a pure
--      yes/no flag with no aggregation, and the check hits mainnet RPC
--      rather than Hasura, so it shares nothing with the volume flow.
--
-- Both are read ONLY by endpoints under functions/api/eligibility/.

PRAGMA foreign_keys = ON;

ALTER TABLE mock_trading_volumes
  ADD COLUMN snapshot_volume_usd REAL;

CREATE TABLE IF NOT EXISTS mock_solana_mobile (
  wallet_address TEXT PRIMARY KEY,
  eligible       INTEGER NOT NULL DEFAULT 1,
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
