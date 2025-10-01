import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';

import {
  buildSignInMessage,
  MAX_FUTURE_DRIFT_MS,
  MAX_SIGNATURE_AGE_MS,
  SESSION_TTL_SECONDS,
} from '../../lib/auth';
import { decodeBase58, decodeBase64 } from '../../lib/encoding';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type VerifyRequestPayload = {
  walletAddress?: string;
  nonce?: string;
  signature?: string;
  timestamp?: string;
  signatureEncoding?: 'base64' | 'base58';
};

type NonceRow = {
  wallet_address: string;
  expires_at: string;
  used: number;
  purpose: string;
};

function parseWalletAddress(address: string | undefined): { address: string; publicKeyBytes: Uint8Array } {
  if (!address) {
    throw new Error('Missing wallet address');
  }

  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) {
    throw new Error('Invalid wallet address length');
  }

  const decoded = decodeBase58(trimmed);
  if (decoded.length !== 32) {
    throw new Error('Wallet address must decode to 32 bytes');
  }

  return { address: trimmed, publicKeyBytes: decoded };
}

function parseNonce(nonce: string | undefined): string {
  if (!nonce) {
    throw new Error('Missing nonce');
  }

  const trimmed = nonce.trim();
  if (trimmed.length < 12 || trimmed.length > 64) {
    throw new Error('Invalid nonce length');
  }

  return trimmed;
}

function parseSignature(signature: string | undefined): string {
  if (!signature) {
    throw new Error('Missing signature');
  }

  const trimmed = signature.trim();
  if (trimmed.length === 0) {
    throw new Error('Signature payload is empty');
  }

  return trimmed;
}

function parseTimestamp(input: string | undefined): { raw: string; date: Date } {
  if (!input) {
    throw new Error('Missing timestamp');
  }

  const trimmed = input.trim();
  if (!trimmed.endsWith('Z')) {
    throw new Error('Timestamp must be an ISO string ending with Z');
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid timestamp');
  }

  return { raw: trimmed, date };
}

function decodeSignature(signature: string, encoding: 'base58' | 'base64'): Uint8Array {
  const decoded = encoding === 'base58' ? decodeBase58(signature) : decodeBase64(signature);
  if (decoded.length !== 64) {
    throw new Error('Signature must be 64 bytes');
  }
  return decoded;
}

function parsePayload(request: Request): Promise<VerifyRequestPayload> {
  return request
    .json()
    .catch(() => {
      throw new Error('Invalid JSON payload');
    }) as Promise<VerifyRequestPayload>;
}

function buildJsonError(status: number, error: string, detail?: string) {
  return Response.json({ error, detail }, { status });
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  let payload: VerifyRequestPayload;
  try {
    payload = await parsePayload(request);
  } catch (error) {
    return buildJsonError(400, 'Invalid request body', (error as Error).message);
  }

  let walletAddress: string;
  let publicKeyBytes: Uint8Array;
  let nonce: string;
  let signature: string;
  let timestampRaw: string;
  let timestamp: Date;

  try {
    ({ address: walletAddress, publicKeyBytes } = parseWalletAddress(payload.walletAddress));
    nonce = parseNonce(payload.nonce);
    signature = parseSignature(payload.signature);
    ({ raw: timestampRaw, date: timestamp } = parseTimestamp(payload.timestamp));
  } catch (error) {
    return buildJsonError(400, 'Invalid request body', (error as Error).message);
  }

  const now = Date.now();
  const timestampMs = timestamp.getTime();
  if (timestampMs > now + MAX_FUTURE_DRIFT_MS) {
    return buildJsonError(400, 'Timestamp is too far in the future');
  }

  if (now - timestampMs > MAX_SIGNATURE_AGE_MS) {
    return buildJsonError(400, 'Signature has expired');
  }

  const encoding = (payload.signatureEncoding ?? 'base64').toLowerCase();
  if (encoding !== 'base64' && encoding !== 'base58') {
    return buildJsonError(400, 'Unsupported signature encoding');
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeSignature(signature, encoding as 'base58' | 'base64');
  } catch (error) {
    return buildJsonError(400, 'Invalid signature', (error as Error).message);
  }

  const db = env.DB;
  const kv = env.SESSION_KV;

  let nonceRecord: NonceRow | null = null;
  try {
    nonceRecord = await db
      .prepare('SELECT wallet_address, expires_at, used, purpose FROM auth_nonces WHERE nonce = ?')
      .bind(nonce)
      .first<NonceRow>();
  } catch (error) {
    console.error('Failed to read nonce from D1', error);
    return buildJsonError(500, 'Failed to verify signature');
  }

  if (!nonceRecord) {
    return buildJsonError(400, 'Nonce not found or expired');
  }

  if (nonceRecord.used) {
    return buildJsonError(409, 'Nonce already used');
  }

  if (nonceRecord.purpose !== 'session') {
    return buildJsonError(400, 'Nonce purpose mismatch');
  }

  if (nonceRecord.wallet_address !== walletAddress) {
    return buildJsonError(400, 'Nonce wallet mismatch');
  }

  const expiresAtMs = Date.parse(nonceRecord.expires_at);
  if (Number.isNaN(expiresAtMs) || expiresAtMs < now) {
    return buildJsonError(400, 'Nonce expired');
  }

  const message = buildSignInMessage(nonce, timestampRaw);
  const messageBytes = new TextEncoder().encode(message);

  const { ed25519 } = await import('@noble/curves/ed25519');
  const isValid = ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  if (!isValid) {
    return buildJsonError(401, 'Signature verification failed');
  }

  try {
    const updateResult = await db
      .prepare('UPDATE auth_nonces SET used = 1 WHERE nonce = ? AND used = 0')
      .bind(nonce)
      .run();

    if (!updateResult.success || (updateResult.meta?.changes ?? 0) === 0) {
      return buildJsonError(409, 'Nonce already used');
    }
  } catch (error) {
    console.error('Failed to mark nonce as used', error);
    return buildJsonError(500, 'Failed to verify signature');
  }

  await kv.delete(`nonce:${nonce}`).catch(() => {});

  try {
    await db
      .prepare(
        "INSERT INTO users (wallet_address) VALUES (?) ON CONFLICT(wallet_address) DO UPDATE SET updated_at = datetime('now')",
      )
      .bind(walletAddress)
      .run();
  } catch (error) {
    console.error('Failed to upsert user record', error);
    return buildJsonError(500, 'Failed to verify signature');
  }

  const sessionToken = crypto.randomUUID().replace(/-/g, '');
  const sessionIssuedAt = new Date();
  const sessionExpiresAt = new Date(sessionIssuedAt.getTime() + SESSION_TTL_SECONDS * 1000);

  try {
    await kv.put(
      `session:${sessionToken}`,
      JSON.stringify({ walletAddress, nonce, issuedAt: sessionIssuedAt.toISOString(), expiresAt: sessionExpiresAt.toISOString() }),
      { expirationTtl: SESSION_TTL_SECONDS },
    );
  } catch (error) {
    console.error('Failed to persist session token', error);
    return buildJsonError(500, 'Failed to verify signature');
  }

  return Response.json(
    {
      token: sessionToken,
      tokenType: 'session',
      walletAddress,
      issuedAt: sessionIssuedAt.toISOString(),
      expiresAt: sessionExpiresAt.toISOString(),
      ttlSeconds: SESSION_TTL_SECONDS,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
