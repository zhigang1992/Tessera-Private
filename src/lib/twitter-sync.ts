import { apiClient } from '@/features/referral/lib/api-client'

const STORAGE_KEY = 'twitter_sync_last'

type Marker = {
  walletAddress: string
  twitterId: string
  twitterHandle: string
}

function readMarker(): Marker | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Marker) : null
  } catch {
    return null
  }
}

function writeMarker(m: Marker) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
  } catch {
    // localStorage quota / SecurityError — the server will still serve as the source of truth.
  }
}

export function clearTwitterSyncMarker() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function matches(a: Marker | null, b: Marker): boolean {
  return (
    !!a && a.walletAddress === b.walletAddress && a.twitterId === b.twitterId && a.twitterHandle === b.twitterHandle
  )
}

/**
 * Posts to /api/social/verify-twitter so the backend's user_twitter_accounts
 * row reflects the given Dynamic credential. Short-circuits when the
 * (wallet, twitter id, handle) tuple matches the last successful sync
 * stored in localStorage, so repeat calls are free.
 *
 * Returns true when the backend is known-fresh after the call — either
 * because we just synced, or because the marker matched and no call was
 * needed.
 */
export async function syncTwitterToBackend(args: {
  dynamicToken: string
  twitterId: string
  twitterHandle: string
}): Promise<boolean> {
  const sessionToken = apiClient.getToken()
  const sessionWallet = apiClient.getSessionWalletAddress()
  if (!sessionToken || !sessionWallet || !apiClient.isTokenValid()) return false

  const target: Marker = {
    walletAddress: sessionWallet,
    twitterId: args.twitterId,
    twitterHandle: args.twitterHandle,
  }
  if (matches(readMarker(), target)) return true

  try {
    const res = await fetch('/api/social/verify-twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ token: args.dynamicToken }),
    })
    if (res.ok) {
      writeMarker(target)
      return true
    }
    if (res.status === 401 || res.status === 404) {
      clearTwitterSyncMarker()
    }
  } catch (err) {
    console.warn('Twitter sync failed', err)
  }
  return false
}
