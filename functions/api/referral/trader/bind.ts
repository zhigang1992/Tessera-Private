import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import { authenticateRequest, ensureUserExists } from '../../../lib/middleware';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type BindPayload = {
  referralCode: string;
};

type ReferralCode = {
  id: number;
  wallet_address: string;
  code_slug: string;
  status: string;
  active_layer: number;
};

/**
 * Rebuild referral tree edges for a trader by walking up the referral chain.
 * Creates edges for levels 1-3 based on the active_layer of each referrer.
 */
async function rebuildTreeEdges(traderWallet: string, referrerCodeId: number, db: D1Database): Promise<void> {
  // Delete existing edges for this trader
  await db.prepare('DELETE FROM referral_tree_edges WHERE descendant_wallet = ?').bind(traderWallet).run();

  // Walk up the referral chain up to 3 levels
  const ancestors: Array<{ wallet: string; codeId: number; level: number }> = [];

  let currentCodeId: number | null = referrerCodeId;
  let currentLevel = 1;

  while (currentCodeId && currentLevel <= 3) {
    const code = await db.prepare('SELECT id, wallet_address, active_layer FROM referral_codes WHERE id = ?')
      .bind(currentCodeId)
      .first<{ id: number; wallet_address: string; active_layer: number }>();

    if (!code) break;

    // Only create edge if this level is within the referrer's active layer
    if (currentLevel <= code.active_layer) {
      ancestors.push({
        wallet: code.wallet_address,
        codeId: code.id,
        level: currentLevel,
      });
    }

    // Find the next level up by checking if this referrer is also a trader
    const nextBinding = await db.prepare('SELECT referrer_code_id FROM trader_bindings WHERE wallet_address = ?')
      .bind(code.wallet_address)
      .first<{ referrer_code_id: number }>();

    currentCodeId = nextBinding?.referrer_code_id ?? null;
    currentLevel++;
  }

  // Insert all ancestor edges
  for (const ancestor of ancestors) {
    await db.prepare('INSERT INTO referral_tree_edges (ancestor_wallet, descendant_wallet, level, referrer_code_id) VALUES (?, ?, ?, ?)')
      .bind(ancestor.wallet, traderWallet, ancestor.level, ancestor.codeId)
      .run();
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authResult = await authenticateRequest(request, env);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  const { walletAddress } = authResult.context;

  let payload: BindPayload;
  try {
    payload = (await request.json()) as BindPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const referralCode = payload.referralCode?.trim().toUpperCase();
  if (!referralCode) {
    return Response.json({ error: 'Missing referral code' }, { status: 400 });
  }

  await ensureUserExists(walletAddress, env.DB);

  // Find the referral code
  const code = await env.DB.prepare('SELECT * FROM referral_codes WHERE code_slug = ?')
    .bind(referralCode)
    .first<ReferralCode>();

  if (!code) {
    return Response.json({ error: 'Referral code not found' }, { status: 404 });
  }

  if (code.status !== 'active') {
    return Response.json({ error: 'Referral code is not active' }, { status: 400 });
  }

  // Prevent self-binding
  if (code.wallet_address === walletAddress) {
    return Response.json({ error: 'Cannot bind to your own referral code' }, { status: 400 });
  }

  // Check for circular reference: ensure referrer is not in trader's tree
  const circularCheck = await env.DB.prepare('SELECT 1 FROM referral_tree_edges WHERE ancestor_wallet = ? AND descendant_wallet = ?')
    .bind(walletAddress, code.wallet_address)
    .first();

  if (circularCheck) {
    return Response.json({ error: 'Cannot bind to a trader in your referral tree' }, { status: 400 });
  }

  // Upsert trader binding
  await env.DB.prepare(
    `INSERT INTO trader_bindings (wallet_address, referrer_code_id, bound_at, bound_by_wallet, last_modified)
     VALUES (?, ?, datetime('now'), ?, datetime('now'))
     ON CONFLICT(wallet_address) DO UPDATE SET
       referrer_code_id = excluded.referrer_code_id,
       last_modified = datetime('now'),
       bound_by_wallet = excluded.bound_by_wallet`,
  )
    .bind(walletAddress, code.id, walletAddress)
    .run();

  // Rebuild tree edges for this trader
  await rebuildTreeEdges(walletAddress, code.id, env.DB);

  // If this trader is also a referrer, we need to rebuild edges for all their descendants
  const isReferrer = await env.DB.prepare('SELECT 1 FROM referral_codes WHERE wallet_address = ?').bind(walletAddress).first();

  if (isReferrer) {
    // Get all descendants (traders who have this wallet in their tree)
    const descendants = await env.DB.prepare('SELECT DISTINCT descendant_wallet FROM referral_tree_edges WHERE ancestor_wallet = ?')
      .bind(walletAddress)
      .all<{ descendant_wallet: string }>();

    // Rebuild edges for each descendant
    for (const desc of descendants.results) {
      const binding = await env.DB.prepare('SELECT referrer_code_id FROM trader_bindings WHERE wallet_address = ?')
        .bind(desc.descendant_wallet)
        .first<{ referrer_code_id: number }>();

      if (binding) {
        await rebuildTreeEdges(desc.descendant_wallet, binding.referrer_code_id, env.DB);
      }
    }
  }

  return Response.json({
    success: true,
    binding: {
      traderWallet: walletAddress,
      referrerCode: code.code_slug,
      referrerWallet: code.wallet_address,
      boundAt: new Date().toISOString(),
    },
  });
};
