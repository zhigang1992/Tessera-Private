import type { PagesFunction } from '@cloudflare/workers-types'

type Env = Record<string, never>

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const handle = new URL(request.url).searchParams.get('handle')
  if (!handle) {
    return Response.json({ error: 'handle query param required' }, { status: 400 })
  }

  await new Promise((resolve) => setTimeout(resolve, 2000))

  const hasPosted = Math.random() < 0.5
  return Response.json({
    hasPosted,
    tweetUrl: hasPosted ? `https://twitter.com/${handle}/status/0` : null,
  })
}
