import type { D1Database, KVNamespace, PagesFunction } from '@cloudflare/workers-types'

import { authenticateRequest } from '../../lib/middleware'
import { searchTweetsByUser, TwitterApiError } from '../../lib/twitter-api'
import { isSocialCardTokenId, SOCIAL_CARD_SEARCH_QUERY } from '../../../src/lib/social-card'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  TWITTERAPI_IO_KEY?: string
}

type TwitterAccountRow = {
  twitter_handle: string
}

type PostCheckRow = {
  found: number
  tweet_id: string | null
  tweet_url: string | null
  tweet_created_at: string | null
  checked_at: string
}

const RATE_LIMIT_SECONDS = 30
const POSITIVE_TTL_SECONDS = 24 * 60 * 60

function secondsSince(iso: string): number {
  const t = Date.parse(iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY
  return (Date.now() - t) / 1000
}

function respond(row: PostCheckRow) {
  return {
    hasPosted: row.found === 1,
    tweetId: row.tweet_id,
    tweetUrl: row.tweet_url,
    tweetCreatedAt: row.tweet_created_at,
    checkedAt: row.checked_at,
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authenticateRequest(request, env)
  if (!auth.authenticated) {
    return auth.error
  }

  const apiKey = env.TWITTERAPI_IO_KEY?.trim()
  if (!apiKey) {
    console.error('TWITTERAPI_IO_KEY is not configured')
    return Response.json({ error: 'twitter_api_not_configured' }, { status: 500 })
  }

  const tokenId = new URL(request.url).searchParams.get('tokenId')
  if (!isSocialCardTokenId(tokenId)) {
    return Response.json({ error: 'invalid_token_id' }, { status: 400 })
  }

  const { walletAddress } = auth.context

  const account = await env.DB.prepare('SELECT twitter_handle FROM user_twitter_accounts WHERE wallet_address = ?')
    .bind(walletAddress)
    .first<TwitterAccountRow>()

  if (!account) {
    return Response.json({ error: 'twitter_not_verified' }, { status: 409 })
  }

  const handle = account.twitter_handle

  const cached = await env.DB.prepare(
    'SELECT found, tweet_id, tweet_url, tweet_created_at, checked_at FROM social_post_checks WHERE wallet_address = ? AND token_id = ?',
  )
    .bind(walletAddress, tokenId)
    .first<PostCheckRow>()

  if (cached) {
    const age = secondsSince(cached.checked_at)
    if (cached.found === 1 && age < POSITIVE_TTL_SECONDS) {
      return Response.json(respond(cached))
    }
    if (cached.found === 0 && age < RATE_LIMIT_SECONDS) {
      return Response.json(
        { error: 'rate_limited', retryAfterSeconds: Math.ceil(RATE_LIMIT_SECONDS - age) },
        { status: 429 },
      )
    }
  }

  let searchResult
  try {
    searchResult = await searchTweetsByUser({ apiKey, handle, query: SOCIAL_CARD_SEARCH_QUERY })
  } catch (error) {
    if (error instanceof TwitterApiError) {
      console.error('twitterapi.io error', error)
      return Response.json({ error: 'twitter_api_error', status: error.status }, { status: 502 })
    }
    console.error('twitterapi.io unexpected error', error)
    return Response.json({ error: 'twitter_api_error' }, { status: 502 })
  }

  const found = searchResult.found ? 1 : 0
  const tweetId = searchResult.tweet?.id ?? null
  const tweetUrl = searchResult.tweet?.url ?? null
  const tweetCreatedAt = searchResult.tweet?.createdAt ?? null

  await env.DB.prepare(
    `INSERT INTO social_post_checks
       (wallet_address, token_id, twitter_handle, found, tweet_id, tweet_url, tweet_created_at, checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(wallet_address, token_id) DO UPDATE SET
       twitter_handle = excluded.twitter_handle,
       found = excluded.found,
       tweet_id = excluded.tweet_id,
       tweet_url = excluded.tweet_url,
       tweet_created_at = excluded.tweet_created_at,
       checked_at = datetime('now')`,
  )
    .bind(walletAddress, tokenId, handle, found, tweetId, tweetUrl, tweetCreatedAt)
    .run()

  const updated = await env.DB.prepare(
    'SELECT found, tweet_id, tweet_url, tweet_created_at, checked_at FROM social_post_checks WHERE wallet_address = ? AND token_id = ?',
  )
    .bind(walletAddress, tokenId)
    .first<PostCheckRow>()

  return Response.json(respond(updated!))
}
