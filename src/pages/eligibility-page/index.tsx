import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getAuthToken, useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { Copy, Loader2, Twitter } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/use-wallet'
import { resolveTokenIdFromParam, getAppToken } from '@/config'
import { useHeader } from '@/contexts/header-context'
import { useReferralAuth } from '@/features/referral/hooks/use-referral-auth'
import { syncTwitterToBackend } from '@/lib/twitter-sync'
import { CriterionRow } from './components/criterion-row'
import { useEligibilityChecks, VOLUME_THRESHOLD_USD, type CheckStatus } from './hooks/use-eligibility-checks'
import { isSocialCardTokenId, shareSocialCardOnTwitter } from './utils/share'
import {
  applyForWhitelist,
  fetchWhitelistApplication,
  WhitelistApplyError,
  type WhitelistApplicationStatus,
} from './api'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

type AggregateStatus = 'met' | 'unmet' | 'pending'
type ApplicationStatus = 'not-applied' | 'pending' | 'approved' | 'unapproved'

function toApplicationStatus(apiStatus: WhitelistApplicationStatus): ApplicationStatus {
  return apiStatus === 'rejected' ? 'unapproved' : apiStatus
}

function aggregateStatus(...statuses: CheckStatus[]): AggregateStatus {
  if (statuses.every((s) => s === 'pass')) return 'met'
  if (statuses.some((s) => s === 'fail' || s === 'error')) return 'unmet'
  return 'pending'
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function EligibilityPage() {
  const params = useParams<{ auctionId?: string }>()
  const navigate = useNavigate()
  const { user, sdkHasLoaded } = useDynamicContext()
  const { publicKey, connected } = useWallet()
  const { setBackButton } = useHeader()

  const tokenId = useMemo(() => resolveTokenIdFromParam(params.auctionId), [params.auctionId])
  const token = tokenId ? getAppToken(tokenId) : null
  const walletAddress = connected && publicKey ? publicKey.toBase58() : null

  const handleBack = useCallback(() => {
    if (params.auctionId) {
      navigate(`/auction/${params.auctionId}`)
    } else {
      navigate(-1)
    }
  }, [navigate, params.auctionId])

  useEffect(() => {
    setBackButton({ show: true, text: 'Back to Auction', onClick: handleBack })
    return () => setBackButton(undefined)
  }, [setBackButton, handleBack])

  return (
    <div className="mx-auto w-full max-w-[1200px] p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-black dark:text-[#d2d2d2]">
            Eligibility Check
          </h1>
          <p className="text-[16px] text-[#666] dark:text-[#999]">
            Meet all conditions below and submit your application for manual approval to access{' '}
            {token?.displayName ?? ''}:
          </p>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="shrink-0 hidden md:flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[14px] bg-white dark:bg-[#27272a] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] text-black dark:text-[#d2d2d2] hover:bg-[#f5f5f5] dark:hover:bg-[#323334] transition-colors"
        >
          Back to Auction
        </button>
      </div>

      {!sdkHasLoaded ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : !user || !walletAddress ? (
        <div className="rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] p-6 text-sm text-[#666] dark:text-[#999] shadow-sm">
          Connect your wallet from the header to check eligibility.
        </div>
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
  const twitterId = twitter?.id ?? null
  const twitterHandle = twitter?.username ?? null
  const isLinkingTwitter = isProcessingForProvider(ProviderEnum.Twitter)

  const { isAuthenticated, isAuthenticating, authenticate } = useReferralAuth()
  const { volume, twitter: twitterState, post, isRunning, run } = useEligibilityChecks()

  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('not-applied')
  const [isApplying, setIsApplying] = useState(false)

  // Hydrate application status on mount from the D1-backed whitelist table.
  // If the admin has already approved/rejected, skip straight to the decided
  // UI state without requiring the user to re-run the checks.
  useEffect(() => {
    if (!tokenId) return
    let cancelled = false
    fetchWhitelistApplication(walletAddress, tokenId)
      .then((app) => {
        if (cancelled) return
        setApplicationStatus(toApplicationStatus(app.status))
      })
      .catch(() => {
        /* Leave default 'not-applied' — a transient fetch failure shouldn't block apply. */
      })
    return () => {
      cancelled = true
    }
  }, [walletAddress, tokenId])

  const handleRun = useCallback(async () => {
    if (!isAuthenticated) {
      const ok = await authenticate()
      if (!ok) return
    }
    if (twitterId && twitterHandle) {
      const dynamicToken = getAuthToken()
      if (dynamicToken) {
        await syncTwitterToBackend({ dynamicToken, twitterId, twitterHandle })
      }
    }
    run({ wallet: walletAddress, twitterHandle, tokenId })
  }, [isAuthenticated, authenticate, twitterId, twitterHandle, walletAddress, tokenId, run])

  const handleApply = useCallback(async () => {
    if (!tokenId) return
    setIsApplying(true)
    try {
      if (!isAuthenticated) {
        const ok = await authenticate()
        if (!ok) return
      }
      const app = await applyForWhitelist(tokenId)
      setApplicationStatus(toApplicationStatus(app.status))
    } catch (err) {
      const message =
        err instanceof WhitelistApplyError ? err.message : 'Failed to submit application.'
      toast.error(message)
    } finally {
      setIsApplying(false)
    }
  }, [tokenId, isAuthenticated, authenticate])

  const handleConnectTwitter = useCallback(async () => {
    try {
      await linkSocialAccount(ProviderEnum.Twitter)
    } catch (err) {
      console.error('Failed to link Twitter:', err)
    }
  }, [linkSocialAccount])

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      toast.success('Address copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const twitterLinked = !!twitter
  const twitterHandleDisplay = twitter?.username ?? null

  const hasChecked =
    volume.status !== 'idle' ||
    post.status !== 'idle' ||
    twitterState.status !== 'idle'

  const aggregate = aggregateStatus(
    volume.status,
    twitterState.status,
    post.status,
  )
  const isEligible = aggregate === 'met'

  const statusColor =
    applicationStatus === 'approved'
      ? '#06a800'
      : applicationStatus === 'unapproved'
        ? '#999'
        : applicationStatus === 'pending'
          ? '#d4a017'
          : hasChecked
            ? isEligible
              ? '#06a800'
              : '#d4183d'
            : '#999'

  const statusText =
    applicationStatus === 'approved'
      ? "You're Whitelisted for Pre-Sale1."
      : applicationStatus === 'unapproved'
        ? "You're not Whitelisted for Pre-Sale1."
        : applicationStatus === 'pending'
          ? "Your Pre-Sale1 Whitelist application is under review."
          : hasChecked
            ? isEligible
              ? "You're Eligible to Apply Pre-Sale1 Whitelist."
              : "You're not Eligible Yet!"
            : null

  const optionStyles = {
    met: 'bg-[#06a80008] dark:bg-[#06a80010] border-[#06a80020] dark:border-[#06a80030]',
    unmet: 'bg-[#d4183d08] dark:bg-[#d4183d10] border-[#d4183d20] dark:border-[#d4183d30]',
    pending:
      'bg-[#f5f5f5] dark:bg-[#ffffff05] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]',
  }[aggregate]

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[10px] items-start">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-[30px] rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ backgroundColor: statusColor }} />
                <span className="font-semibold text-[14px] tracking-wide uppercase text-black dark:text-[#d2d2d2]">
                  Current Status
                </span>
              </div>
              {statusText ? (
                <h2 className="font-bold text-[20px]" style={{ color: statusColor }}>
                  {statusText}
                </h2>
              ) : null}
              {applicationStatus === 'unapproved' ? (
                <p className="font-medium text-[14px] text-[#06a800]">
                  You are now automatically whitelisted for Pre-Sale2.
                </p>
              ) : null}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-[rgba(210,210,210,0.05)] border border-[rgba(210,210,210,0.1)]">
                <span className="font-mono text-[12px] text-[#666] dark:text-[#999] flex-1">
                  {truncateAddress(walletAddress)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="shrink-0 text-[#666] dark:text-[#999] hover:opacity-70"
                  aria-label="Copy address"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>

              {!hasChecked && applicationStatus === 'not-applied' ? (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isRunning || isAuthenticating}
                  className="w-full py-3.5 rounded-[10px] font-bold text-[16px] bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRunning || isAuthenticating ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isAuthenticating ? 'Signing in…' : isRunning ? 'Checking…' : 'Check Eligibility'}
                </button>
              ) : null}

              {hasChecked && applicationStatus === 'not-applied' ? (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!isEligible || isApplying}
                  className={`w-full py-3.5 rounded-[10px] font-bold text-[16px] transition-colors flex items-center justify-center gap-2 ${
                    isEligible
                      ? 'bg-[#111] text-white hover:bg-[#333] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                      : 'bg-[#999] text-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isApplying ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isApplying ? 'Applying…' : 'Apply Whitelist'}
                </button>
              ) : null}

              {applicationStatus === 'pending' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-[10px] font-bold text-[16px] bg-[#111] text-white opacity-50 cursor-not-allowed"
                >
                  Whitelist Applied
                </button>
              ) : null}
            </div>
          </div>

          <div className="p-6 rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm">
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-[16px] text-black dark:text-[#d2d2d2]">
                {tokenDisplayName} Rules
              </h3>
              <ul className="flex flex-col gap-2">
                {[
                  `Limited to 40 participants with up to ${USD_FORMATTER.format(VOLUME_THRESHOLD_USD)} each.`,
                  'Meet all requirements and apply to join.',
                  'All access is manually reviewed and approved.',
                ].map((rule, i) => (
                  <li
                    key={i}
                    className="font-normal text-[14px] leading-relaxed flex items-start gap-2 text-[#666] dark:text-[#999]"
                  >
                    <span className="shrink-0 mt-1.5 size-1 rounded-full bg-current opacity-50" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 p-[30px] rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm flex flex-col gap-5">
          <h3 className="font-semibold text-[20px] text-black dark:text-[#d2d2d2]">Qualification Conditions</h3>

          <div className={`flex flex-col rounded-[10px] border transition-all ${optionStyles}`}>
            <div className="p-5 pb-0">
              <h4 className="font-semibold text-[16px] text-black dark:text-[#d2d2d2]">
                {tokenDisplayName} application conditions
              </h4>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <CriterionRow
                title="Trading volume"
                description={`Your lifetime trading volume must be at least ${USD_FORMATTER.format(VOLUME_THRESHOLD_USD)}. Volume from linked child wallets is included.`}
                status={volume.status}
                additionalInfo={
                  volume.status === 'pass' || volume.status === 'fail' ? (
                    <>
                      Current volume: {USD_FORMATTER.format(volume.volumeUsd ?? 0)}
                      {volume.linkedWalletCount > 0
                        ? ` (across ${volume.linkedWalletCount + 1} wallets)`
                        : null}
                    </>
                  ) : volume.status === 'error' ? (
                    <span className="text-red-600">{volume.error}</span>
                  ) : null
                }
                action={
                  volume.status === 'fail' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(`/wallet-link?parent=${encodeURIComponent(walletAddress)}`, '_blank', 'noopener')
                      }
                    >
                      Link another wallet
                    </Button>
                  ) : null
                }
              />

              <CriterionRow
                title={twitterLinked ? 'X connected' : 'Connect your X'}
                description="Link your X account in Settings to qualify."
                status={twitterState.status}
                additionalInfo={
                  twitterLinked && twitterHandleDisplay ? (
                    <>Connected as @{twitterHandleDisplay}</>
                  ) : null
                }
                action={
                  !twitter ? (
                    <Button size="sm" onClick={handleConnectTwitter} disabled={isLinkingTwitter}>
                      {isLinkingTwitter ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        <Twitter className="size-4 mr-2" />
                      )}
                      Connect X
                    </Button>
                  ) : null
                }
              />

              <CriterionRow
                title={post.status === 'pass' ? 'Social card posted' : 'Post social card'}
                description="Post a Tessera social card from your X account."
                status={post.status}
                additionalInfo={
                  post.status === 'pass' && post.tweetUrl ? (
                    <a
                      href={post.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#06a800] underline"
                    >
                      View your post
                    </a>
                  ) : post.status === 'error' ? (
                    <span className="text-red-600">{post.error}</span>
                  ) : !twitterLinked ? (
                    <>Connect X first.</>
                  ) : null
                }
                action={
                  post.status === 'fail' && twitter && isSocialCardTokenId(tokenId) ? (
                    <Button size="sm" onClick={() => shareSocialCardOnTwitter(walletAddress, tokenId, tokenDisplayName)}>
                      Post social card
                    </Button>
                  ) : null
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
