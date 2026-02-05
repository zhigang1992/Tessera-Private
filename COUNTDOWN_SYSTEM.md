# Countdown System Documentation

## Overview

The Tessera webapp now includes a flexible, smart countdown system that can be used for both trading start times and auction deposit windows. The system supports both **slot-based** (block number) and **timestamp-based** countdowns with adaptive refresh rates.

## Architecture

### 1. Global Slot Tracking (`src/contexts/slot-context.tsx`)

A React context that provides global access to the current Solana slot and timestamp:

```typescript
const { currentSlot, currentTime, refreshSlot } = useSlot()
```

- **Purpose**: Shared state for slot/time across all components
- **Polling**: Refreshes every 30 seconds by default
- **Usage**: Wrap your app with `<SlotProvider>` (already done in `app-providers.tsx`)

### 2. Countdown Configuration Types (`src/types/countdown.ts`)

Three configuration types are supported:

```typescript
type CountdownConfig =
  | { type: 'slot'; targetSlot: number }        // Block-based countdown
  | { type: 'timestamp'; targetTimestamp: number }  // Timestamp-based countdown
  | { type: 'disabled' }                        // No countdown (immediate start)
```

### 3. Smart Countdown Hook (`src/hooks/use-countdown.ts`)

The core hook that manages countdown logic with adaptive refresh rates:

```typescript
const { timeRemaining, showSeconds, isDisabled } = useCountdown(config)
```

#### Adaptive Refresh Strategy

The hook automatically adjusts refresh frequency based on proximity:

| Time Remaining | API Refresh | Component Re-render | Show Seconds |
|---------------|-------------|---------------------|--------------|
| > 3 weeks | Never | Every minute | No |
| > 1 hour | Every 10 minutes | Every minute | No |
| > 5 minutes | Every minute | Every minute | No |
| ≤ 5 minutes | Every 10 seconds | Every second | Yes |

**Key Features:**
- **Slot-based**: Estimates timestamp from slot number using ~400ms average slot time
- **Timestamp-based**: Uses local time calculation (no API calls needed)
- **Smart refreshing**: API refresh frequency adapts to proximity
- **Smooth display**: Component re-renders independently of API refresh

### 4. Countdown Notification Component (`src/components/countdown-notification.tsx`)

Reusable UI component that displays countdown notifications:

```typescript
<CountdownNotification
  config={countdownConfig}
  title="T-SpaceX trading pool"
/>
```

- **Styling**: Matches Tessera_makeversion design (semi-transparent white box)
- **Auto-hide**: Only shows when countdown is active (not expired)
- **Format**: Displays as "2d 5h 30m" or "2d 5h 30m 15s" when close

## Implementation

### Trading Pool Countdown

**Configuration** (`src/config.ts`):

```typescript
export const POOL_TRADING_CONFIG = {
  'T-SpaceX-USDC': {
    enabled: true,
    countdown: { type: 'disabled' }, // Change to enable countdown
  },
}
```

**Example configurations:**

```typescript
// Slot-based (recommended for on-chain events)
countdown: { type: 'slot', targetSlot: 500000000 }

// Timestamp-based (for specific times)
countdown: { type: 'timestamp', targetTimestamp: 1738800000000 } // ms

// Disabled (immediate trading)
countdown: { type: 'disabled' }
```

**Usage in Trade Page** (`src/pages/trade-page/components/token-swap-panel.tsx`):

```typescript
const countdownConfig = getPoolCountdownConfig('T-SpaceX-USDC')
const { timeRemaining } = useCountdown(countdownConfig)
const isTradingActive = timeRemaining.isExpired

// Show countdown notification
{!isTradingActive && (
  <CountdownNotification config={countdownConfig} title="T-SpaceX trading pool" />
)}

// Disable swap button
const isDisabled = !isTradingActive || ...
```

### Auction Deposit Countdown

**No configuration needed!** The auction deposit countdown automatically uses data from the Meteora Alpha Vault SDK.

The vault data includes:
- `depositOpenSlot` - When deposits open (slot number)
- `depositCloseSlot` - When deposits close (slot number)
- `depositOpenTime` - Estimated timestamp (derived from slot)
- `depositCloseTime` - Estimated timestamp (derived from slot)

**Usage in Auction Page** (`src/pages/auction-page/components/auction/deposit-usdc-card.tsx`):

