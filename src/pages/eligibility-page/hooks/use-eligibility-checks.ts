import { useCallback, useState } from 'react'
import { fetchSocialPost, fetchTradingVolume } from '../api'

export const VOLUME_THRESHOLD_USD = 5000

export type CheckStatus = 'idle' | 'checking' | 'pass' | 'fail' | 'error'

export type VolumeState = {
  status: CheckStatus
  volumeUsd: number | null
  linkedWalletCount: number
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
}

export function useEligibilityChecks() {
  const [volume, setVolume] = useState<VolumeState>({ status: 'idle', volumeUsd: null, linkedWalletCount: 0, error: null })
  const [twitter, setTwitter] = useState<TwitterState>({ status: 'idle', handle: null })
  const [post, setPost] = useState<PostState>({ status: 'idle', tweetUrl: null, error: null })
  const [isRunning, setIsRunning] = useState(false)

  const run = useCallback(async ({ wallet, twitterHandle }: RunArgs) => {
    setIsRunning(true)
    setVolume({ status: 'checking', volumeUsd: null, linkedWalletCount: 0, error: null })
    setTwitter({
      status: twitterHandle ? 'pass' : 'fail',
      handle: twitterHandle,
    })
    setPost(twitterHandle
      ? { status: 'checking', tweetUrl: null, error: null }
      : { status: 'idle', tweetUrl: null, error: null })

    const volumePromise = fetchTradingVolume(wallet)
      .then((res) => {
        setVolume({
          status: res.volumeUsd >= VOLUME_THRESHOLD_USD ? 'pass' : 'fail',
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

    const postPromise = twitterHandle
      ? fetchSocialPost(twitterHandle)
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
              error: err instanceof Error ? err.message : 'Failed to check social post',
            })
          })
      : Promise.resolve()

    await Promise.allSettled([volumePromise, postPromise])
    setIsRunning(false)
  }, [])

  return { volume, twitter, post, isRunning, run }
}
