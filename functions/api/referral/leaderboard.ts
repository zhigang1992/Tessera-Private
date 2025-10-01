import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
  LEADERBOARD_CACHE: KVNamespace;
};

type LeaderboardEntry = {
  wallet_address: string;
  display_name: string | null;
  referral_points: number;
  rebates_total: number;
  l1_trader_count: number;
  l2_trader_count: number;
  l3_trader_count: number;
  total_trader_count: number;
};

const CACHE_KEY = 'leaderboard:global';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 100;

  // Try to fetch from cache first
  const cached = await env.LEADERBOARD_CACHE.get(CACHE_KEY, 'json');

  if (cached) {
    const data = cached as { entries: LeaderboardEntry[]; snapshotAt: string };
    return Response.json({
      entries: data.entries.slice(0, limit),
      snapshotAt: data.snapshotAt,
      cached: true,
    });
  }

  // Fetch live data
  const results = await env.DB.prepare(
    `SELECT
      m.wallet_address,
      u.display_name,
      m.referral_points,
      m.rebates_total,
      m.l1_trader_count,
      m.l2_trader_count,
      m.l3_trader_count,
      (m.l1_trader_count + m.l2_trader_count + m.l3_trader_count) as total_trader_count
    FROM metrics_referrer m
    LEFT JOIN users u ON m.wallet_address = u.wallet_address
    WHERE m.referral_points > 0
    ORDER BY m.referral_points DESC, m.rebates_total DESC
    LIMIT ?`,
  )
    .bind(limit)
    .all<LeaderboardEntry>();

  const snapshotAt = new Date().toISOString();

  const responseData = {
    entries: results.results.map((entry, index) => ({
      rank: index + 1,
      walletAddress: entry.wallet_address,
      displayName: entry.display_name,
      referralPoints: entry.referral_points,
      rebatesTotal: entry.rebates_total,
      traderCounts: {
        l1: entry.l1_trader_count,
        l2: entry.l2_trader_count,
        l3: entry.l3_trader_count,
        total: entry.total_trader_count,
      },
    })),
    snapshotAt,
    cached: false,
  };

  // Cache the result
  await env.LEADERBOARD_CACHE.put(
    CACHE_KEY,
    JSON.stringify({
      entries: results.results,
      snapshotAt,
    }),
    { expirationTtl: CACHE_TTL_SECONDS },
  ).catch((err) => {
    console.error('Failed to cache leaderboard:', err);
  });

  return Response.json(responseData);
};
