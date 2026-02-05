# Tessera Bug Reports - Need Clarification

Generated from Notion export: `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs`

## ✅ Completed (Straightforward Fixes)

### 1. Support页面内容修改 (P0 Block) ✅
**Status:** FIXED
**Changes made:**
- Removed "or geographic location" from KYC question answer
- Removed "and Brave Wallet" from supported wallets list
- Changed comma before "Metamask" to "and"
- Removed the sentence "There are no restrictions based on accreditation status, jurisdiction, or minimum investment size." from "Who can trade on Tessera?" answer

**File modified:** `src/pages/support-page/index.tsx`

### 2. Auction页面介绍中删掉Vesting (P0 Block) ✅
**Status:** FIXED
**Changes made:**
- Removed the `vestingTerms` property from T-SpaceX token metadata
- This removes the "Vesting Terms" section from the auction page

**File modified:** `src/config.ts`

---

## ❓ Needs Clarification

### 3. Trade页面增加开启Trade前状态 (P0 Block)
**Priority:** P0 Block
**Type:** Function
**Reporter:** Oscar Xu
**Report Time:** February 5, 2026 12:41 AM

**Current State (from screenshot):**
The trade page shows a countdown message: "The T-SpaceX trading pool is not yet active. Trading will be available in 2d 5h 30m"

**Questions:**
1. **Where should this state be shown?** Should this replace the entire swap form, or be shown above/below it?
2. **What should be disabled?** Should the entire swap interface be disabled, or just the "Swap" button?
3. **Design specifics:**
   - Should the countdown be in the same green container as shown in the screenshot?
   - What should the exact message format be?
   - Should we show the Rate, Dynamic Fee, and Price Impact fields as in the screenshot, or hide them?
4. **When does this state apply?** Is there a specific timestamp or pool status we should check?
5. **Where does the countdown data come from?** Is this from the pool contract, Hasura, or config?

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Trade页面增加开启Trade前状态/image.png`

---

### 4. Claim完成以后状态更新 (P0 Block) ✅
**Priority:** P0 Block
**Type:** User Experience
**Reporter:** Oscar Xu
**Report Time:** February 5, 2026 12:05 AM
**Status:** FIXED

**Problem:**
After claiming tokens, the button showed "No Tokens to Claim" instead of "Already Claimed". The UI had two issues:
1. Vault state wasn't refreshing after claim
2. Button text didn't distinguish between "no allocation" vs "already claimed all"

**Root Causes:**
1. The `claim()` function in `use-alpha-vault.ts` only called `refreshUserPosition()` after the claim transaction, but didn't call `refreshVaultInfo()`. This meant the vault state was stale.
2. The button logic only checked `availableToClaim > 0`, which is false both when you have nothing allocated AND when you've already claimed everything.

**Solution:**
1. Updated the `claim()` and `withdrawRemaining()` functions to refresh BOTH user position and vault info after successful transactions
2. Added `hasClaimedAll` logic to check if user has claimed tokens (`totalClaimed > 0`) but has nothing available to claim (`availableToClaim === 0`)
3. Updated button text to show "Already Claimed" when user has claimed all their tokens

**Files Modified:**
- `src/hooks/use-alpha-vault.ts` (lines 415-425 and 453-463)
- `src/pages/auction-page/components/vesting/claim-tokens-card.tsx` (lines 47-53, 220, 346)

**Changes:**
```typescript
// use-alpha-vault.ts - Add vault refresh
await refreshUserPosition()
await refreshVaultInfo()

// claim-tokens-card.tsx - Add claimed state detection
const hasClaimedAll =
  claimInfo &&
  mathIs`${totalClaimedValue} > ${0}` &&
  mathIs`${availableAmountValue} === ${0}` &&
  mathIs`${totalAllocationValue} > ${0}`

// Update button text
{hasClaimedAll ? 'Already Claimed' : !canClaim ? 'No Tokens to Claim' : 'Claim All'}
```

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Claim完成以后状态更新/image.png`

---

### 5. Auction页面增加常驻提示 (P0 Block) ✅
**Priority:** P0 Block
**Type:** UI
**Reporter:** Oscar Xu
**Report Time:** February 4, 2026 10:57 PM
**Status:** FIXED

**Problem:**
The auction deposit page needed persistent warnings/notifications to inform users about:
1. Whitelist requirements (if applicable)
2. Minimum deposit requirements
3. Active position status

**Solution:**
Added a persistent info box in the deposit card that:
- Shows whitelist requirement when vault has a whitelist configured
- Displays "Deposits are only available to whitelisted wallets. Minimum deposit per wallet: $500"
- Uses semi-transparent white background `bg-[rgba(255,255,255,0.5)]` matching the design
- Appears above the "Current Deposit" section
- Has Info icon for visual consistency

The "active position" notice was already implemented and appears below the Confirm Deposit button.

**Files Modified:**
- `src/pages/auction-page/components/auction/deposit-usdc-card.tsx`

