import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getAuthToken, useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { CheckCircle2, Copy, HelpCircle, Info, Loader2, Twitter } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@/hooks/use-wallet'
import { resolveTokenIdFromParam, getAppToken } from '@/config'
import { useHeader } from '@/contexts/header-context'
import { useReferralAuth } from '@/features/referral/hooks/use-referral-auth'
import { syncTwitterToBackend } from '@/lib/twitter-sync'
import { isSocialCardTokenId } from '@/lib/social-card'
import { CriterionRow } from './components/criterion-row'
import { RequirementOption, type OptionStatus } from './components/requirement-option'
import {
  useEligibilityChecks,
  LIFETIME_VOLUME_THRESHOLD_USD,
  SNAPSHOT_VOLUME_THRESHOLD_USD,
  PRESALE_SNAPSHOT_DATE,
  type CheckStatus,
} from './hooks/use-eligibility-checks'
import { shareSocialCardOnTwitter } from './utils/share'
import {
  fetchWhitelistApplication,
  qualifyWhitelist,
  WhitelistAutoWriteError,
  type QualifiedVia,
  type WhitelistApplication,
} from './api'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function optionFromChecks(...statuses: CheckStatus[]): OptionStatus {
  if (statuses.length === 0) return 'pending'
  if (statuses.every((s) => s === 'pass')) return 'met'
  if (statuses.some((s) => s === 'fail' || s === 'error')) return 'unmet'
  return 'pending'
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function describeQualifiedVia(via: QualifiedVia): string {
  switch (via) {
    case 'snapshot_volume':
      return 'snapshot trading volume'
    case 'solana_mobile':
      return 'Solana Mobile device'
    case 'volume_twitter':
      return 'trading volume + X connection'
    case 'admin_manual':
      return 'manual admin entry'
    case 'admin_csv':
      return 'admin batch import'
  }
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-black dark:text-[#d2d2d2]">
            Eligibility Check
          </h1>
          <p className="font-normal text-[16px] text-[#666] dark:text-[#999]">
            You qualify for Pre-Sale 2 access if you meet any one of the following:
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

      <div className="rounded-[12px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.01)] bg-[#efefef] dark:bg-[#18181a] px-5 py-3.5">
        <div className="flex gap-3 items-start">
          <Info className="size-5 shrink-0 mt-0.5 text-[#0ea5e9]" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-[14px] text-black dark:text-[#d2d2d2]">
              Pre-Sale 1 Selection Notice
            </p>
            <p className="font-normal text-[13px] leading-relaxed text-[#666] dark:text-[#999]">
              Tessera will manually select 40 contributors from the Pre-Sale 2 eligible pool for
              exclusive access to Pre-Sale 1. Selection focuses on meaningful community engagement,
              social activity, and long-term support. Please check back later to see if your address
              has been whitelisted for Pre-Sale 1.
            </p>
          </div>
        </div>
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
  const twitterLinked = !!twitter
  const socialCardSupported = isSocialCardTokenId(tokenId)

  const { isAuthenticated, isAuthenticating, authenticate } = useReferralAuth()
  const { volume, snapshot, solana, twitter: twitterState, post, isRunning, run } =
    useEligibilityChecks()

  const [existing, setExisting] = useState<WhitelistApplication | null>(null)

  // Hydrate existing application (if any) so returning users see their state
  // without having to re-run Check Eligibility.
  useEffect(() => {
    let cancelled = false
    fetchWhitelistApplication(walletAddress)
      .then((app) => {
        if (cancelled) return
        setExisting(app.qualified ? app : null)
      })
      .catch(() => {
        /* Transient fetch failure shouldn't block the check flow. */
      })
    return () => {
      cancelled = true
    }
  }, [walletAddress])

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

    await run({
      wallet: walletAddress,
      twitterHandle,
      tokenId,
      checkSocialPost: socialCardSupported && twitterLinked,
    })

    // Auto-write per D4: the click is the consent, and any passing option
    // upserts the application row server-side (re-validated server-side).
    try {
      const result = await qualifyWhitelist(tokenId)
      if (result.kind === 'qualified') {
        setExisting(result.application)
      }
    } catch (err) {
      const message =
        err instanceof WhitelistAutoWriteError
          ? err.message
          : 'Failed to record whitelist eligibility.'
      toast.error(message)
    }
  }, [
    isAuthenticated,
    authenticate,
    twitterId,
    twitterHandle,
    twitterLinked,
    walletAddress,
    tokenId,
    socialCardSupported,
    run,
  ])

  const handleConnectTwitter = useCallback(async () => {
    try {
      await linkSocialAccount(ProviderEnum.Twitter)
    } catch (err) {
      console.error('Failed to link Twitter:', err)
    }
  }, [linkSocialAccount])

  const handlePostSocialCard = useCallback(() => {
    if (!tokenId || !isSocialCardTokenId(tokenId)) return
    shareSocialCardOnTwitter(walletAddress, tokenDisplayName, twitterHandle)
  }, [tokenId, walletAddress, tokenDisplayName, twitterHandle])

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      toast.success('Address copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const snapshotStatus = optionFromChecks(snapshot.status)
  const solanaStatus = optionFromChecks(solana.status)
  const volumeTwitterStatus = optionFromChecks(volume.status, twitterState.status)

  const hasChecked =
    snapshot.status !== 'idle' ||
    solana.status !== 'idle' ||
    volume.status !== 'idle' ||
    twitterState.status !== 'idle'

  const isEligible =
    snapshotStatus === 'met' || solanaStatus === 'met' || volumeTwitterStatus === 'met'

  const qualifiedOnRecord = existing?.qualified === true

  const statusColor = qualifiedOnRecord
    ? '#06a800'
    : hasChecked
      ? isEligible
        ? '#06a800'
        : '#d4183d'
      : '#999'

  const presale1Whitelisted = qualifiedOnRecord && existing?.presale1Selected === true

  const statusText = qualifiedOnRecord
    ? "You're Eligible for Pre-Sale 2"
    : hasChecked
      ? isEligible
        ? "You're Eligible for Pre-Sale 2"
        : "You're not Eligible Yet!"
      : null

  const subText = qualifiedOnRecord && existing?.qualifiedVia
    ? `Qualified via ${describeQualifiedVia(existing.qualifiedVia)}.`
    : null

  const verifyLabel = isAuthenticating
    ? 'Signing in…'
    : isRunning
      ? 'Verifying…'
      : hasChecked
        ? 'Re-verify Status'
        : 'Verify Status'

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
              {presale1Whitelisted ? (
                <>
                  <h2 className="font-bold text-[18px] text-[#06a800]">
                    You're Whitelisted for Pre-Sale 1
                  </h2>
                  <div className="w-full h-px bg-[rgba(17,17,17,0.1)] dark:bg-[rgba(210,210,210,0.1)] my-1" />
                </>
              ) : null}
              {statusText ? (
                <h2 className="font-bold text-[18px]" style={{ color: statusColor }}>
                  {statusText}
                </h2>
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

              {qualifiedOnRecord || (hasChecked && isEligible) ? null : (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isRunning || isAuthenticating}
                  className="w-full py-3.5 rounded-[10px] font-bold text-[16px] bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRunning || isAuthenticating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {verifyLabel}
                </button>
              )}
            </div>
          </div>

          {socialCardSupported ? (
            <div className="p-6 rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-4 items-start flex-1">
                  <div className="shrink-0 mt-1">
                    {post.status === 'pass' ? (
                      <CheckCircle2 className="size-6 text-[#06a800]" />
                    ) : (
                      <Twitter className="size-6 text-[#999]" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <h5 className="font-semibold text-[15px] text-black dark:text-[#d2d2d2]">
                      {post.status === 'pass' ? 'Social card posted' : 'Post social card (optional)'}
                    </h5>
                    <p className="font-normal text-[14px] text-[#666] dark:text-[#999]">
                      Post a Tessera social card from your X account.
                    </p>
                    {post.status === 'pass' && post.tweetUrl ? (
                      <a
                        href={post.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-[#06a800] underline"
                      >
                        View your post
                      </a>
                    ) : post.status === 'error' ? (
                      <p className="text-[14px] text-red-600">{post.error}</p>
                    ) : !twitterLinked ? (
                      <p className="text-[14px] text-[#666] dark:text-[#999]">Connect X first.</p>
                    ) : null}
                  </div>
                </div>
                {twitterLinked && post.status !== 'pass' ? (
                  <button
                    type="button"
                    onClick={handlePostSocialCard}
                    className="shrink-0 px-4 py-2 rounded-[6px] font-medium text-[14px] transition-colors flex items-center gap-2 bg-[#111] text-white hover:bg-[#333] dark:bg-[#D2FB95] dark:text-black dark:hover:bg-[#AAD36D]"
                  >
                    Post Card
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="p-5 rounded-[12px] border border-[#AAD36D40] dark:border-[#D2FB9520] bg-[#EEFFD3] dark:bg-[#D2FB9508]">
            <div className="flex gap-4 items-start">
              <HelpCircle className="size-6 shrink-0 text-[#AAD36D]" />
              <div className="flex flex-col gap-2">
                <p className="font-medium text-[15px] text-[#6c8b40] dark:text-[#AAD36D]">
                  Why do I need to be eligible?
                </p>
                <p className="font-normal text-[14px] leading-relaxed text-[#666] dark:text-[#999]">
                  To ensure a fair distribution and prevent sybil attacks, we require participants
                  to meet certain activity milestones.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="p-[30px] rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm flex flex-col gap-5">
            <h3 className="font-semibold text-[20px] text-black dark:text-[#d2d2d2]">
              Qualification Options
            </h3>

            <div className="flex flex-col gap-3">
              <RequirementOption
                label="Option 1"
                description={`Trade ${USD_FORMATTER.format(SNAPSHOT_VOLUME_THRESHOLD_USD)}+ of ${tokenDisplayName} before ${PRESALE_SNAPSHOT_DATE} snapshot`}
                status={snapshotStatus}
                additionalInfo={
                  snapshot.status === 'pass' || snapshot.status === 'fail' ? (
                    <>Snapshot volume: {USD_FORMATTER.format(snapshot.volumeUsd ?? 0)}</>
                  ) : snapshot.status === 'error' ? (
                    <span className="text-red-600">{snapshot.error}</span>
                  ) : null
                }
                extraActionLabel={snapshotStatus === 'unmet' ? 'Link another wallet' : undefined}
                onExtraAction={() =>
                  window.open(
                    `/wallet-link?parent=${encodeURIComponent(walletAddress)}`,
                    '_blank',
                    'noopener',
                  )
                }
              />

              <RequirementOption
                label="Option 2"
                description="Connect to Tessera using a Solana mobile device"
                status={solanaStatus}
                additionalInfo={
                  solana.status === 'error' ? (
                    <span className="text-red-600">{solana.error}</span>
                  ) : null
                }
              />

              <RequirementOption label="Option 3" status={volumeTwitterStatus}>
                <CriterionRow
                  title="Trading volume"
                  description={`Your lifetime trading volume must be at least ${USD_FORMATTER.format(LIFETIME_VOLUME_THRESHOLD_USD)}. Volume from linked child wallets is included.`}
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
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `/wallet-link?parent=${encodeURIComponent(walletAddress)}`,
                            '_blank',
                            'noopener',
                          )
                        }
                        className="shrink-0 px-4 py-2 rounded-[6px] font-medium text-[14px] transition-colors flex items-center gap-2 bg-[#111] text-white hover:bg-[#333] dark:bg-[#D2FB95] dark:text-black dark:hover:bg-[#AAD36D]"
                      >
                        Link another wallet
                      </button>
                    ) : null
                  }
                />

                <CriterionRow
                  title={twitterLinked ? 'X connected' : 'Connect your X'}
                  description="Link your X account in Settings to qualify."
                  status={twitterState.status}
                  additionalInfo={
                    twitterLinked && twitterHandle ? <>Connected as @{twitterHandle}</> : null
                  }
                  action={
                    !twitter ? (
                      <button
                        type="button"
                        onClick={handleConnectTwitter}
                        disabled={isLinkingTwitter}
                        className="shrink-0 px-4 py-2 rounded-[6px] font-medium text-[14px] transition-colors flex items-center gap-2 bg-[#111] text-white hover:bg-[#333] dark:bg-[#D2FB95] dark:text-black dark:hover:bg-[#AAD36D] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLinkingTwitter ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Twitter className="size-4" />
                        )}
                        Connect X
                      </button>
                    ) : null
                  }
                />
              </RequirementOption>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
