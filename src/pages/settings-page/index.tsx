import { useCallback, useMemo, useState } from 'react'
import { useDynamicContext, useSocialAccounts, getAuthToken } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { BadgeCheck, ExternalLink, Loader2, Search, ShieldCheck, Twitter, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { apiClient } from '@/features/referral/lib/api-client'

export default function SettingsPage() {
  const { user, sdkHasLoaded } = useDynamicContext()
  const isAuthed = !!user

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-12 sm:px-10">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {!sdkHasLoaded ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : !isAuthed ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Connect your wallet from the header to manage settings.
          </CardContent>
        </Card>
      ) : (
        <SocialAccountsSection />
      )}
    </div>
  )
}

type VerifiedTwitter = {
  id: string | null
  username: string | null
  displayName: string | null
  avatar: string | null
  verifiedAt: string | null
}

type TweetCheckResult = {
  posted: boolean
  tweetUrl: string | null
  tweetId: string | null
  checkedAt: string
}

type TweetCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'result'; result: TweetCheckResult }
  | { status: 'error'; message: string }

function SocialAccountsSection() {
  const {
    getLinkedAccounts,
    linkSocialAccount,
    unlinkSocialAccount,
    isProcessingForProvider,
  } = useSocialAccounts({
    onError: (err) => {
      console.error('Social account error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update social account')
    },
  })

  const twitterAccounts = useMemo(() => getLinkedAccounts(ProviderEnum.Twitter), [getLinkedAccounts])
  const twitter = twitterAccounts[0]
  const isProcessing = isProcessingForProvider(ProviderEnum.Twitter)
  const [unlinking, setUnlinking] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<VerifiedTwitter | null>(null)
  const [tweetCheck, setTweetCheck] = useState<TweetCheckState>({ status: 'idle' })

  const handleConnect = useCallback(async () => {
    try {
      await linkSocialAccount(ProviderEnum.Twitter)
    } catch (err) {
      console.error('Failed to link Twitter:', err)
    }
  }, [linkSocialAccount])

  const handleDisconnect = useCallback(async () => {
    if (!twitter) return
    setUnlinking(true)
    try {
      await unlinkSocialAccount(ProviderEnum.Twitter, twitter.id)
      setVerified(null)
      setTweetCheck({ status: 'idle' })
      toast.success('Twitter disconnected')
    } catch (err) {
      console.error('Failed to unlink Twitter:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect Twitter')
    } finally {
      setUnlinking(false)
    }
  }, [twitter, unlinkSocialAccount])

  const handleVerify = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      toast.error('Sign in with Dynamic before verifying')
      return
    }
    const sessionToken = apiClient.getToken()
    if (!sessionToken) {
      toast.error('Sign in with your wallet before verifying')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/social/verify-twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        verified?: boolean
        twitter?: VerifiedTwitter
        error?: string
      }
      if (!res.ok || !data.verified || !data.twitter) {
        throw new Error(data.error ?? 'Verification failed')
      }
      setVerified(data.twitter)
      toast.success(
        data.twitter.username
          ? `Verified @${data.twitter.username} via backend`
          : 'Twitter ownership verified',
      )
    } catch (err) {
      console.error('Twitter verification failed:', err)
      toast.error(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }, [])

  const handleCheckTweet = useCallback(async () => {
    const sessionToken = apiClient.getToken()
    if (!sessionToken) {
      toast.error('Sign in with your wallet first')
      return
    }
    setTweetCheck({ status: 'checking' })
    try {
      const res = await fetch('/api/social/check-referral-tweet', {
        method: 'GET',
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      const data = (await res.json().catch(() => ({}))) as {
        posted?: boolean
        tweetUrl?: string | null
        tweetId?: string | null
        checkedAt?: string
        error?: string
        retryAfterSeconds?: number
      }
      if (!res.ok) {
        if (res.status === 409 && data.error === 'twitter_not_verified') {
          throw new Error('Verify Twitter ownership first.')
        }
        if (res.status === 409 && data.error === 'no_active_referral_code') {
          throw new Error('Create a referral code first.')
        }
        if (res.status === 429) {
          const wait = data.retryAfterSeconds ?? 30
          throw new Error(`Checked too recently. Try again in ${wait}s.`)
        }
        throw new Error(data.error ?? `Check failed (${res.status})`)
      }
      setTweetCheck({
        status: 'result',
        result: {
          posted: !!data.posted,
          tweetUrl: data.tweetUrl ?? null,
          tweetId: data.tweetId ?? null,
          checkedAt: data.checkedAt ?? new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error('Referral tweet check failed:', err)
      const message = err instanceof Error ? err.message : 'Check failed'
      setTweetCheck({ status: 'error', message })
      toast.error(message)
    }
  }, [])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-4">
        {twitter ? (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-10">
                {twitter.avatar ? <AvatarImage src={twitter.avatar} alt={twitter.username ?? 'Twitter avatar'} /> : null}
                <AvatarFallback>{(twitter.username ?? twitter.displayName ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Twitter className="size-4" />
                  <span className="truncate">{twitter.displayName ?? twitter.username ?? 'Twitter'}</span>
                </div>
                {twitter.username ? (
                  <div className="text-xs text-muted-foreground truncate">@{twitter.username}</div>
                ) : null}
                {verified ? (
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" />
                    <span className="truncate">
                      Backend-verified{verified.username ? ` as @${verified.username}` : ''}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleVerify} disabled={verifying}>
                {verifying ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                <span className="ml-2">Verify ownership</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={unlinking || isProcessing}>
                {unlinking ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
                <span className="ml-2">Disconnect</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Twitter className="size-4" />
                Twitter
              </div>
              <div className="text-xs text-muted-foreground">No Twitter account linked.</div>
            </div>
            <Button onClick={handleConnect} disabled={isProcessing} size="sm">
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Twitter className="size-4" />}
              <span className="ml-2">Connect Twitter</span>
            </Button>
          </>
        )}
        </div>
        {twitter && verified ? (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium">Referral tweet</div>
                <div className="text-xs text-muted-foreground">
                  We'll look for a tweet from @{verified.username} containing your active referral code.
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCheckTweet}
                disabled={tweetCheck.status === 'checking'}
              >
                {tweetCheck.status === 'checking' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                <span className="ml-2">
                  {tweetCheck.status === 'result' && !tweetCheck.result.posted
                    ? 'Check again'
                    : 'Check if I tweeted my referral'}
                </span>
              </Button>
            </div>
            {tweetCheck.status === 'result' ? (
              tweetCheck.result.posted ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="size-4" />
                  <span>Referral tweet found.</span>
                  {tweetCheck.result.tweetUrl ? (
                    <a
                      href={tweetCheck.result.tweetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      View tweet <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">
                  No matching tweet found yet.
                </div>
              )
            ) : null}
            {tweetCheck.status === 'error' ? (
              <div className="mt-3 text-sm text-destructive">{tweetCheck.message}</div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
