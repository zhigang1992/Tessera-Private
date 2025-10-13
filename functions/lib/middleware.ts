import type { KVNamespace, D1Database } from '@cloudflare/workers-types';
import { getSessionRecord, readBearerToken, type SessionRecord } from './session';

export type AuthenticatedContext = {
  session: SessionRecord;
  walletAddress: string;
};

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

/**
 * Middleware to authenticate requests using Bearer token from Authorization header.
 * Validates the token against SESSION_KV and returns the authenticated wallet address.
 */
export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<{ authenticated: false; error: Response } | { authenticated: true; context: AuthenticatedContext }> {
  const token = readBearerToken(request);

  if (!token) {
    return {
      authenticated: false,
      error: Response.json({ error: 'Missing authorization token' }, { status: 401 }),
    };
  }

  const session = await getSessionRecord(token, env.SESSION_KV);

  if (!session) {
    return {
      authenticated: false,
      error: Response.json({ error: 'Invalid or expired session' }, { status: 401 }),
    };
  }

  return {
    authenticated: true,
    context: {
      session,
      walletAddress: session.walletAddress,
    },
  };
}

/**
 * Middleware to optionally authenticate requests.
 * For read operations (GET), authentication is optional - returns authenticated context if available, null otherwise.
 * For write operations (POST), authentication is required - same behavior as authenticateRequest.
 */
export async function optionalAuthenticateRequest(
  request: Request,
  env: Env,
): Promise<{ authenticated: false; context: null } | { authenticated: true; context: AuthenticatedContext }> {
  const token = readBearerToken(request);

  if (!token) {
    return {
      authenticated: false,
      context: null,
    };
  }

  const session = await getSessionRecord(token, env.SESSION_KV);

  if (!session) {
    return {
      authenticated: false,
      context: null,
    };
  }

  return {
    authenticated: true,
    context: {
      session,
      walletAddress: session.walletAddress,
    },
  };
}

/**
 * Helper to ensure a user record exists in the database for the authenticated wallet.
 * Creates or updates the user record if needed.
 */
export async function ensureUserExists(walletAddress: string, db: D1Database): Promise<void> {
  await db
    .prepare("INSERT INTO users (wallet_address) VALUES (?) ON CONFLICT(wallet_address) DO UPDATE SET updated_at = datetime('now')")
    .bind(walletAddress)
    .run();
}
