import { useCallback, useState } from 'react'
import {
  fetchSnapshotVolume,
  fetchSocialPost,
  fetchSolanaMobileEligibility,
  fetchTradingVolume,
  LIFETIME_VOLUME_THRESHOLD_USD,
  SNAPSHOT_VOLUME_THRESHOLD_USD,
  SocialPostError,
  type WhitelistApplication,
} from '../api'

export {
  LIFETIME_VOLUME_THRESHOLD_USD,
  SNAPSHOT_VOLUME_THRESHOLD_USD,
  PRESALE_SNAPSHOT_DATE,
} from '../api'

// Legacy export kept for any callers still importing the old name.
export const VOLUME_THRESHOLD_USD = LIFETIME_VOLUME_THRESHOLD_USD

export type CheckStatus = 'idle' | 'checking' | 'pass' | 'fail' | 'error'

export type VolumeState = {
  status: CheckStatus
  volumeUsd: number | null
  linkedWalletCount: number
  error: string | null
}

export type SnapshotState = {
  status: CheckStatus
  volumeUsd: number | null
  error: string | null
}

export type SolanaMobileState = {
  status: CheckStatus
  error: string | null
}

export type TwitterState = {
  status: CheckStatus
  handle: string | null
}

export type PostState = {
  status: CheckStatus
  tweetUrl: string | null
  error: string | null
}

type RunArgs = {
  wallet: string
  twitterHandle: string | null
  tokenId: string | null
  checkSocialPost: boolean
}

const IDLE_VOLUME: VolumeState = {
  status: 'idle',
  volumeUsd: null,
  linkedWalletCount: 0,
  error: null,
}
const IDLE_SNAPSHOT: SnapshotState = { status: 'idle', volumeUsd: null, error: null }
const IDLE_SOLANA: SolanaMobileState = { status: 'idle', error: null }
const IDLE_TWITTER: TwitterState = { status: 'idle', handle: null }
const IDLE_POST: PostState = { status: 'idle', tweetUrl: null, error: null }

export function useEligibilityChecks() {
  const [volume, setVolume] = useState<VolumeState>(IDLE_VOLUME)
  const [snapshot, setSnapshot] = useState<SnapshotState>(IDLE_SNAPSHOT)
  const [solana, setSolana] = useState<SolanaMobileState>(IDLE_SOLANA)
  const [twitter, setTwitter] = useState<TwitterState>(IDLE_TWITTER)
  const [post, setPost] = useState<PostState>(IDLE_POST)
  const [isRunning, setIsRunning] = useState(false)

  const run = useCallback(async ({ wallet, twitterHandle, tokenId, checkSocialPost }: RunArgs) => {
    setIsRunning(true)
    setVolume({ ...IDLE_VOLUME, status: 'checking' })
    setSnapshot({ ...IDLE_SNAPSHOT, status: 'checking' })
    setSolana({ ...IDLE_SOLANA, status: 'checking' })
    setTwitter({ status: twitterHandle ? 'pass' : 'fail', handle: twitterHandle })
    setPost(
      checkSocialPost && twitterHandle && tokenId
        ? { ...IDLE_POST, status: 'checking' }
        : IDLE_POST,
    )

    const volumePromise = fetchTradingVolume(wallet)
      .then((res) => {
        setVolume({
          status: res.volumeUsd >= LIFETIME_VOLUME_THRESHOLD_USD ? 'pass' : 'fail',
          volumeUsd: res.volumeUsd,
          linkedWalletCount: res.linkedWalletCount ?? 0,
          error: null,
        })
      })
      .catch((err: unknown) => {
        setVolume({
          status: 'error',
          volumeUsd: null,
          linkedWalletCount: 0,
          error: err instanceof Error ? err.message : 'Failed to check trading volume',
        })
      })

    const snapshotPromise = fetchSnapshotVolume(wallet)
      .then((res) => {
        setSnapshot({
          status: res.volumeUsd >= SNAPSHOT_VOLUME_THRESHOLD_USD ? 'pass' : 'fail',
          volumeUsd: res.volumeUsd,
          error: null,
        })
      })
      .catch((err: unknown) => {
        setSnapshot({
          status: 'error',
          volumeUsd: null,
          error: err instanceof Error ? err.message : 'Failed to check snapshot volume',
        })
      })

    const solanaPromise = fetchSolanaMobileEligibility(wallet)
      .then((res) => setSolana({ status: res === 'met' ? 'pass' : 'fail', error: null }))
      .catch((err: unknown) => {
        setSolana({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to check Solana Mobile',
        })
      })

    const postPromise =
      checkSocialPost && twitterHandle && tokenId
        ? fetchSocialPost(tokenId)
            .then((res) => {
              setPost({
                status: res.hasPosted ? 'pass' : 'fail',
                tweetUrl: res.tweetUrl,
                error: null,
              })
            })
            .catch((err: unknown) => {
              setPost({
                status: 'error',
                tweetUrl: null,
                error:
                  err instanceof SocialPostError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : 'Failed to check social post',
              })
            })
        : Promise.resolve()

    await Promise.allSettled([volumePromise, snapshotPromise, solanaPromise, postPromise])
    setIsRunning(false)
  }, [])

  // Populate state from a previously persisted whitelist application so the
  // qualification panel reflects stored eligibility on mount, without the
  // user having to re-run the checks.
  const hydrate = useCallback((app: WhitelistApplication) => {
    if (app.tradingVolumeUsd != null) {
      setVolume({
        status: app.tradingVolumeUsd >= LIFETIME_VOLUME_THRESHOLD_USD ? 'pass' : 'fail',
        volumeUsd: app.tradingVolumeUsd,
        linkedWalletCount: 0,
        error: null,
      })
    }
    if (app.snapshotVolumeUsd != null) {
      setSnapshot({
        status: app.snapshotVolumeUsd >= SNAPSHOT_VOLUME_THRESHOLD_USD ? 'pass' : 'fail',
        volumeUsd: app.snapshotVolumeUsd,
        error: null,
      })
    }
    if (app.solanaMobileEligible != null) {
      setSolana({
        status: app.solanaMobileEligible ? 'pass' : 'fail',
        error: null,
      })
    }
    setTwitter({
      status: app.twitterConnected ? 'pass' : 'fail',
      handle: app.twitterHandle ?? null,
    })
    if (app.socialPostFound) {
      setPost({
        status: 'pass',
        tweetUrl: app.socialPostTweetUrl ?? null,
        error: null,
      })
    }
  }, [])

  return { volume, snapshot, solana, twitter, post, isRunning, run, hydrate }
}
