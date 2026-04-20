import { useEffect, useMemo, useRef, useState } from 'react'
import { getAuthToken, useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { apiClient } from '@/features/referral/lib/api-client'

const STORAGE_KEY = 'twitter_sync_last'

type LastSynced = {
  walletAddress: string
  twitterId: string
  twitterHandle: string
}

function readLastSynced(): LastSynced | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LastSynced) : null
  } catch {
    return null
  }
}

function writeLastSynced(value: LastSynced) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // localStorage quota / SecurityError — the server will still serve as the source of truth.
  }
}

function clearLastSynced() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function isSame(a: LastSynced | null, b: LastSynced): boolean {
  return (
    !!a && a.walletAddress === b.walletAddress && a.twitterId === b.twitterId && a.twitterHandle === b.twitterHandle
  )
}

/**
 * Keeps the backend's user_twitter_accounts row in sync with whatever Twitter
 * credential Dynamic currently exposes on the client. Runs silently whenever
 * the user is signed in (SIWS session + Dynamic auth) and has Twitter linked.
 * Skips the network call when the (wallet, twitter id, handle) tuple matches
 * the last successful sync stored in localStorage.
 */
export function useTwitterAutoSync() {
  const { user, sdkHasLoaded } = useDynamicContext()
  const { getLinkedAccounts } = useSocialAccounts()
  const inFlight = useRef(false)

  const [sessionTick, setSessionTick] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onChange = () => setSessionTick((n) => n + 1)
    window.addEventListener('referral-session-changed', onChange)
    return () => window.removeEventListener('referral-session-changed', onChange)
  }, [])

  const twitter = useMemo(
    () => (user ? getLinkedAccounts(ProviderEnum.Twitter)[0] : undefined),
    [user, getLinkedAccounts],
  )
  const twitterId = twitter?.id ?? null
  const twitterHandle = twitter?.username ?? null

  useEffect(() => {
    if (!sdkHasLoaded || !user || !twitterId || !twitterHandle) return
    const sessionToken = apiClient.getToken()
    const sessionWallet = apiClient.getSessionWalletAddress()
    if (!sessionToken || !sessionWallet || !apiClient.isTokenValid()) return

    const target: LastSynced = { walletAddress: sessionWallet, twitterId, twitterHandle }
    if (isSame(readLastSynced(), target)) return
    if (inFlight.current) return

    const dynamicToken = getAuthToken()
    if (!dynamicToken) return

    inFlight.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/social/verify-twitter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ token: dynamicToken }),
        })
        if (res.ok) {
          writeLastSynced(target)
        } else if (res.status === 401 || res.status === 404) {
          // Session or credential no longer valid — drop the cached marker so we retry on next signal.
          clearLastSynced()
        }
      } catch (err) {
        console.warn('Twitter auto-sync failed', err)
      } finally {
        inFlight.current = false
      }
    })()
  }, [sdkHasLoaded, user, twitterId, twitterHandle, sessionTick])
}
