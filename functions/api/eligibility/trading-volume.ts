import type { PagesFunction } from '@cloudflare/workers-types'

type Env = Record<string, never>

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const wallet = new URL(request.url).searchParams.get('wallet')
  if (!wallet) {
    return Response.json({ error: 'wallet query param required' }, { status: 400 })
  }

  await new Promise((resolve) => setTimeout(resolve, 2000))

  const volumeUsd = Math.floor(Math.random() * 10000)
  return Response.json({ volumeUsd })
}
