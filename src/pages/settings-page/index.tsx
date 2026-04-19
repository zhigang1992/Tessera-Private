import { useCallback, useMemo, useState } from 'react'
import { useDynamicContext, useSocialAccounts, getAuthToken } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { BadgeCheck, Loader2, ShieldCheck, Twitter, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

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
    setVerifying(true)
    try {
      const res = await fetch('/api/social/verify-twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
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
      </CardContent>
    </Card>
  )
}