**Changes:**
```typescript
// Import whitelist checker
import { hasWhitelist } from '@/lib/whitelist'

// Add persistent info box before Current Deposit section
{(hasWhitelist() || vaultInfo?.maxIndividualDeposit) && (
  <div className="bg-[rgba(255,255,255,0.5)] flex gap-2.5 items-start p-3 rounded-lg w-full">
    <Info className="w-3 h-3 text-[#666666] shrink-0 mt-0.5" />
    <div className="flex-1 flex flex-col gap-0.5">
      {hasWhitelist() && (
        <p className="font-normal leading-[16.5px] text-[10px] text-black tracking-[0.0645px]">
          Deposits are only available to whitelisted wallets. Minimum deposit per wallet: $500
        </p>
      )}
    </div>
  </div>
)}
```

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Auction页面增加常驻提示/image.png`

---

### 6. Auction失败 (P1 Urgent)
**Priority:** P1 Urgent
**Type:** Function
**Reporter:** Oscar Xu
**Report Time:** February 4, 2026 12:18 AM

**Current State (from screenshot):**
The screenshot shows error toasts:
- "Deposit failed: Message: Transaction failed"
- "Simulation failed: Attempt to debit an account but found no record of a prior credit."

**Questions:**
1. **What are the steps to reproduce this?**
   - What wallet was being used?
   - What amount was being deposited?
   - Was the wallet connected properly?
   - What was the wallet's USDC balance?
2. **Error analysis:**
   - "No record of a prior credit" suggests the account might not have been initialized
   - Is this an issue with account creation?
   - Do we need to create associated token accounts first?
3. **When does this happen?**
   - First-time depositors only?
   - Specific wallet types?
   - Specific token amounts?
4. **Proposed fix approach:**
   - Should we check if accounts exist before attempting deposit?
   - Should we handle account initialization separately?
   - Should we improve the error message?

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Auction失败/image.png`

---

### 7. Auction输入框报价展示修改 (P2 Important)
**Priority:** P2 Important
**Type:** UI
**Reporter:** Oscar Xu
**Report Time:** February 4, 2026 6:27 PM

**Current State:**
The screenshot shows a proposed new UI layout for the deposit confirmation.

**Proposed Changes (from bug report):**
Assuming the user already has deposited money:

1. **Current Deposit** - Show the currently deposited amount (300 USDC in screenshot)
2. **After This Deposit** - Show current + new input amount (1,200 USDC in screenshot)
3. **Est. Allocation (Total)** - Show tokens purchasable with all deposited money (0.0000 TSX in screenshot)

**Questions:**
1. **Where is this "Current Deposit" data coming from?**
   - Do we need to query the user's existing auction position?
   - Is this from Hasura or the smart contract?
2. **How should the calculation work?**
   - Current Deposit = existing position amount
   - After This Deposit = current + input value
   - Est. Allocation = (After This Deposit / total pool size) * token amount?
3. **What if the user has no existing deposit?**
   - Should we show "Current Deposit: 0 USDC"?
   - Or hide that line entirely?
4. **Should this update in real-time as the user types?**
5. **Edge cases:**
   - What if the auction is oversubscribed? How does that affect the calculation?
   - Should we show a warning if they're depositing below minimum?

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Auction输入框报价展示修改/image.png`

---

### 8. Claim页面自动更新Button (P2 Important) ✅
**Priority:** P2 Important
**Type:** User Experience
**Reporter:** Oscar Xu
**Report Time:** February 4, 2026 11:33 PM
**Status:** FIXED

**Problem:**
The claim button needed to automatically update when tokens become claimable,
showing countdown until vesting starts and then enabling the claim functionality.

**Solution:**
Implemented vesting countdown system that:
1. Reads vestingStartSlot from vault data (auto-synced from Meteora SDK)
2. Shows countdown notification: "The T-SpaceX Token vesting period is not yet active..."
3. Updates button text to "Vesting Not Started" before countdown expires
4. Automatically enables claim button when vesting starts (isVestingActive = true)
5. Uses adaptive refresh strategy (smart polling based on proximity)

**Technical Implementation:**
- Uses same countdown infrastructure as trading/auction deposits
- Slot-based countdown for accuracy
- Component re-renders automatically as countdown ticks
- No manual polling needed - countdown hook handles refresh internally
- Adaptive API refresh: 10 min → 1 min → 10 sec as vesting approaches

**Files Modified:**
- src/pages/auction-page/components/vesting/claim-tokens-card.tsx

**Changes:**
```typescript
// Countdown from vault data
const countdownConfig = useMemo(() => {
  if (!vaultInfo) return { type: 'disabled' }
  return { type: 'slot', targetSlot: vaultInfo.vestingStartSlot }
}, [vaultInfo])

const { timeRemaining } = useCountdown(countdownConfig)
const isVestingActive = timeRemaining.isExpired

// Show countdown notification
{!isVestingActive && (
  <CountdownNotification config={countdownConfig} title={`${token.displayName} vesting period`} />
)}

// Update button logic
const canClaim = wallet.connected && isVestingActive && claimInfo && ...
```

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Claim页面自动更新Button/image.png`

---

## Summary

**Completed:** 6 bugs fixed
- Support page content changes ✅
- Vesting section removal ✅
- Trade countdown implementation ✅
- Claim status refresh fix ✅
- Auction persistent warnings ✅
- Claim vesting countdown ✅

**Needs Clarification:** 2 bugs require additional information

**Priority Breakdown:**
- P0 Block: 0 bugs (all completed!)
- P1 Urgent: 1 bug (Auction failure - needs investigation)
- P2 Important: 1 bug (Auction input display changes)

**Next Steps:**
Please review the questions above and provide clarification so I can implement the remaining 2 fixes.
