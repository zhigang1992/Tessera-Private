import {
  fetchAuctionTotalRaised,
  fetchAuctionDepositEvents,
} from '@/features/referral/lib/graphql-client'
import { BigNumber, fromHasuraToNative } from '@/lib/bignumber'
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

  const targetRaise = parseFloat(vaultInfo.maxCap) / 10 ** client.config.quoteDecimals

  let totalRaised = parseFloat(vaultInfo.totalDeposited) / 10 ** client.config.quoteDecimals
  if (totalRaisedData) {
    totalRaised = BigNumber.toNumber(fromHasuraToNative(totalRaisedData.total_raised_amount))
  }

  const oversubscribedRatio = targetRaise > 0 ? totalRaised / targetRaise : 0

  return {
    totalRaised,
    targetRaise,
    oversubscribedRatio,
  }
}

export async function getAuctionChartData(tokenId: AppTokenId = DEFAULT_BASE_TOKEN_ID): Promise<AuctionChartData> {
  const { poolAddress } = requireAuctionConfig(tokenId)
  const events = await fetchAuctionDepositEvents(poolAddress)

  if (events.length === 0) {
    return []
  }

  const sortedEvents = [...events].sort((a, b) => a.block_time - b.block_time)
  const startTime = sortedEvents[0].block_time

  let cumulativeTotal = BigNumber.from(0)
  const chartPoints: AuctionChartDataPoint[] = []

  for (const event of sortedEvents) {
    const amount = fromHasuraToNative(event.amount)
    cumulativeTotal = BigNumber.add(cumulativeTotal, amount)

    const hoursSinceStart = (event.block_time - startTime) / 3600

    chartPoints.push({
      hour: hoursSinceStart,
      value: BigNumber.toNumber(cumulativeTotal),
    })
  }

  return chartPoints
}
