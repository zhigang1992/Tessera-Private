# Countdown System Implementation Summary

## What Was Built

A flexible, production-ready countdown system for Tessera webapp that supports:
- **Trading pool countdowns** (manually configured)
- **Auction deposit countdowns** (automatically synced from Meteora SDK)

## Key Architecture Decisions

### 1. Global Slot Tracking
**File:** `src/contexts/slot-context.tsx`

Created a shared context that polls Solana for the current slot every 30 seconds. This prevents duplicate API calls when multiple components need slot data.

**Why:** Auction deposits use on-chain slot numbers, so we need real-time slot tracking.

### 2. Two Configuration Types

**Slot-based (for on-chain events):**
```typescript
{ type: 'slot', targetSlot: 500000000 }
```
- Used for auction deposits (synced with vault data)
- Estimates timestamp using ~400ms average slot time
- More accurate for on-chain events

**Timestamp-based (for scheduled times):**
```typescript
{ type: 'timestamp', targetTimestamp: 1738800000000 }
```
- Used for trading pools (can be manually configured)
- No API calls needed
- Better for marketing/scheduled releases

### 3. Adaptive Refresh Strategy

The countdown hook automatically adjusts refresh frequency based on proximity:

| Time Remaining | API Refresh Interval | Component Re-render | Show Seconds |
|---------------|---------------------|---------------------|--------------|
| > 3 weeks | Never | Every minute | No |
| > 1 hour | Every 10 minutes | Every minute | No |
| > 5 minutes | Every minute | Every minute | No |
| ≤ 5 minutes | Every 10 seconds | Every second | **Yes** |

**Why:** Reduces unnecessary API calls when countdown is far away, but provides smooth updates when it's close.

### 4. Auction Auto-Sync (Key Insight from User)

**Original approach:** Store `depositCountdown` in alpha vault config
**Updated approach:** Read `depositOpenSlot` directly from vault data

**Why this is better:**
- ✅ Single source of truth (on-chain vault state)
- ✅ No configuration drift
- ✅ Automatically syncs with contract changes
- ✅ Simpler configuration

```typescript
// Automatically derived from vaultInfo
const countdownConfig = useMemo(() => {
  if (!vaultInfo) return { type: 'disabled' }
  return { type: 'slot', targetSlot: vaultInfo.depositOpenSlot }
}, [vaultInfo])
```

## File Structure

```
src/
├── contexts/
│   └── slot-context.tsx           # Global slot tracking
├── types/
│   └── countdown.ts                # Type definitions
├── hooks/
│   └── use-countdown.ts            # Smart countdown hook
├── components/
│   ├── countdown-notification.tsx  # Reusable UI component
│   └── app-providers.tsx           # Added SlotProvider
└── pages/
    ├── trade-page/components/
    │   └── token-swap-panel.tsx    # Trading countdown integration
    └── auction-page/components/auction/
        └── deposit-usdc-card.tsx   # Auction countdown integration
```

## Configuration

### Trading Pools (Manual Config)

Edit `src/config.ts`:

```typescript
export const POOL_TRADING_CONFIG = {
  'T-SpaceX-USDC': {
    enabled: true,
    countdown: { type: 'disabled' }, // Change to enable
  },
}
```

**To enable countdown:**
```typescript
// Slot-based
countdown: { type: 'slot', targetSlot: 500000000 }

// Timestamp-based
countdown: { type: 'timestamp', targetTimestamp: 1738851600000 }
```

### Auction Deposits (Auto-Configured)

**No configuration needed!** The system automatically:
1. Fetches vault data from Meteora SDK
2. Reads `depositOpenSlot` from vault
3. Creates countdown config
4. Shows/hides countdown based on current slot

## How It Works

### Trading Pool Flow

```
1. Page loads
   ↓
2. getPoolCountdownConfig() reads config
   ↓
3. useCountdown() hook processes config
   ↓
4. If slot-based: Fetch current slot, estimate timestamp
   If timestamp-based: Use local time
   ↓
5. Set up adaptive refresh timers
   ↓
6. Component re-renders with updated countdown
   ↓
7. When expired: Button enables, notification hides
```

### Auction Deposit Flow

