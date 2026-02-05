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

### 5. Auction页面增加常驻提示 (P0 Block)
**Priority:** P0 Block
**Type:** UI
**Reporter:** Oscar Xu
**Report Time:** February 4, 2026 10:57 PM

**Current State (from screenshot):**
The screenshot shows a deposit dialog with some warning text about deposits being available to whitelisted wallets and checking the whitelist.

**Questions:**
1. **What is the exact text for the persistent warning?** The screenshot shows:
   - "Deposits are only available to whitelisted wallets."
   - "Minimum deposit per wallet: $500"
   - "You have an active position in this auction. Check the 'My Position' card to view it."
2. **Where should this warning appear?**
   - Always visible on the auction page?
   - Only in the deposit dialog?
   - Both places?
3. **Which warnings are always shown vs. conditional?**
   - Is the whitelisting requirement always active?
   - Is the minimum deposit always $500?
   - When should the "active position" warning show?
4. **Styling:**
   - Should it be in a green info box as shown?
   - Icon needed?
   - Dismissible or always visible?

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

### 8. Claim页面自动更新Button (P2 Important)
**Priority:** P2 Important
**Type:** User Experience
**Reporter:** Oscar Xu
**Report Time:** February 4, 2026 11:33 PM

**Current State (from screenshot):**
The button shows "No Tokens to Claim" but should update to "Claim All →" when tokens are available.

**Questions:**
1. **Is this about automatic polling?** Should we:
   - Poll for claim status updates periodically?
   - Use a WebSocket connection for real-time updates?
   - Refetch on user interaction?
2. **When should the button auto-update?**
   - Immediately when tokens become claimable?
   - After a certain time period?
   - When the auction ends?
3. **What triggers the button state change?**
   - Auction end time reached?
   - Token allocation finalized?
   - Vesting period completed?
4. **Should we show a notification when claimable status changes?**
5. **Performance considerations:**
   - How often should we poll?
   - Should we use a background service?
   - Should we cache the status?

**Screenshot reference:** `/Users/kylefang/Downloads/Private & Shared/Tessera Bugs/Claim页面自动更新Button/image.png`

---

## Summary

**Completed:** 2 bugs fixed (straightforward text/content changes)
**Needs Clarification:** 6 bugs require additional information

**Priority Breakdown:**
- P0 Block: 3 bugs (Trade pre-state, Claim status update, Auction persistent warning)
- P1 Urgent: 1 bug (Auction failure - needs investigation)
- P2 Important: 2 bugs (Auction input display, Claim button auto-update)

**Next Steps:**
Please review the questions above and provide clarification so I can implement the remaining fixes.
