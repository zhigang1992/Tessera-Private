# Token Info Display Design

**Date**: 2026-02-05
**Issue**: REI-45 - Dashboard showing incorrect mock data + Add token info display
**Status**: Approved for Implementation

## Overview

Add dynamic token information display below the assets table on the Dashboard Market Data tab. When users select an asset in the table, the AboutPanel and StatisticsPanel below will show detailed information for that token.

## Architecture

### State Management

**DashboardPage** manages the selected token:
- State: `selectedTokenId: AppTokenId | null` (defaults to `'T-SpaceX'`)
- Passes down to AssetsTable and AboutPanel via props
- Uses strong type `AppTokenId` from config.ts

### Data Flow

1. User clicks asset row in AssetsTable
2. AssetsTable maps `asset.id` (string slug) → `AppTokenId` using `resolveTokenIdFromParam()`
3. Calls `onSelectToken(tokenId)` callback
4. DashboardPage updates `selectedTokenId` state
5. AboutPanel receives `tokenId` prop and displays corresponding metadata
6. AboutPanel fetches dynamic data (price, onchain address) via `getDashboardTokenInfo()`

### Component Architecture

```
DashboardPage
├── AssetsTable (receives: selectedTokenId, onSelectToken)
│   └── Maps asset.id → AppTokenId on click
├── DashboardPriceChart
└── AboutPanel (receives: tokenId)
    ├── Static metadata from TOKEN_METADATA object
    └── Dynamic data from getDashboardTokenInfo() query
```

## Implementation Details

### 1. DashboardPage Changes

**File**: `/src/pages/dashboard-page/index.tsx`

```typescript
import { AppTokenId, DEFAULT_BASE_TOKEN_ID } from '@/config'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('market-data')
  const [selectedTokenId, setSelectedTokenId] = useState<AppTokenId>(DEFAULT_BASE_TOKEN_ID)

  // Pass selectedTokenId and callback to children
  <AssetsTable
    selectedTokenId={selectedTokenId}
    onSelectToken={setSelectedTokenId}
  />

  {selectedTokenId && (
    <>
      <AboutPanel tokenId={selectedTokenId} />
      <StatisticsPanel tokenId={selectedTokenId} />
    </>
  )}
}
```

### 2. AssetsTable Changes

**File**: `/src/pages/dashboard-page/components/assets-table.tsx`

Add mapping function and update props:

```typescript
import { AppTokenId, DEFAULT_BASE_TOKEN_ID, resolveTokenIdFromParam } from '@/config'

interface AssetsTableProps {
  selectedTokenId: AppTokenId
  onSelectToken: (tokenId: AppTokenId) => void
}

export function AssetsTable({ selectedTokenId, onSelectToken }: AssetsTableProps) {
  const handleAssetClick = (assetId: string) => {
    const tokenId = resolveTokenIdFromParam(assetId) ?? DEFAULT_BASE_TOKEN_ID
    onSelectToken(tokenId)
  }

  // Update onClick handler
  onClick={() => handleAssetClick(asset.id)}

  // Update comparison for highlighting
  selectedTokenId === resolveTokenIdFromParam(asset.id)
}
```

### 3. AboutPanel Changes

**File**: `/src/pages/dashboard-page/components/about-panel.tsx`

Add metadata object and update component:

```typescript
import { AppTokenId, DEFAULT_BASE_TOKEN_ID } from '@/config'

interface TokenMetadata {
  description: string
  categories: string[]
  underlyingAssetName: string
  underlyingAssetCompany: string
  sharesPerToken: string
}

const TOKEN_METADATA: Record<AppTokenId, TokenMetadata> = {
  'T-SpaceX': {
    description: 'T-SpaceX is a synthetic asset engineered to track the valuation of SpaceX equity in private secondary markets.',
    categories: ['Private Markets', 'Pre-IPO'],
    underlyingAssetName: 'SpaceX Equity',
    underlyingAssetCompany: 'SpaceX',
    sharesPerToken: '1:1000'
  },
  'USDC': {
    description: 'USD Coin is a fully reserved digital dollar.',
    categories: ['Stablecoin'],
    underlyingAssetName: 'US Dollar',
    underlyingAssetCompany: 'Circle',
    sharesPerToken: 'N/A'
  }
}

interface AboutPanelProps {
  tokenId?: AppTokenId
}

export function AboutPanel({ tokenId = DEFAULT_BASE_TOKEN_ID }: AboutPanelProps) {
  const metadata = TOKEN_METADATA[tokenId]

  // Keep existing query for dynamic data
  const { data: tokenInfo } = useQuery({
    queryKey: ['dashboardTokenInfo', tokenId],
    queryFn: () => getDashboardTokenInfo(tokenId),
  })

  // Use metadata for static content
  const description = metadata.description
  const categories = metadata.categories
  // etc.
}
```

### 4. StatisticsPanel Changes

**File**: `/src/pages/dashboard-page/components/statistics-panel.tsx`

Similar pattern - accept `tokenId` prop and use it for queries/display.

## Error Handling

**Unknown asset IDs:**
- Fall back to `DEFAULT_BASE_TOKEN_ID` ('T-SpaceX')
- Log warning for debugging

**Empty assets table:**
- AboutPanel still renders with default T-SpaceX info
- User always sees meaningful content

**Missing metadata:**
- Gracefully handle with fallback values
- Show "—" for unavailable fields

## Testing

**Manual Test Cases:**
1. ✓ Load dashboard → T-SpaceX selected by default
2. ✓ AboutPanel shows T-SpaceX info below table
3. ✓ Click asset in table → AboutPanel updates
4. ✓ Empty table → AboutPanel shows T-SpaceX
5. ✓ Unknown asset → Falls back to T-SpaceX
6. ✓ Network switch → Onchain address updates

**Edge Cases:**
- Selection persists when switching tabs and back
- Highlighted row matches selected token
- Dynamic data refreshes correctly

## Files Modified

1. `/src/pages/dashboard-page/index.tsx` - State management
2. `/src/pages/dashboard-page/components/assets-table.tsx` - Asset selection
3. `/src/pages/dashboard-page/components/about-panel.tsx` - Token metadata display
4. `/src/pages/dashboard-page/components/statistics-panel.tsx` - Token statistics

## Benefits

- Clean separation of static and dynamic data
- Reuses existing token configuration from config.ts
- Type-safe with AppTokenId
- Maintainable metadata in component file
- Graceful fallbacks for edge cases
