-- Migration: Parent/child wallet links for eligibility volume aggregation.
-- Created: 2026-04-18
--
-- A "child" wallet signs a nonce-bound message proving ownership and binds to
-- a single "parent" wallet. Trading volumes from all verified children are
-- aggregated to the parent when computing eligibility.
--
-- Rules (enforced in API layer, indexes below support them):
--   * One child has at most one parent (PRIMARY KEY on child_wallet).
--   * A parent can have many children.
--   * Linking is one-way and permanent — no unlink flow yet.
--   * A wallet cannot be both a parent and a child (checked in API).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wallet_links (
  child_wallet  TEXT PRIMARY KEY,
  parent_wallet TEXT NOT NULL,
  nonce         TEXT NOT NULL,
  message       TEXT NOT NULL,
  signature     TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wallet_links_parent ON wallet_links(parent_wallet);
