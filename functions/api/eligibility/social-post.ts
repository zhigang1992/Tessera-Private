import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types'

import { authenticateRequest } from '../../lib/middleware'
import { checkSocialPost } from '../../lib/eligibility'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  TWITTERAPI_IO_KEY?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authenticateRequest(request, env)
  if (!auth.authenticated) return auth.error

  const tokenId = new URL(request.url).searchParams.get('tokenId')
  if (!tokenId) {
    return Response.json({ error: 'invalid_token_id' }, { status: 400 })
  }

  const result = await checkSocialPost(env, auth.context.walletAddress, tokenId)

  switch (result.kind) {
    case 'ok':
      return Response.json({
        hasPosted: result.record.found,
        tweetId: result.record.tweetId,
        tweetUrl: result.record.tweetUrl,
        tweetCreatedAt: result.record.tweetCreatedAt,
        checkedAt: result.record.checkedAt,
      })
    case 'rate_limited':
      return Response.json(
        { error: 'rate_limited', retryAfterSeconds: result.retryAfterSeconds },
        { status: 429 },
      )
    case 'twitter_not_verified':
      return Response.json({ error: 'twitter_not_verified' }, { status: 409 })
    case 'invalid_token_id':
      return Response.json({ error: 'invalid_token_id' }, { status: 400 })
    case 'twitter_api_not_configured':
      return Response.json({ error: 'twitter_api_not_configured' }, { status: 500 })
    case 'twitter_api_error':
      return Response.json({ error: 'twitter_api_error', status: result.status }, { status: 502 })
  }
}
