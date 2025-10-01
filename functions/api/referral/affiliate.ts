import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import { authenticateRequest, ensureUserExists } from '../../lib/middleware';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type ReferrerMetrics = {
  wallet_address: string;
  rebates_total: number;
  referral_points: number;
  l1_trader_count: number;
  l2_trader_count: number;
  l3_trader_count: number;
  snapshot_at: string;
};

type User = {
  wallet_address: string;
  display_name: string | null;
  email: string | null;
  email_verified: number;
};

type ReferralCode = {
  id: number;
  wallet_address: string;
  code_slug: string;
  status: string;
  active_layer: number;
  created_at: string;
  updated_at: string;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authResult = await authenticateRequest(request, env);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  const { walletAddress } = authResult.context;

  await ensureUserExists(walletAddress, env.DB);

  // Fetch user info
  const user = await env.DB.prepare('SELECT * FROM users WHERE wallet_address = ?')
    .bind(walletAddress)
    .first<User>();

  // Fetch referrer metrics
  let metrics = await env.DB.prepare('SELECT * FROM metrics_referrer WHERE wallet_address = ?')
    .bind(walletAddress)
    .first<ReferrerMetrics>();

  if (!metrics) {
    // Create default metrics
    await env.DB.prepare(
      'INSERT INTO metrics_referrer (wallet_address, rebates_total, referral_points, l1_trader_count, l2_trader_count, l3_trader_count) VALUES (?, 0, 0, 0, 0, 0)',
    )
      .bind(walletAddress)
      .run();

    metrics = {
      wallet_address: walletAddress,
      rebates_total: 0,
      referral_points: 0,
      l1_trader_count: 0,
      l2_trader_count: 0,
      l3_trader_count: 0,
      snapshot_at: new Date().toISOString(),
    };
  }

  // Fetch referral codes for this affiliate
  const codes = await env.DB.prepare('SELECT * FROM referral_codes WHERE wallet_address = ? ORDER BY created_at DESC')
    .bind(walletAddress)
    .all<ReferralCode>();

  // Calculate real-time tree counts from edges (more accurate than cached metrics)
  const l1Count = await env.DB.prepare('SELECT COUNT(DISTINCT descendant_wallet) as count FROM referral_tree_edges WHERE ancestor_wallet = ? AND level = 1')
    .bind(walletAddress)
    .first<{ count: number }>();

  const l2Count = await env.DB.prepare('SELECT COUNT(DISTINCT descendant_wallet) as count FROM referral_tree_edges WHERE ancestor_wallet = ? AND level = 2')
    .bind(walletAddress)
    .first<{ count: number }>();

  const l3Count = await env.DB.prepare('SELECT COUNT(DISTINCT descendant_wallet) as count FROM referral_tree_edges WHERE ancestor_wallet = ? AND level = 3')
    .bind(walletAddress)
    .first<{ count: number }>();

  // Fetch actual wallet addresses at each level for tree visualization
  const l1Traders = await env.DB.prepare(
    'SELECT DISTINCT descendant_wallet FROM referral_tree_edges WHERE ancestor_wallet = ? AND level = 1 ORDER BY descendant_wallet',
  )
    .bind(walletAddress)
    .all<{ descendant_wallet: string }>();

  const l2Traders = await env.DB.prepare(
    'SELECT DISTINCT descendant_wallet FROM referral_tree_edges WHERE ancestor_wallet = ? AND level = 2 ORDER BY descendant_wallet',
  )
    .bind(walletAddress)
    .all<{ descendant_wallet: string }>();

  const l3Traders = await env.DB.prepare(
    'SELECT DISTINCT descendant_wallet FROM referral_tree_edges WHERE ancestor_wallet = ? AND level = 3 ORDER BY descendant_wallet',
  )
    .bind(walletAddress)
    .all<{ descendant_wallet: string }>();

  return Response.json({
    walletAddress,
    displayName: user?.display_name ?? null,
    email: user?.email ?? null,
    emailVerified: user?.email_verified === 1,
    metrics: {
      rebatesTotal: metrics.rebates_total,
      referralPoints: metrics.referral_points,
      snapshotAt: metrics.snapshot_at,
    },
    referralCodes: codes.results.map((code) => ({
      id: code.id,
      codeSlug: code.code_slug,
      status: code.status,
      activeLayer: code.active_layer,
      createdAt: code.created_at,
      updatedAt: code.updated_at,
    })),
    tree: {
      l1TraderCount: l1Count?.count ?? 0,
      l2TraderCount: l2Count?.count ?? 0,
      l3TraderCount: l3Count?.count ?? 0,
      totalTraderCount: (l1Count?.count ?? 0) + (l2Count?.count ?? 0) + (l3Count?.count ?? 0),
      l1Traders: l1Traders.results.map((t) => t.descendant_wallet),
      l2Traders: l2Traders.results.map((t) => t.descendant_wallet),
      l3Traders: l3Traders.results.map((t) => t.descendant_wallet),
    },
  });
};
