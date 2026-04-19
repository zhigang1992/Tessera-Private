import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import { useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { Loader2, Twitter } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWallet } from '@/hooks/use-wallet'
import { resolveTokenIdFromParam, getAppToken } from '@/config'
import { CriterionRow } from './components/criterion-row'
import { useEligibilityChecks, VOLUME_THRESHOLD_USD } from './hooks/use-eligibility-checks'
import { isSocialCardTokenId, shareSocialCardOnTwitter } from './utils/share'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function EligibilityPage() {
  const params = useParams<{ auctionId?: string }>()
  const { user, sdkHasLoaded } = useDynamicContext()
  const { publicKey, connected } = useWallet()

  const tokenId = useMemo(() => resolveTokenIdFromParam(params.auctionId), [params.auctionId])
  const token = tokenId ? getAppToken(tokenId) : null
  const walletAddress = connected && publicKey ? publicKey.toBase58() : null

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-12 sm:px-10">
      <h1 className="text-2xl font-semibold mb-1">
        {token?.displayName ?? 'Auction'} Eligibility
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Meet all requirements to participate in the {token?.displayName ?? ''} auction.
      </p>

      {!sdkHasLoaded ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : !user || !walletAddress ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Connect your wallet from the header to check eligibility.
          </CardContent>
        </Card>
      ) : (
        <EligibilityContent
          walletAddress={walletAddress}
          tokenId={tokenId}
          tokenDisplayName={token?.displayName ?? 'the auction'}
        />
      )}
    </div>
  )
}

function EligibilityContent({
  walletAddress,
  tokenId,
  tokenDisplayName,
}: {
  walletAddress: string
  tokenId: string | null
  tokenDisplayName: string
}) {
  const { getLinkedAccounts, linkSocialAccount, isProcessingForProvider } = useSocialAccounts({
    onError: (err) => {
      console.error('Social account error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update social account')
    },
  })

  const twitter = useMemo(() => getLinkedAccounts(ProviderEnum.Twitter)[0], [getLinkedAccounts])
  const twitterHandle = twitter?.username ?? null
  const isLinkingTwitter = isProcessingForProvider(ProviderEnum.Twitter)

  const { volume, twitter: twitterState, post, isRunning, run } = useEligibilityChecks()

  const handleRun = useCallback(() => {
    run({ wallet: walletAddress, twitterHandle })
  }, [run, walletAddress, twitterHandle])

  const handleConnectTwitter = useCallback(async () => {
    try {
      await linkSocialAccount(ProviderEnum.Twitter)
    } catch (err) {
      console.error('Failed to link Twitter:', err)
    }
  }, [linkSocialAccount])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</div>
          <div className="font-mono text-sm break-all text-black dark:text-[#d2d2d2]">
            {walletAddress}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleRun} disabled={isRunning} className="w-full h-11">
        {isRunning ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        {isRunning ? 'Checking…' : 'Check Eligibility'}
      </Button>

      <div className="flex flex-col gap-2.5">
        <CriterionRow
          title="Trading volume"
          description={`Your lifetime trading volume must be at least ${USD_FORMATTER.format(VOLUME_THRESHOLD_USD)}. Volume from linked child wallets is included.`}
          status={volume.status}
          detail={
            volume.status === 'pass' || volume.status === 'fail'
              ? (
                <span className="text-[#71717a] dark:text-[#999]">
                  Current volume: {USD_FORMATTER.format(volume.volumeUsd ?? 0)}
                  {volume.linkedWalletCount > 0
                    ? ` (across ${volume.linkedWalletCount + 1} wallets)`
                    : null}
                </span>
              )
              : volume.status === 'error'
                ? <span className="text-red-600">{volume.error}</span>
                : null
          }
          action={
            volume.status === 'fail'
              ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/wallet-link?parent=${encodeURIComponent(walletAddress)}`, '_blank', 'noopener')}
                >
                  Link another wallet
                </Button>
              )
              : null
          }
        />

        <CriterionRow
          title="Twitter connected"
          description="Link your Twitter account in Settings to qualify."
          status={twitterState.status}
          detail={
            twitter
              ? (
                <span className="text-[#71717a] dark:text-[#999]">
                  Connected as @{twitter.username ?? twitter.displayName ?? '—'}
                </span>
              )
              : null
          }
          action={
            !twitter
              ? (
                <Button size="sm" onClick={handleConnectTwitter} disabled={isLinkingTwitter}>
                  {isLinkingTwitter
                    ? <Loader2 className="size-4 animate-spin mr-2" />
                    : <Twitter className="size-4 mr-2" />}
                  Connect Twitter
                </Button>
              )
              : null
          }
        />

        <CriterionRow
          title="Social card posted"
          description="Post a Tessera social card from your Twitter account."
          status={post.status}
          detail={
            post.status === 'pass' && post.tweetUrl
              ? (
                <a
                  href={post.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#06a800] underline"
                >
                  View your post
                </a>
              )
              : post.status === 'error'
                ? <span className="text-red-600">{post.error}</span>
                : !twitter
                  ? (
                    <span className="text-[#71717a] dark:text-[#999]">
                      Connect Twitter first.
                    </span>
                  )
                  : null
          }
          action={
            post.status === 'fail' && twitter && isSocialCardTokenId(tokenId)
              ? (
                <Button
                  size="sm"
                  onClick={() => shareSocialCardOnTwitter(walletAddress, tokenId, tokenDisplayName)}
                >
                  Post social card
                </Button>
              )
              : null
          }
        />
      </div>
    </div>
  )
}