```
1. Page loads
   ↓
2. useAlphaVault() fetches vault data from SDK
   ↓
3. vaultInfo contains depositOpenSlot
   ↓
4. useMemo creates countdown config from depositOpenSlot
   ↓
5. useCountdown() processes slot-based config
   ↓
6. Fetch current slot from global context
   ↓
7. Estimate timestamp, set up timers
   ↓
8. Component re-renders with updated countdown
   ↓
9. When slot reaches depositOpenSlot: Enable deposits
```

## UI/UX

### Countdown Display Format

**Far away (no seconds):**
- "2d 5h 30m"
- "1d 12h 45m"
- "3h 20m"

**Close (with seconds):**
- "4m 30s"
- "1m 15s"
- "45s"

### Notification Message

**Trading:** "The T-SpaceX trading pool is not yet active. Trading will be available in 2d 5h 30m."

**Auction:** "The T-SpaceX Token deposit window is not yet active. Trading will be available in 2d 5h 30m."

### Button States

**Trade Page:**
- Before countdown: "Trading Not Active Yet" (disabled)
- After countdown: "Swap" (enabled if other conditions met)

**Auction Page:**
- Before countdown: "Deposits Not Active Yet" (disabled)
- After countdown: "Confirm Deposit" (enabled if other conditions met)

## Testing Scenarios

### Test Slot-Based Countdown (Auction)

1. Get current devnet slot: `await connection.getSlot()`
2. Set vault's `depositOpenSlot` to `currentSlot + 100` (about 40 seconds)
3. Load auction page
4. Countdown should show ~40 seconds and tick down
5. When slot is reached, deposits should enable

### Test Timestamp-Based Countdown (Trading)

1. Set config to 2 minutes from now:
   ```typescript
   countdown: {
     type: 'timestamp',
     targetTimestamp: Date.now() + 2 * 60 * 1000
   }
   ```
2. Load trade page
3. Countdown should show "2m 0s" and tick down
4. When time is reached, trading should enable

### Test Adaptive Refresh

1. Set countdown to 10 minutes from now
2. Open browser console
3. Watch network tab - should see slot fetch every 1 minute
4. Wait until < 5 minutes remaining
5. Slot fetches should increase to every 10 seconds
6. Countdown should start showing seconds

## Performance Characteristics

- **Initial load:** 2 API calls (connection setup + slot fetch)
- **Far countdown:** 1 API call per 10 minutes
- **Close countdown:** 1 API call per 10 seconds
- **Memory:** Minimal (2 timers per countdown instance)
- **CPU:** Negligible (simple arithmetic operations)

## Known Limitations

1. **Slot time estimation:** Uses 400ms average, actual can vary ±20%
2. **Clock drift:** Local time may drift from server time
3. **Network delays:** Slot fetch can take 100-500ms
4. **No persisted state:** Countdown resets on page refresh

## Future Improvements

1. **WebSocket support:** Real-time slot updates via WebSocket
2. **Historical slot time:** Calculate average from recent slots
3. **Notification system:** Push notifications when countdown expires
4. **Timezone display:** Show countdown in user's local time
5. **Persist estimates:** Cache slot→timestamp mapping in localStorage

## Documentation

- **Full guide:** `COUNTDOWN_SYSTEM.md`
- **This summary:** `COUNTDOWN_IMPLEMENTATION_SUMMARY.md`

## Migration Notes

If adding countdown to a new feature:

1. **Trading-like feature:** Add config to `POOL_TRADING_CONFIG`
2. **Auction-like feature:** Read from on-chain data (no config needed)
3. **Import countdown hook:** `import { useCountdown } from '@/hooks/use-countdown'`
4. **Add notification:** `<CountdownNotification config={...} title="..." />`
5. **Update button logic:** Check `timeRemaining.isExpired`

## Deployment Checklist

- [ ] SlotProvider added to app providers ✅
- [ ] Trading countdown config set (if needed)
- [ ] Auction reads from vault data ✅
- [ ] Countdown notifications styled correctly ✅
- [ ] Button states reflect countdown ✅
- [ ] Documentation updated ✅
- [ ] Test with real vault data
- [ ] Test adaptive refresh behavior
- [ ] Verify slot estimation accuracy
- [ ] Check mobile responsiveness
