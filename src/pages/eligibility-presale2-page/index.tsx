import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getAuthToken, useDynamicContext, useSocialAccounts } from '@dynamic-labs/sdk-react-core'
import { ProviderEnum } from '@dynamic-labs/sdk-api-core'
import { ChevronDown, Copy, HelpCircle, Loader2, Twitter } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/use-wallet'
import { resolveTokenIdFromParam, getAppToken } from '@/config'
import { useHeader } from '@/contexts/header-context'
import { useReferralAuth } from '@/features/referral/hooks/use-referral-auth'
import { syncTwitterToBackend } from '@/lib/twitter-sync'
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

type MockOverride = {
  option1: { status: CheckStatus; volumeUsd: number }
  option2: OptionStatus
  option3: {
    volume: { status: CheckStatus; volumeUsd: number }
    twitter: { status: CheckStatus; handle: string | null }
    post: { status: CheckStatus }
  }
}

function optionFromChecks(...statuses: CheckStatus[]): OptionStatus {
  if (statuses.every((s) => s === 'pass')) return 'met'
  if (statuses.some((s) => s === 'fail' || s === 'error')) return 'unmet'
  return 'pending'
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-black dark:text-[#d2d2d2]">
            Eligibility Check
          </h1>
          <p className="text-[16px] text-[#666] dark:text-[#999]">
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

  const [mockOverride, setMockOverride] = useState<MockOverride | null>(null)

  const handleRun = useCallback(async () => {
    setMockOverride(null)
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

  const effectiveOption1 = mockOverride
    ? { status: mockOverride.option1.status, volumeUsd: mockOverride.option1.volumeUsd }
    : volume.status === 'idle' || volume.status === 'checking' || volume.status === 'error'
      ? { status: volume.status, volumeUsd: volume.volumeUsd ?? 0 }
      : {
          status: (volume.volumeUsd ?? 0) >= OPTION1_VOLUME_THRESHOLD_USD ? ('pass' as const) : ('fail' as const),
          volumeUsd: volume.volumeUsd ?? 0,
        }

  const effectiveOption2Status: OptionStatus = mockOverride ? mockOverride.option2 : 'unmet'

  const effectiveVolume = mockOverride
    ? { status: mockOverride.option3.volume.status, volumeUsd: mockOverride.option3.volume.volumeUsd, linkedWalletCount: 0, error: null }
    : volume
  const effectiveTwitter = mockOverride
    ? { status: mockOverride.option3.twitter.status, handle: mockOverride.option3.twitter.handle }
    : twitterState
  const effectiveTwitterHandle = mockOverride ? mockOverride.option3.twitter.handle : twitter?.username ?? null
  const twitterLinked = mockOverride ? !!mockOverride.option3.twitter.handle : !!twitter
  const effectivePost = mockOverride
    ? { status: mockOverride.option3.post.status, tweetUrl: null, error: null }
    : post

  const hasChecked =
    effectiveOption1.status !== 'idle' ||
    effectiveVolume.status !== 'idle' ||
    effectivePost.status !== 'idle' ||
    effectiveTwitter.status !== 'idle'

  const option1Status: OptionStatus = optionFromChecks(effectiveOption1.status)
  const option3Status: OptionStatus = optionFromChecks(
    effectiveVolume.status,
    effectiveTwitter.status,
    effectivePost.status,
  )

  const isEligible =
    option1Status === 'met' || effectiveOption2Status === 'met' || option3Status === 'met'

  const statusColor = hasChecked ? (isEligible ? '#06a800' : '#d4183d') : '#999'

  const statusText = hasChecked
    ? isEligible
      ? "You're Eligible for Pre-Sale2."
      : "You're not Eligible Yet!"
    : null

  const optionBaseStyles: Record<OptionStatus, string> = {
    met: 'bg-[#06a80008] dark:bg-[#06a80010] border-[#06a80020] dark:border-[#06a80030]',
    unmet: 'bg-[#d4183d08] dark:bg-[#d4183d10] border-[#d4183d20] dark:border-[#d4183d30]',
    pending:
      'bg-[#f5f5f5] dark:bg-[#ffffff05] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]',
  }

  const testOption1Pass = () => {
    setMockOverride({
      option1: { status: 'pass', volumeUsd: 2500 },
      option2: 'unmet',
      option3: {
        volume: { status: 'fail', volumeUsd: 2500 },
        twitter: { status: 'fail', handle: null },
        post: { status: 'fail' },
      },
    })
  }
  const testOption1Fail = () => {
    setMockOverride({
      option1: { status: 'fail', volumeUsd: 200 },
      option2: 'unmet',
      option3: {
        volume: { status: 'fail', volumeUsd: 200 },
        twitter: { status: 'fail', handle: null },
        post: { status: 'fail' },
      },
    })
  }
  const testAllPass = () => {
    setMockOverride({
      option1: { status: 'pass', volumeUsd: 6000 },
      option2: 'met',
      option3: {
        volume: { status: 'pass', volumeUsd: 6000 },
        twitter: { status: 'pass', handle: 'CryptonianXY' },
        post: { status: 'pass' },
      },
    })
  }
  const testAllFail = () => {
    setMockOverride({
      option1: { status: 'fail', volumeUsd: 0 },
      option2: 'unmet',
      option3: {
        volume: { status: 'fail', volumeUsd: 0 },
        twitter: { status: 'fail', handle: null },
        post: { status: 'fail' },
      },
    })
  }
  const testXConnected = () => {
    setMockOverride({
      option1: { status: 'fail', volumeUsd: 200 },
      option2: 'unmet',
      option3: {
        volume: { status: 'pass', volumeUsd: 6000 },
        twitter: { status: 'pass', handle: 'CryptonianXY' },
        post: { status: 'fail' },
      },
    })
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={testOption1Pass}
          className="px-3 py-1.5 rounded-md bg-[#06a800] text-white text-[12px] font-medium hover:bg-[#058700] transition-colors"
        >
          Test Option1 Pass
        </button>
        <button
          onClick={testOption1Fail}
          className="px-3 py-1.5 rounded-md bg-[#d4183d] text-white text-[12px] font-medium hover:bg-[#b81535] transition-colors"
        >
          Test Option1 Fail
        </button>
        <button
          onClick={testAllPass}
          className="px-3 py-1.5 rounded-md bg-[#06a800] text-white text-[12px] font-medium hover:bg-[#058700] transition-colors"
        >
          Test All Pass
        </button>
        <button
          onClick={testAllFail}
          className="px-3 py-1.5 rounded-md bg-[#d4183d] text-white text-[12px] font-medium hover:bg-[#b81535] transition-colors"
        >
          Test All Fail
        </button>
        <button
          onClick={testXConnected}
          className="px-3 py-1.5 rounded-md bg-[#0ea5e9] text-white text-[12px] font-medium hover:bg-[#0284c7] transition-colors"
        >
          Test X connected
        </button>
      </div>

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

              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning || isAuthenticating}
                className="w-full py-3.5 rounded-[10px] font-bold text-[16px] bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning || isAuthenticating ? <Loader2 className="size-4 animate-spin" /> : null}
                {isAuthenticating
                  ? 'Signing in…'
                  : isRunning
                    ? 'Checking…'
                    : hasChecked
                      ? 'Re-verify Status'
                      : 'Verify Status'}
              </button>
            </div>
          </div>

          <div className="p-6 rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-5 text-[#06a800]" />
                <h3 className="font-semibold text-[16px] text-black dark:text-[#d2d2d2]">
                  Why do I need to be eligible?
                </h3>
              </div>
              <p className="font-normal text-[14px] leading-relaxed text-[#666] dark:text-[#999]">
                Pre-Sale 2 is reserved for early supporters of {tokenDisplayName}. Meeting any one
                of the qualification options below unlocks allocation access before the public
                auction opens.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 p-[30px] rounded-[16px] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] bg-white dark:bg-[#1a1a1b] shadow-sm flex flex-col gap-5">
          <h3 className="font-semibold text-[20px] text-black dark:text-[#d2d2d2]">
            Qualification Options
          </h3>

          <div className={`rounded-[10px] border transition-all ${optionBaseStyles[option1Status]}`}>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#666] dark:text-[#999] mt-1">
                  Option 1
                </span>
              </div>
              <CriterionRow
                title={`Trade ${USD_FORMATTER.format(OPTION1_VOLUME_THRESHOLD_USD)}+ of ${tokenDisplayName} before April 27 snapshot`}
                description="Your pre-snapshot trading volume on Tessera determines qualification."
                status={effectiveOption1.status}
                additionalInfo={
                  effectiveOption1.status === 'pass' || effectiveOption1.status === 'fail' ? (
                    <>Current volume: {USD_FORMATTER.format(effectiveOption1.volumeUsd)}</>
                  ) : null
                }
              />
            </div>
          </div>

          <div className={`rounded-[10px] border transition-all ${optionBaseStyles[effectiveOption2Status]}`}>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#666] dark:text-[#999] mt-1">
                  Option 2
                </span>
              </div>
              <CriterionRow
                title="Connect to Tessera using a Solana mobile device"
                description="Sign in from a Solana Seeker or Saga handset to qualify automatically."
                status={effectiveOption2Status === 'met' ? 'pass' : effectiveOption2Status === 'unmet' ? 'fail' : 'idle'}
              />
            </div>
          </div>

          <div className={`flex flex-col rounded-[10px] border transition-all ${optionBaseStyles[option3Status]}`}>
            <div className="p-5 pb-3 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666] dark:text-[#999]">
                  Option 3
                </span>
                <h4 className="font-semibold text-[16px] text-black dark:text-[#d2d2d2]">
                  Complete all of the following
                </h4>
              </div>
              <ChevronDown className="size-5 text-[#666] dark:text-[#999]" />
            </div>
            <div className="p-5 pt-0 flex flex-col gap-3">
              <CriterionRow
                title="Trading volume"
                description={`Your lifetime trading volume must be at least ${USD_FORMATTER.format(VOLUME_THRESHOLD_USD)}. Volume from linked child wallets is included.`}
                status={effectiveVolume.status}
                additionalInfo={
                  effectiveVolume.status === 'pass' || effectiveVolume.status === 'fail' ? (
                    <>
                      Current volume: {USD_FORMATTER.format(effectiveVolume.volumeUsd ?? 0)}
                      {!mockOverride && volume.linkedWalletCount > 0
                        ? ` (across ${volume.linkedWalletCount + 1} wallets)`
                        : null}
                    </>
                  ) : !mockOverride && volume.status === 'error' ? (
                    <span className="text-red-600">{volume.error}</span>
                  ) : null
                }
                action={
                  !mockOverride && volume.status === 'fail' ? (
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
                status={effectiveTwitter.status}
                additionalInfo={
                  twitterLinked && effectiveTwitterHandle ? (
                    <>Connected as @{effectiveTwitterHandle}</>
                  ) : null
                }
                action={
                  !mockOverride && !twitter ? (
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
                title={effectivePost.status === 'pass' ? 'Social card posted' : 'Post social card'}
                description="Post a Tessera social card from your X account."
                status={effectivePost.status}
                additionalInfo={
                  !mockOverride && post.status === 'pass' && post.tweetUrl ? (
                    <a
                      href={post.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#06a800] underline"
                    >
                      View your post
                    </a>
                  ) : !mockOverride && post.status === 'error' ? (
                    <span className="text-red-600">{post.error}</span>
                  ) : !twitterLinked ? (
                    <>Connect X first.</>
                  ) : null
                }
                action={
                  !mockOverride && post.status === 'fail' && twitter && isSocialCardTokenId(tokenId) ? (
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
