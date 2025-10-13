import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import { authenticateRequest, ensureUserExists } from '../../lib/middleware';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type CreateCodePayload = {
  codeSlug?: string;
  activeLayer?: number;
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

const CODE_SLUG_PATTERN = /^[a-zA-Z0-9]{4,10}$/;

function validateCodeSlug(slug: string): { valid: boolean; error?: string } {
  if (!CODE_SLUG_PATTERN.test(slug)) {
    return {
      valid: false,
      error: 'Code must be 4-10 alphanumeric characters',
    };
  }
  return { valid: true };
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authResult = await authenticateRequest(request, env);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  const { walletAddress } = authResult.context;

  let payload: CreateCodePayload;
  try {
    payload = (await request.json()) as CreateCodePayload;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  await ensureUserExists(walletAddress, env.DB);

  const activeLayer = payload.activeLayer ?? 1;
  if (activeLayer < 1 || activeLayer > 3) {
    return Response.json({ error: 'Active layer must be between 1 and 3' }, { status: 400 });
  }

  let codeSlug = payload.codeSlug?.trim();

  // If no slug provided, always generate a new random code
  if (!codeSlug) {
    // Generate random code
    let attempts = 0;
    while (attempts < 10) {
      codeSlug = generateRandomCode();
      const check = await env.DB.prepare('SELECT id FROM referral_codes WHERE code_slug = ?').bind(codeSlug).first();
      if (!check) break;
      attempts++;
    }

    if (attempts >= 10) {
      return Response.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }
  } else {
    const validation = validateCodeSlug(codeSlug);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Check if slug is taken by another user
    const existing = await env.DB.prepare('SELECT wallet_address FROM referral_codes WHERE code_slug = ?')
      .bind(codeSlug)
      .first<{ wallet_address: string }>();

    if (existing && existing.wallet_address !== walletAddress) {
      return Response.json({ error: 'Code already taken' }, { status: 409 });
    }

    if (existing) {
      // Update existing code
      await env.DB.prepare(
        "UPDATE referral_codes SET active_layer = ?, status = 'active', updated_at = datetime('now') WHERE code_slug = ? AND wallet_address = ?",
      )
        .bind(activeLayer, codeSlug, walletAddress)
        .run();

      const updated = await env.DB.prepare('SELECT * FROM referral_codes WHERE code_slug = ? AND wallet_address = ?')
        .bind(codeSlug, walletAddress)
        .first<ReferralCode>();

      return Response.json({
        code: {
          id: updated!.id,
          codeSlug: updated!.code_slug,
          status: updated!.status,
          activeLayer: updated!.active_layer,
          walletAddress,
        },
      });
    }
  }

  // Create new code
  const result = await env.DB.prepare(
    'INSERT INTO referral_codes (wallet_address, code_slug, status, active_layer) VALUES (?, ?, ?, ?)',
  )
    .bind(walletAddress, codeSlug, 'active', activeLayer)
    .run();

  const created = await env.DB.prepare('SELECT * FROM referral_codes WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first<ReferralCode>();

  return Response.json(
    {
      code: {
        id: created!.id,
        codeSlug: created!.code_slug,
        status: created!.status,
        activeLayer: created!.active_layer,
        walletAddress,
      },
    },
    { status: 201 },
  );
};
