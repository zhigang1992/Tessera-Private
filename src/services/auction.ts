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

  let cumulativeTotal = BigNumber.from(0)
  const chartPoints: AuctionChartDataPoint[] = []

  for (const event of sortedEvents) {
    const amount = fromHasuraToNative(event.amount)
    cumulativeTotal = math`${cumulativeTotal} + ${amount}`

    const hoursSinceStart = (event.block_time - startTime) / 3600

    chartPoints.push({
      hour: hoursSinceStart,
      value: BigNumber.toNumber(cumulativeTotal),
    })
  }

  return { data: chartPoints, startTime }
}
