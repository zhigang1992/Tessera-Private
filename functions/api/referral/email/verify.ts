import type { D1Database, PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

type User = {
  wallet_address: string;
  email: string;
  email_verified: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Missing verification token' }, { status: 400 });
  }

  // Find user by verification token
  const user = await env.DB.prepare('SELECT wallet_address, email, email_verified FROM users WHERE email_verification_token = ?')
    .bind(token)
    .first<User>();

  if (!user) {
    return Response.json({ error: 'Invalid or expired verification token' }, { status: 404 });
  }

  if (user.email_verified === 1) {
    return Response.json({
      success: true,
      message: 'Email already verified',
      walletAddress: user.wallet_address,
      email: user.email,
    });
  }

  // Mark email as verified and clear token
  await env.DB.prepare(
    "UPDATE users SET email_verified = 1, email_verification_token = NULL, updated_at = datetime('now') WHERE wallet_address = ?",
  )
    .bind(user.wallet_address)
    .run();

  return Response.json({
    success: true,
    message: 'Email verified successfully',
    walletAddress: user.wallet_address,
    email: user.email,
  });
};
