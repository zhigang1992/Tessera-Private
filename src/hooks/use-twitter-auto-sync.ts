import { useEffect, useMemo, useRef, useState } from 'react'
import { getAuthToken, useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { syncTwitterToBackend } from '@/lib/twitter-sync'

/**
 * Keeps the backend's user_twitter_accounts row in sync with whatever Twitter
 * credential Dynamic currently exposes on the client. Runs silently whenever
 * the user is signed in (SIWS session + Dynamic auth) and has Twitter linked.
 * The underlying sync helper is idempotent via a localStorage marker, so
 * calling this alongside an explicit syncTwitterToBackend from a click
 * handler is safe.
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
    if (inFlight.current) return

    const dynamicToken = getAuthToken()
    if (!dynamicToken) return

    inFlight.current = true
    void syncTwitterToBackend({ dynamicToken, twitterId, twitterHandle }).finally(() => {
      inFlight.current = false
    })
  }, [sdkHasLoaded, user, twitterId, twitterHandle, sessionTick])
}
