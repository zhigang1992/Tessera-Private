import type { PagesFunction } from '@cloudflare/workers-types'

import {
  findTwitterCredential,
  resolveDynamicEnvironmentId,
  verifyDynamicJwt,
} from '../../lib/dynamic-jwt'

type Env = {
  DYNAMIC_ENVIRONMENT_ID?: string
}

type VerifyTwitterPayload = {
  token?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

  return Response.json(
    {
      verified: true,
      dynamicUserId: claims.sub ?? null,
      twitter: {
        id: twitter.oauth_account_id ?? twitter.id ?? null,
        username: twitter.oauth_username ?? twitter.public_identifier ?? null,
        displayName: twitter.oauth_display_name ?? null,
        avatar: twitter.oauth_account_photos?.[0] ?? null,
        verifiedAt: twitter.verified_at ?? null,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