```typescript
// Countdown config is derived from vault data
const countdownConfig: CountdownConfig = useMemo(() => {
  if (!vaultInfo) {
    return { type: 'disabled' }
  }
  // Use slot-based countdown from vault's depositOpenSlot
  return { type: 'slot', targetSlot: vaultInfo.depositOpenSlot }
}, [vaultInfo])

const { timeRemaining } = useCountdown(countdownConfig)
const isDepositActive = timeRemaining.isExpired

// Show countdown notification
{!isDepositActive && (
  <CountdownNotification
    config={countdownConfig}
    title={`${token.displayName} deposit window`}
  />
)}

// Update deposit permission
const canDeposit = isDepositActive && depositQuota?.canDeposit && ...
```

**Key points:**
- Auction countdown is **automatically synced** with on-chain vault state
- No manual configuration required
- Uses slot-based countdown for accuracy
- Vault state is fetched from Meteora SDK on page load

## Helper Functions

### `getPoolCountdownConfig(poolId: TradingPoolId)`

Returns the countdown configuration for a trading pool.

```typescript
const config = getPoolCountdownConfig('T-SpaceX-USDC')
```

### `formatTimeRemaining(timeRemaining: TimeRemaining, showSeconds: boolean)`

Formats time remaining as a string.

```typescript
const formatted = formatTimeRemaining(timeRemaining, true)
// Returns: "2d 5h 30m 15s" or "2d 5h 30m"
```

## Examples

### Example 1: Enable Trading in 2 Days (Slot-Based)

```typescript
// 1. Get current slot (from Solana RPC)
const currentSlot = await connection.getSlot()
// currentSlot = 300000000

// 2. Calculate target slot (2 days = 172,800 seconds = 432,000 slots at 400ms/slot)
const targetSlot = currentSlot + 432000

// 3. Update config
export const POOL_TRADING_CONFIG = {
  'T-SpaceX-USDC': {
    enabled: true,
    countdown: { type: 'slot', targetSlot: 300432000 },
  },
}
```

### Example 2: Enable Trading at Specific Time (Timestamp-Based)

```typescript
// 1. Set target date
const targetDate = new Date('2026-02-10T15:00:00Z')
const targetTimestamp = targetDate.getTime()

// 2. Update config
export const POOL_TRADING_CONFIG = {
  'T-SpaceX-USDC': {
    enabled: true,
    countdown: { type: 'timestamp', targetTimestamp: 1738851600000 },
  },
}
```

### Example 3: Disable Trading Countdown (Immediate Start)

```typescript
// Trading starts immediately
countdown: { type: 'disabled' }
```

**Note:** Auction deposits automatically use vault data from Meteora SDK - no configuration needed!

## Technical Details

### Slot Time Estimation

- **Average slot time**: 400ms (based on Solana's performance)
- **Formula**: `estimatedMs = (targetSlot - currentSlot) * 400`
- **Note**: This is an estimation; actual slot times can vary

### Performance Optimizations

1. **Shared Slot Context**: Single global slot polling prevents duplicate API calls
2. **Adaptive API Refresh**: Reduces unnecessary calls when countdown is far away
3. **Separate Render Cycle**: Component updates independently for smooth countdown display
4. **Automatic Cleanup**: Timers are properly cleaned up when components unmount

### Browser Compatibility

- Uses standard JavaScript `setInterval` and `Date` APIs
- Works in all modern browsers
- Mobile-friendly with touch support

## Troubleshooting

### Countdown not showing

- Check that countdown config is not `{ type: 'disabled' }`
- Verify target slot/timestamp is in the future
- Ensure `SlotProvider` is wrapping your app

### Countdown jumps or freezes

- Check browser console for errors in slot fetching
- Verify Solana RPC connection is working
- Check that `SLOT_POLL_INTERVAL` in slot-context.tsx is reasonable (default: 30s)

### Incorrect time estimation (slot-based)

- Slot time can vary; use timestamp-based for precise timing
- Consider network congestion during high-traffic periods

## Future Enhancements

Potential improvements for the countdown system:

1. **Dynamic slot time calculation**: Use recent slot history for better estimates
2. **Countdown events**: Emit events when countdown reaches specific thresholds
3. **Persistent state**: Remember last known slot to improve initial estimates
4. **WebSocket support**: Real-time slot updates via WebSocket connection
5. **Timezone support**: Display countdowns in user's local timezone

## Migration Guide

### Updating existing code to use countdowns

If you have existing trading or auction features, here's how to add countdown support:

1. **Add countdown config** to your token/pool configuration
2. **Import countdown hook** in your component
3. **Add isActive check** to your can-trade/can-deposit logic
4. **Insert CountdownNotification** component in your JSX
5. **Update button text** to reflect countdown state

See the Trade and Auction page implementations for complete examples.
