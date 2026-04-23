import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getAuthToken, useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { CheckCircle2, Copy, HelpCircle, Loader2, Twitter, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/use-wallet'
import { resolveTokenIdFromParam, getAppToken, type AppTokenId } from '@/config'
import { useHeader } from '@/contexts/header-context'
import { useReferralAuth } from '@/features/referral/hooks/use-referral-auth'
import { syncTwitterToBackend } from '@/lib/twitter-sync'
import {
  fetchPresaleSnapshotVolume,
  fetchSolanaMobileEligibility,
  PRESALE2_SNAPSHOT_DATE,
} from './api'
import { CriterionRow } from '../eligibility-page/components/criterion-row'
import {
  useEligibilityChecks,
  VOLUME_THRESHOLD_USD,
  type CheckStatus,
} from '../eligibility-page/hooks/use-eligibility-checks'
import { isSocialCardTokenId, shareSocialCardOnTwitter } from '../eligibility-page/utils/share'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const OPTION1_VOLUME_THRESHOLD_USD = 1000

type OptionStatus = 'met' | 'unmet' | 'pending'

type Option1State = { status: CheckStatus; volumeUsd: number }
type Option2State = { status: CheckStatus }

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

function RequirementOption({
  label,
  description,
  additionalInfo,
  status,
  extraActionLabel,
  onExtraAction,
  children,
}: {
  label: string
  description?: string
  additionalInfo?: ReactNode
  status: OptionStatus
  extraActionLabel?: string
  onExtraAction?: () => void
  children?: ReactNode
}) {
  const style =
    status === 'met'
      ? {
          Icon: CheckCircle2,
          color: '#06a800',
          container:
            'bg-[#06a80008] dark:bg-[#06a80010] border-[#06a80020] dark:border-[#06a80030]',
        }
      : status === 'unmet'
        ? {
            Icon: XCircle,
            color: '#d4183d',
            container:
              'bg-[#d4183d08] dark:bg-[#d4183d10] border-[#d4183d20] dark:border-[#d4183d30]',
          }
        : {
            Icon: HelpCircle,
            color: '#999',
            container:
              'bg-[#f5f5f5] dark:bg-[#ffffff05] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]',
          }
  const { Icon, color, container } = style
  return (
    <div className={clsx('flex flex-col rounded-[10px] border transition-all', container)}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Icon className="size-6 shrink-0 mt-1" style={{ color }} />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h4 className="font-semibold text-[16px] text-black dark:text-[#d2d2d2]">{label}</h4>
            {description ? (
              <p className="text-[14px] text-[#666] dark:text-[#999]">{description}</p>
            ) : null}
            {additionalInfo ? (
              <div className="text-[14px] text-[#666] dark:text-[#999]">{additionalInfo}</div>
            ) : null}
          </div>
        </div>
        {extraActionLabel && status === 'unmet' ? (
          <button
            type="button"
            onClick={onExtraAction}
            className="self-start px-4 py-2 rounded-md font-medium text-[14px] bg-[#111] text-white hover:bg-[#333] dark:bg-[#D2FB95] dark:text-black dark:hover:bg-[#AAD36D] transition-colors"
          >
            {extraActionLabel}
          </button>
        ) : null}
      </div>
      {children ? <div className="px-5 pb-5 flex flex-col gap-3">{children}</div> : null}
    </div>
  )
}

export default function EligibilityPresale2Page() {
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

  const [option1, setOption1] = useState<Option1State>({ status: 'idle', volumeUsd: 0 })
  const [option2, setOption2] = useState<Option2State>({ status: 'idle' })

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

    setOption1({ status: 'checking', volumeUsd: 0 })
    setOption2({ status: 'checking' })

    const option1Promise = tokenId
      ? fetchPresaleSnapshotVolume(walletAddress, tokenId as AppTokenId)
          .then((res) => {
            setOption1({
              status: res.volumeUsd >= OPTION1_VOLUME_THRESHOLD_USD ? 'pass' : 'fail',
              volumeUsd: res.volumeUsd,
            })
          })
          .catch(() => setOption1({ status: 'error', volumeUsd: 0 }))
      : Promise.resolve(setOption1({ status: 'fail', volumeUsd: 0 }))

    const option2Promise = fetchSolanaMobileEligibility(walletAddress)
      .then((res) => setOption2({ status: res === 'met' ? 'pass' : 'fail' }))
      .catch(() => setOption2({ status: 'error' }))

    await Promise.allSettled([option1Promise, option2Promise])
    run({ wallet: walletAddress, twitterHandle, tokenId })
  }, [isAuthenticated, authenticate, twitterId, twitterHandle, walletAddress, tokenId, run])

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

  const option2Status: OptionStatus =
    option2.status === 'pass'
      ? 'met'
      : option2.status === 'fail' || option2.status === 'error'
        ? 'unmet'
        : 'pending'

  const twitterLinked = !!twitter
  const twitterHandleDisplay = twitter?.username ?? null

  const hasChecked =
    option1.status !== 'idle' ||
    option2Status !== 'pending' ||
    volume.status !== 'idle' ||
    post.status !== 'idle' ||
    twitterState.status !== 'idle'

  const option1Status: OptionStatus = optionFromChecks(option1.status)
  const option3Status: OptionStatus = optionFromChecks(
    volume.status,
    twitterState.status,
    post.status,
  )

  const isEligible =
    option1Status === 'met' || option2Status === 'met' || option3Status === 'met'

  const statusColor = hasChecked ? (isEligible ? '#06a800' : '#d4183d') : '#999'
  const statusText = hasChecked
    ? isEligible
      ? "You're Eligible for Pre-Sale2"
      : "You're not Eligible Yet!"
    : null

  const showVerifyButton = !hasChecked || !isEligible
  const verifyLabel = isAuthenticating
    ? 'Signing in…'
    : isRunning
      ? 'Checking…'
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
              {statusText ? (
                <h2 className="font-bold text-[20px]" style={{ color: statusColor }}>
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

              {showVerifyButton ? (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isRunning || isAuthenticating}
                  className="w-full py-3.5 rounded-[10px] font-bold text-[16px] bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRunning || isAuthenticating ? <Loader2 className="size-4 animate-spin" /> : null}
                  {verifyLabel}
                </button>
              ) : null}
            </div>
          </div>

          <div className="p-6 rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm">
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

        <div className="lg:col-span-8 p-[30px] rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm flex flex-col gap-5">
          <h3 className="font-semibold text-[20px] text-black dark:text-[#d2d2d2]">
            Qualification Options
          </h3>

          <div className="flex flex-col gap-3">
            <RequirementOption
              label="Option 1"
              description={`Trade ${USD_FORMATTER.format(OPTION1_VOLUME_THRESHOLD_USD)}+ of ${tokenDisplayName} before ${PRESALE2_SNAPSHOT_DATE} snapshot`}
              status={option1Status}
              additionalInfo={
                option1.status === 'pass' || option1.status === 'fail' ? (
                  <>Trading volume: {USD_FORMATTER.format(option1.volumeUsd)}</>
                ) : null
              }
              extraActionLabel={option1Status === 'unmet' ? 'Link another wallet' : undefined}
              onExtraAction={() =>
                window.open(`/wallet-link?parent=${encodeURIComponent(walletAddress)}`, '_blank', 'noopener')
              }
            />

            <RequirementOption
              label="Option 2"
              description="Connect to Tessera using a Solana mobile device"
              status={option2Status}
            />

            <RequirementOption
              label="Option 3"
              description="Complete all of the following:"
              status={option3Status}
            >
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
            </RequirementOption>
          </div>
        </div>
      </div>
    </>
  )
}
