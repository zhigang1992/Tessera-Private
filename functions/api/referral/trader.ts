import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import { optionalAuthenticateRequest, ensureUserExists } from '../../lib/middleware';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type TraderMetrics = {
  wallet_address: string;
  trading_volume: number;
  fee_rebate_total: number;
  trading_points: number;
  fee_discount_pct: number;
  snapshot_at: string;
};

type TraderBinding = {
  wallet_address: string;
  referrer_code_id: number;
  bound_at: string;
  last_modified: string;
};

type ReferralCode = {
  id: number;
  wallet_address: string;
  code_slug: string;
  status: string;
  active_layer: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authResult = await optionalAuthenticateRequest(request, env);
  const walletAddress = authResult.authenticated ? authResult.context.walletAddress : null;

  // If not authenticated, return default/empty data
  if (!walletAddress) {
    return Response.json({
      walletAddress: null,
      metrics: {
        tradingVolume: 0,
        feeRebateTotal: 0,
        tradingPoints: 0,
        feeDiscountPct: 0,
        snapshotAt: new Date().toISOString(),
      },
      referral: null,
    });
  }

  // Only ensure user exists if authenticated
  await ensureUserExists(walletAddress, env.DB);

  // Fetch trader metrics (or return defaults if not yet tracked)
  let metrics = await env.DB.prepare('SELECT * FROM metrics_trader WHERE wallet_address = ?')
    .bind(walletAddress)
    .first<TraderMetrics>();

  if (!metrics) {
    // Create default metrics record
    await env.DB.prepare(
      'INSERT INTO metrics_trader (wallet_address, trading_volume, fee_rebate_total, trading_points, fee_discount_pct) VALUES (?, 0, 0, 0, 0)',
    )
      .bind(walletAddress)
      .run();

    metrics = {
      wallet_address: walletAddress,
      trading_volume: 0,
      fee_rebate_total: 0,
      trading_points: 0,
      fee_discount_pct: 0,
      snapshot_at: new Date().toISOString(),
    };
  }

  // Fetch active referral binding
  const binding = await env.DB.prepare('SELECT * FROM trader_bindings WHERE wallet_address = ?')
    .bind(walletAddress)
    .first<TraderBinding>();

  let referralInfo = null;

  if (binding) {
    const code = await env.DB.prepare('SELECT * FROM referral_codes WHERE id = ?')
      .bind(binding.referrer_code_id)
      .first<ReferralCode>();

    if (code) {
      referralInfo = {
        referrerCode: code.code_slug,
        referrerWallet: code.wallet_address,
        boundAt: binding.bound_at,
        lastModified: binding.last_modified,
      };
    }
  }

  return Response.json({
    walletAddress,
    metrics: {
      tradingVolume: metrics.trading_volume,
      feeRebateTotal: metrics.fee_rebate_total,
      tradingPoints: metrics.trading_points,
      feeDiscountPct: metrics.fee_discount_pct,
      snapshotAt: metrics.snapshot_at,
    },
    referral: referralInfo,
  });
};
