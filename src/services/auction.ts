import {
  fetchAuctionTotalRaised,
  fetchAuctionDepositEvents,
} from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, fromTokenAmount } from '@/lib/bignumber'
import { BigNumber, math } from 'math-literal'
import { AppTokenId, DEFAULT_BASE_TOKEN_ID, getTokenAlphaVaultConfig } from '@/config'
import { getAlphaVaultClient } from './alpha-vault'

export interface AuctionProgress {
  totalRaised: number
  targetRaise: number
  oversubscribedRatio: number
}

export interface AuctionChartDataPoint {
  hour: number
  value: number
}

export interface AuctionChartDataWithStartTime {
  data: AuctionChartDataPoint[]
  startTime: number // Unix timestamp in seconds
}

export type AuctionChartData = AuctionChartDataPoint[]

function requireAuctionConfig(tokenId: AppTokenId) {
  const config = getTokenAlphaVaultConfig(tokenId)
  if (!config) {
    throw new Error(`Auction configuration not found for token ${tokenId}`)
  }
  const poolAddress = config.dlmmPool
  if (!poolAddress) {
    throw new Error(`Auction pool missing for token ${tokenId}`)
  }
  return { config, poolAddress }
}

export async function getAuctionProgress(tokenId: AppTokenId = DEFAULT_BASE_TOKEN_ID): Promise<AuctionProgress> {
  const { poolAddress } = requireAuctionConfig(tokenId)
  const client = getAlphaVaultClient(tokenId)

  const [vaultInfo, totalRaisedData] = await Promise.all([
    client.getVaultInfo(),
    fetchAuctionTotalRaised(poolAddress),
  ])

  const targetRaiseBN = fromTokenAmount(vaultInfo.maxCap, client.config.quoteDecimals)

  let totalRaisedBN = fromTokenAmount(vaultInfo.totalDeposited, client.config.quoteDecimals)
  if (totalRaisedData) {
    totalRaisedBN = fromHasuraToNative(totalRaisedData.total_raised_amount)
  }

  const targetRaise = BigNumber.toNumber(targetRaiseBN)
  const totalRaised = BigNumber.toNumber(totalRaisedBN)
  const oversubscribedRatio = targetRaise > 0
    ? BigNumber.toNumber(math`${totalRaisedBN} / ${targetRaiseBN}`)
    : 0

  return {
    totalRaised,
    targetRaise,
    oversubscribedRatio,
  }
}

export async function getAuctionChartData(tokenId: AppTokenId = DEFAULT_BASE_TOKEN_ID): Promise<AuctionChartDataWithStartTime> {
  const { poolAddress } = requireAuctionConfig(tokenId)
  const events = await fetchAuctionDepositEvents(poolAddress)

  if (events.length === 0) {
    return { data: [], startTime: 0 }
  }

  const sortedEvents = [...events].sort((a, b) => a.block_time - b.block_time)
  const startTime = sortedEvents[0].block_time

  // Bucket transactions by time intervals
  // Use 2-minute buckets to reduce data points while maintaining detail
  const BUCKET_SIZE_SECONDS = 2 * 60 // 2 minutes
  const bucketMap = new Map<number, BigNumber>()

  let cumulativeTotal = BigNumber.from(0)

  for (const event of sortedEvents) {
    const amount = fromHasuraToNative(event.amount)
    cumulativeTotal = math`${cumulativeTotal} + ${amount}`

    // Determine which bucket this event belongs to
    const timeSinceStart = event.block_time - startTime
    const bucketKey = Math.floor(timeSinceStart / BUCKET_SIZE_SECONDS)

    // Store the cumulative total at the end of each bucket
    bucketMap.set(bucketKey, cumulativeTotal)
  }

  // Convert buckets to chart points
  const chartPoints: AuctionChartDataPoint[] = Array.from(bucketMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucketKey, total]) => ({
      hour: (bucketKey * BUCKET_SIZE_SECONDS) / 3600,
      value: BigNumber.toNumber(total),
    }))

  return { data: chartPoints, startTime }
}
