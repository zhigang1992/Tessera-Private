import spacexBg from '@/assets/spacex-bg.jpeg'
import kalshiBg from '@/assets/kalshi-bg.jpeg'

// ============ Types ============

export type AssetStatus = 'trading' | 'auction' | 'whitelisting' | 'coming_soon'

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
    valuation: '$800bn',
    status: 'auction',
  },
  {
    id: 'kalshi',
    name: 'Kalshi',
    ticker: 'T-Kalshi',
    category: 'Prediction Markets',
    headerColor: '#1a3a2e',
    headerImage: kalshiBg,
    status: 'coming_soon',
  },
]

// ============ API Functions ============

export async function getExploreAssets(): Promise<ExploreAsset[]> {
  return exploreAssets
}

export async function getExploreAssetById(id: string): Promise<ExploreAsset | undefined> {
  return exploreAssets.find((asset) => asset.id === id)
}
