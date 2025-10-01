import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types';
import { authenticateRequest, ensureUserExists } from '../../../lib/middleware';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type EmailRequestPayload = {
  email: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateVerificationToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authResult = await authenticateRequest(request, env);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  const { walletAddress } = authResult.context;

  let payload: EmailRequestPayload;
  try {
    payload = (await request.json()) as EmailRequestPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 });
  }

  await ensureUserExists(walletAddress, env.DB);

  // Check if email is already taken by another wallet
  const existing = await env.DB.prepare('SELECT wallet_address FROM users WHERE email = ? AND wallet_address != ?')
    .bind(email, walletAddress)
    .first<{ wallet_address: string }>();

  if (existing) {
    return Response.json({ error: 'Email already associated with another wallet' }, { status: 409 });
  }

  // Generate verification token
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update user record with email and token
  await env.DB.prepare(
    "UPDATE users SET email = ?, email_verified = 0, email_verification_token = ?, updated_at = datetime('now') WHERE wallet_address = ?",
  )
    .bind(email, token, walletAddress)
    .run();

  // TODO: Once Email Worker is set up, send verification email here
  // For now, return the verification link in the response (for testing)
  const verificationLink = `${new URL(request.url).origin}/api/referral/email/verify?token=${token}`;

  console.log(`Email verification requested for ${walletAddress}: ${verificationLink}`);

  return Response.json({
    success: true,
    email,
    message: 'Verification email sent',
    // TODO: Remove this in production
    verificationLink,
    expiresAt: expiresAt.toISOString(),
  });
};
