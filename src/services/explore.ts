import spacexBg from '@/assets/spacex-bg.jpeg'
import kalshiBg from '@/assets/kalshi-bg.jpeg'
import { type AppTokenId, APP_TOKENS } from '@/config'

// ============ Types ============

export type AssetStatus = 'trading' | 'auction' | 'whitelisting' | 'coming_soon'

export interface ExploreAssetMetadata {
  fullName?: string
  location?: string
  founded?: string
  industry?: string
  twitterUrl?: string
  meteoraUrl?: string
  transparencyUrl?: string
}

export interface ExploreAsset {
  id: string
  name: string
  ticker: string
  category: string
  headerColor: string
  headerImage?: string
  price?: number
  valuation?: string
  status: AssetStatus
  appTokenId?: AppTokenId
  metadata?: ExploreAssetMetadata
}

// ============ Mock Data ============

const exploreAssets: ExploreAsset[] = [
  {
    id: 'spacex',
    name: 'SpaceX',
    ticker: 'T-SpaceX',
    category: 'Aerospace',
    headerColor: '#555555',
    headerImage: spacexBg,
    price: 423,
    valuation: '$800B',
    status: 'trading',
    appTokenId: 'T-SpaceX',
    metadata: {
      fullName: 'SpaceX Tech Corp',
      location: 'Hawthorne, CA',
      founded: 'Founded 2002',
      industry: 'Aerospace',
      twitterUrl: 'https://x.com/SpaceX',
      meteoraUrl: `https://app.meteora.ag/dlmm/${APP_TOKENS['T-SpaceX'].dlmmPool?.address}`,
      transparencyUrl: '/dashboard?tab=transparency',
    },
  },
  {
    id: 'kalshi',
    name: 'Kalshi',
    ticker: 'T-Kalshi',
    category: 'Prediction Markets',
    headerColor: '#1a3a2e',
    headerImage: kalshiBg,
    price: 360,
    valuation: '$12B',
    status: 'auction',
    appTokenId: 'T-Kalshi',
    metadata: {
      fullName: 'Kalshi Inc',
      location: 'New York, NY',
      founded: 'Founded 2018',
      industry: 'Prediction Markets',
      twitterUrl: 'https://x.com/Kalshi',
      meteoraUrl: `https://app.meteora.ag/dlmm/${APP_TOKENS['T-Kalshi'].dlmmPool?.address}`,
    },
  },
]

// ============ API Functions ============

export async function getExploreAssets(): Promise<ExploreAsset[]> {
  return exploreAssets
}

export async function getExploreAssetById(id: string): Promise<ExploreAsset | undefined> {
  return exploreAssets.find((asset) => asset.id === id)
}
