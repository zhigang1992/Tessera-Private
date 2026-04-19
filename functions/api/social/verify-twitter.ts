import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types'

import {
  findTwitterCredential,
  resolveDynamicEnvironmentId,
  verifyDynamicJwt,
} from '../../lib/dynamic-jwt'
import { authenticateRequest, ensureUserExists } from '../../lib/middleware'

type Env = {
  DYNAMIC_ENVIRONMENT_ID?: string
  DB: D1Database
  SESSION_KV: KVNamespace
}

type VerifyTwitterPayload = {
  token?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authenticateRequest(request, env)
  if (!auth.authenticated) {
    return auth.error
  }

  let payload: VerifyTwitterPayload
  try {
    payload = (await request.json()) as VerifyTwitterPayload
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const token = payload.token?.trim()
  if (!token) {
    return Response.json({ error: 'Missing Dynamic auth token' }, { status: 400 })
  }

  const environmentId = resolveDynamicEnvironmentId(env)

  let claims
  try {
    claims = await verifyDynamicJwt(token, environmentId)
  } catch (error) {
    console.error('Dynamic JWT verification failed', error)
    return Response.json(
      { error: 'Invalid Dynamic auth token', detail: (error as Error).message },
      { status: 401 },
    )
  }

  const twitter = findTwitterCredential(claims)
  if (!twitter) {
    return Response.json(
      { verified: false, error: 'No verified Twitter credential on this account' },
      { status: 404 },
    )
  }

  const twitterId = twitter.oauth_account_id ?? twitter.id ?? null
  const twitterHandle = twitter.oauth_username ?? twitter.public_identifier ?? null
  const displayName = twitter.oauth_display_name ?? null
  const avatar = twitter.oauth_account_photos?.[0] ?? null

  if (!twitterId || !twitterHandle) {
    return Response.json(
      { verified: false, error: 'Twitter credential missing id or handle' },
      { status: 422 },
    )
  }

  const { walletAddress } = auth.context

  await ensureUserExists(walletAddress, env.DB)

  await env.DB.prepare(
    `INSERT INTO user_twitter_accounts (wallet_address, twitter_id, twitter_handle, display_name, avatar_url)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(wallet_address) DO UPDATE SET
       twitter_id = excluded.twitter_id,
       twitter_handle = excluded.twitter_handle,
       display_name = excluded.display_name,
       avatar_url = excluded.avatar_url,
       updated_at = datetime('now')`,
  )
    .bind(walletAddress, twitterId, twitterHandle, displayName, avatar)
    .run()

  return Response.json(
    {
      verified: true,
      dynamicUserId: claims.sub ?? null,
      twitter: {
        id: twitterId,
        username: twitterHandle,
        displayName,
        avatar,
        verifiedAt: twitter.verified_at ?? null,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
