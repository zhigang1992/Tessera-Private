import type { KVNamespace } from '@cloudflare/workers-types'

const BEARER_PREFIX = 'bearer '

export type SessionRecord = {
  walletAddress: string
  nonce: string
  issuedAt: string
  expiresAt: string
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header) {
    return null
  }

  const normalized = header.trim()
  if (normalized.length === 0) {
    return null
  }

  if (normalized.toLowerCase().startsWith(BEARER_PREFIX)) {
    const token = normalized.slice(BEARER_PREFIX.length).trim()
    return token.length > 0 ? token : null
  }

  return null
}

export async function getSessionRecord(token: string, kv: KVNamespace): Promise<SessionRecord | null> {
  const raw = await kv.get(`session:${token}`)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as SessionRecord
    if (!parsed.walletAddress || !parsed.expiresAt) {
      return null
    }

    const expiresMs = Date.parse(parsed.expiresAt)
    if (Number.isNaN(expiresMs) || expiresMs < Date.now()) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
