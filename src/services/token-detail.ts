import {
  fetchTokenDetails,
  fetchTokenPriceChanges,
  fetchSwapEvents,
  fetchDashboardSummary,
} from '@/features/referral/lib/graphql-client'
import { fromHasuraToNative, BigNumber } from '@/lib/bignumber'
import {
  APP_TOKENS,
  getTokenMintAddress,
} from '@/config'
import { formatValuation, formatSupply } from './dashboard'
import { getExploreAssetById } from './explore'

// ============ Types ============

export interface TokenDetailData {
  price: number
  impliedValuation: string
  auctionPrice: number
  auctionValuation: string
  change30dPct: number | null
  premiumPct: number | null
  marketCap: number
  marketCapFormatted: string
  supply: string
  liquidity: string
  volume: number
  volumeFormatted: string
  holders: number
  txns: number
}

// ============ Helpers ============

function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`
  } else if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

// ============ API Functions ============

/**
 * Get all stats for the token detail page
 */
export async function getTokenDetailStats(assetId: string): Promise<TokenDetailData | null> {
  const asset = await getExploreAssetById(assetId)
  if (!asset?.appTokenId) return null

  const tokenId = asset.appTokenId
  const tokenConfig = APP_TOKENS[tokenId]
  const tokenMint = getTokenMintAddress(tokenId)
  const poolAddress = tokenConfig.dlmmPool?.address

  // Fetch data in parallel
  const [tokenDetails, priceChanges, swapData, dashboardSummary] = await Promise.all([
    fetchTokenDetails(tokenMint).catch(() => null),
    fetchTokenPriceChanges(tokenMint).catch(() => null),
    poolAddress ? fetchSwapEvents(0, 0, poolAddress).catch(() => ({ events: [], total: 0 })) : Promise.resolve({ events: [], total: 0 }),
    fetchDashboardSummary().catch(() => null),
  ])

  // Current price
  const price = tokenDetails?.price
    ? BigNumber.toNumber(fromHasuraToNative(tokenDetails.price))
    : 0

  // Implied valuation
  const impliedValuation = price > 0 ? formatValuation(tokenId, price) : '--'

  // Auction price from config
  const auctionPrice = tokenConfig.impliedValuation?.auctionPriceNumber ?? 0

  // Auction valuation from config
  const auctionValuation = tokenConfig.auctionValuation?.valuation ?? '--'

  // 30-day price change from pre-computed view
  const change30dPct = priceChanges?.price_change_pct_30d != null
    ? priceChanges.price_change_pct_30d * 100
    : null

  // Premium to auction price
  let premiumPct: number | null = null
  if (auctionPrice > 0 && price > 0) {
    premiumPct = ((price - auctionPrice) / auctionPrice) * 100
  }

  // Market cap
  const marketCap = tokenDetails?.market_cap
    ? BigNumber.toNumber(fromHasuraToNative(tokenDetails.market_cap))
    : 0

  // Supply
  const supplyValue = tokenDetails?.circulating_supply
    ? BigNumber.toNumber(fromHasuraToNative(tokenDetails.circulating_supply))
    : 0
  const supply = supplyValue > 0 ? formatSupply(supplyValue) : '--'

  // Volume from dashboard summary
  const volume = dashboardSummary?.total_trading_volume
    ? BigNumber.toNumber(fromHasuraToNative(dashboardSummary.total_trading_volume))
    : 0

  // Holders
  const holders = tokenDetails?.holder_count ? Number(tokenDetails.holder_count) : 0

  // Transaction count
  const txns = swapData.total

  return {
    price,
    impliedValuation,
    auctionPrice,
    auctionValuation,
    change30dPct,
    premiumPct,
    marketCap,
    marketCapFormatted: marketCap > 0 ? formatLargeNumber(marketCap) : '--',
    supply,
    liquidity: '--',
    volume,
    volumeFormatted: volume > 0 ? formatLargeNumber(volume) : '--',
    holders,
    txns,
  }
}
