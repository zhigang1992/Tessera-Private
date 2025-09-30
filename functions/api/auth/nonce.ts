import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';

import { buildSignInMessage, NONCE_TTL_SECONDS } from '../../lib/auth';
import { decodeBase58 } from '../../lib/encoding';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

function assertValidWalletAddress(address: string): void {
  if (address.length < 32 || address.length > 44) {
    throw new Error('Invalid wallet address length');
  }

  const decoded = decodeBase58(address);
  if (decoded.length !== 32) {
    throw new Error('Wallet address must decode to 32 bytes');
  }
}

const METHOD_NOT_ALLOWED_RESPONSE = new Response('Method Not Allowed', {
  status: 405,
  headers: { Allow: 'GET' },
});

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return METHOD_NOT_ALLOWED_RESPONSE;
  }

  const url = new URL(request.url);
  const rawAddress = (url.searchParams.get('wallet') ?? url.searchParams.get('address') ?? '').trim();

  if (!rawAddress) {
    return Response.json({ error: 'Missing wallet query parameter' }, { status: 400 });
  }

  try {
    assertValidWalletAddress(rawAddress);
  } catch (error) {
    return Response.json({ error: 'Invalid wallet address', detail: (error as Error).message }, { status: 400 });
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + NONCE_TTL_SECONDS * 1000);
  const nonce = crypto.randomUUID().replace(/-/g, '');

  const db = env.DB;
  const kv = env.SESSION_KV;

  try {
    await db
      .prepare("DELETE FROM auth_nonces WHERE wallet_address = ? AND used = 0 AND expires_at <= datetime('now')")
      .bind(rawAddress)
      .run();

    await db
      .prepare('INSERT INTO auth_nonces (nonce, wallet_address, expires_at, purpose) VALUES (?, ?, ?, ?)')
      .bind(nonce, rawAddress, expiresAt.toISOString(), 'session')
      .run();
  } catch (error) {
    console.error('Failed to persist nonce in D1', error);
    return Response.json({ error: 'Failed to issue nonce' }, { status: 500 });
  }

  try {
    await kv.put(
      `nonce:${nonce}`,
      JSON.stringify({ walletAddress: rawAddress, purpose: 'session', expiresAt: expiresAt.toISOString() }),
      { expirationTtl: NONCE_TTL_SECONDS },
    );
  } catch (error) {
    console.error('Failed to persist nonce in KV', error);
    await db.prepare('UPDATE auth_nonces SET used = 1 WHERE nonce = ?').bind(nonce).run().catch(() => {});
    return Response.json({ error: 'Failed to issue nonce' }, { status: 500 });
  }

  const issuedAtIso = issuedAt.toISOString();
  const expiresAtIso = expiresAt.toISOString();

  return Response.json(
    {
      nonce,
      walletAddress: rawAddress,
      issuedAt: issuedAtIso,
      expiresAt: expiresAtIso,
      ttlSeconds: NONCE_TTL_SECONDS,
      message: buildSignInMessage(nonce, issuedAtIso),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
