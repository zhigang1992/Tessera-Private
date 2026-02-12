-- Migration: Email subscriptions for auction claim notifications
-- Created: 2025-02-12

PRAGMA foreign_keys = ON;

-- Table to store email subscriptions for wallet addresses
-- This table is NOT publicly visible - only accessible via API endpoint
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'auction_claim', -- Track where the email was captured (auction_claim, etc.)
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- Index for fast lookups by wallet address
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_wallet ON email_subscriptions(wallet_address);

-- Index for email lookups (in case we need to check duplicates)
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);

-- Index for source tracking
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_source ON email_subscriptions(source);
