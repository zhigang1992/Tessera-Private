# Migrating to math-literal BigNumber Pattern

## Overview

This guide documents the migration pattern for converting legacy numeric computations to use `math-literal` with BigNumber values throughout the system. The key principle is: **keep values as BigNumber until the final display step**.

## Core Principles

1. **Convert at the boundary** - All inputs (from Hasura, on-chain, user input) are converted to BigNumber at the lowest level
2. **Compute with BigNumber** - All intermediate calculations use `math` and `mathIs` template literals
3. **Pass BigNumber through layers** - Types, interfaces, and components accept `BigNumberValue`
4. **Display at the end** - Only convert to string using `formatBigNumber()` at the UI rendering layer

## Migration Pattern

### Step 1: Update Imports

**Before:**
```typescript
// No imports or scattered imports
```

**After:**
```typescript
import { fromTokenAmount, type BigNumberValue } from '@/lib/bignumber'
import { BigNumber, math, mathIs } from 'math-literal'
```

**Important:** Import `BigNumber`, `math`, and `mathIs` directly from `'math-literal'`, NOT from `@/lib/bignumber`. The `@/lib/bignumber` module only provides helper utilities.

### Step 2: Convert Raw Values at Input

**Before:**
```typescript
const totalDeposited = escrow.totalDeposit?.toString() ?? '0'
const claimedAmount = escrow.claimedToken?.toString() ?? '0'
```

**After:**
```typescript
const userDeposited = fromTokenAmount(escrow.totalDeposit?.toString() ?? '0', this.config.quoteDecimals)
const claimedAmount = fromTokenAmount(escrow.claimedToken?.toString() ?? '0', this.config.baseDecimals)
```

### Step 3: Replace parseFloat with BigNumber.from

**Before:**
```typescript
const boughtToken = parseFloat(vaultData.boughtToken?.toString() ?? '0')
```

**After:**
```typescript
const boughtToken = BigNumber.from(vaultData.boughtToken?.toString() ?? '0')
```

### Step 4: Replace Numeric Comparisons with mathIs

**Before:**
```typescript
if (boughtToken > 0) {
  // ...
}

if (totalDepositsNum > 0 && poolPrice > 0) {
  // ...
}
```

**After:**
```typescript
if (mathIs`${boughtToken} > ${0}`) {
  // ...
}

if (mathIs`${totalDeposit} > ${0}` && mathIs`${poolPrice} > ${0}`) {
  // ...
}
```

**Critical:** Numbers in template literals must be wrapped in `${}`. Even `0` must be `${0}`, not `0`.

### Step 5: Replace Arithmetic with math Template Literals

**Before:**
```typescript
const userShare = userDepositNum / totalDepositsNum
const effectiveUsdc = Math.min(totalDepositsNum, maxCapNum)
const estimatedTessForVault = Math.min(tessAvailable, effectiveUsdc / poolPrice)
const userTessAllocation = userShare * estimatedTessForVault
```

**After:**
```typescript
const userShare = math`${userDeposited} / ${totalDeposit}`
const effectiveUsdc = math`min(${totalDeposit}, ${maxCapNum})`
const estimatedTessForVault = math`min(${effectiveUsdc} / ${poolPrice}, ${tessAvailable})`
const userTessAllocation = math`${estimatedTessForVault} * ${userShare}`
```

### Step 6: Remove Manual Decimal Conversion

**Before:**
```typescript
estimatedAllocation = (userTessAllocation * 10 ** this.config.baseDecimals).toFixed(0)
estimatedRefund = ((userDepositNum - usedUsdc) * 10 ** this.config.quoteDecimals).toFixed(0)
```

**After:**
```typescript
estimatedAllocation = userTessAllocation
estimatedRefund = math`${userDeposited} - ${usedUsdc}`
```

The values are already in human scale, so no manual decimal conversion is needed.

### Step 7: Update Type Definitions

**Before:**
```typescript
export interface EscrowInfo {
  totalDeposited: string
  claimedAmount: string
  estimatedAllocation: string
  estimatedRefund: string
}
```

**After:**
```typescript
export interface EscrowInfo {
  totalDeposited: BigNumberValue
  claimedAmount: BigNumberValue
  estimatedAllocation: BigNumberValue
  estimatedRefund: BigNumberValue
}
```

### Step 8: Update Display Layer Only

Keep `availableToClaim` as string if it's displayed directly without calculation:

```typescript
export interface EscrowInfo {
  // ... BigNumber fields for computation
  availableToClaim: string  // Still string if not used in calculations
}
```

### Step 9: Handle Percentage Calculations

**Before:**
```typescript
const totalClaimed = parseFloat(claimedAmount)
const totalAllocationNum = parseFloat(totalAllocation)
const vestingProgress = totalAllocationNum > 0
  ? (totalClaimed / totalAllocationNum) * 100
  : 0
```

**After:**
```typescript
const totalAllocation = fromTokenAmount(claimInfo?.totalAllocated?.toString() ?? '0', this.config.baseDecimals)
const vestingProgress = mathIs`${totalAllocation} > ${0}`
  ? BigNumber.toNumber(math`(${claimedAmount} / ${totalAllocation}) * ${100}`)
  : 0
```

Use `BigNumber.toNumber()` when you need a primitive number (e.g., for percentages displayed in progress bars).

### Step 10: Initialize with BigNumber Constants

**Before:**
```typescript
let estimatedAllocation = '0'
let estimatedRefund = '0'
```

**After:**
```typescript
let estimatedAllocation: BigNumberValue = BigNumber.ZERO
let estimatedRefund: BigNumberValue = BigNumber.ZERO
```

Available constants from `@/lib/bignumber`:
- `ZERO` - BigNumber representing 0
- `ONE` - BigNumber representing 1

Or use `BigNumber.from()`:
```typescript
let estimatedAllocation: BigNumberValue = BigNumber.from(0)
```

### Step 11: Update Component Usage

**Before:**
```typescript
const hasPosition = escrowInfo && parseFloat(escrowInfo.totalDeposited) > 0
```

**After:**
```typescript
import { mathIs } from 'math-literal'

const hasPosition = escrowInfo && mathIs`${escrowInfo.totalDeposited} > ${0}`
```

## Common Patterns

### Converting Token Amounts
```typescript
// From on-chain to human scale
const amount = fromTokenAmount(rawAmount, decimals)

// From human scale to on-chain
const rawAmount = toTokenAmount(amount, decimals)
```

### Converting Hasura Values
```typescript
import { fromHasuraToNative } from '@/lib/bignumber'

const amount = fromHasuraToNative(hasuraValue) // Hasura uses 18 decimals
```

### Display Formatting
```typescript
import { formatBigNumber } from '@/lib/bignumber'

// In JSX/TSX
<div>{formatBigNumber(amount)}</div>

// With options
<div>{formatBigNumber(amount, { maximumFractionDigits: 2 })}</div>
```

### Safe Division
```typescript
function calculateRate(inAmount: BigNumberValue, outAmount: BigNumberValue) {
  if (mathIs`${inAmount} === ${0}`) {
    return BigNumber.from(0)
  }
  return math`${outAmount} / ${inAmount}`
}
```

## Critical Rules

1. **Template Literal Numbers Must Be Wrapped**
   - ❌ Wrong: `mathIs\`${a} > 0\``
   - ✅ Correct: `mathIs\`${a} > ${0}\``

2. **Import from math-literal Directly**
   - ❌ Wrong: `import { BigNumber, math, mathIs } from '@/lib/bignumber'`
   - ✅ Correct: `import { BigNumber, math, mathIs } from 'math-literal'`
   - ✅ Correct: `import { formatBigNumber, fromTokenAmount, type BigNumberValue } from '@/lib/bignumber'`

3. **Convert at Input, Not Output**
   - ❌ Wrong: Keep as string, convert to number for calculations, convert back to string
   - ✅ Correct: Convert to BigNumber immediately, keep as BigNumber, only format for display

4. **Don't Mix Number and BigNumber**
   - ❌ Wrong: `const result = userNum * BigNumber.toNumber(vaultAmount)`
   - ✅ Correct: `const result = math\`${user} * ${vaultAmount}\``

5. **Type Annotations for Clarity**
   ```typescript
   // Explicit type helps catch errors early
   let allocation: BigNumberValue = BigNumber.from(0)

   // Function parameters should be typed
   function calculate(amount: BigNumberValue): BigNumberValue {
     return math`${amount} * ${2}`
   }
   ```

## Example Migration: alpha-vault.ts

Here's the complete before/after for the `getEscrowInfo` calculation section:

### Before
```typescript
const totalDeposited = escrow.totalDeposit?.toString() ?? '0'
const claimedAmount = escrow.claimedToken?.toString() ?? '0'

let estimatedAllocation = '0'
let estimatedRefund = '0'

const vaultData = vault.vault as any
const boughtToken = parseFloat(vaultData.boughtToken?.toString() ?? '0')

if (boughtToken > 0) {
  estimatedAllocation = claimInfo?.totalAllocated?.toString() ?? '0'
} else if (vaultInfo.mode === 'prorata') {
  const userDepositNum = parseFloat(totalDeposited) / 10 ** this.config.quoteDecimals
  const totalDepositsNum = parseFloat(vaultInfo.totalDeposited) / 10 ** this.config.quoteDecimals
  const maxCapNum = parseFloat(vaultInfo.maxCap) / 10 ** this.config.quoteDecimals

  if (totalDepositsNum > 0 && poolPrice > 0) {
    const userShare = userDepositNum / totalDepositsNum
    const effectiveUsdc = Math.min(totalDepositsNum, maxCapNum)
    const estimatedTessForVault = Math.min(tessAvailable, effectiveUsdc / poolPrice)
    const userTessAllocation = userShare * estimatedTessForVault

    estimatedAllocation = (userTessAllocation * 10 ** this.config.baseDecimals).toFixed(0)

    if (totalDepositsNum > maxCapNum) {
      const usedRatio = maxCapNum / totalDepositsNum
      const usedUsdc = userDepositNum * usedRatio
      estimatedRefund = ((userDepositNum - usedUsdc) * 10 ** this.config.quoteDecimals).toFixed(0)
    }
  }
}
```

### After
```typescript
const userDeposited = fromTokenAmount(escrow.totalDeposit?.toString() ?? '0', this.config.quoteDecimals)
const claimedAmount = fromTokenAmount(escrow.claimedToken?.toString() ?? '0', this.config.baseDecimals)

let estimatedAllocation: BigNumberValue = BigNumber.ZERO
let estimatedRefund: BigNumberValue = BigNumber.ZERO

const vaultData = vault.vault
const boughtToken = BigNumber.from(vaultData.boughtToken?.toString() ?? '0')

if (mathIs`${boughtToken} > ${0}`) {
  estimatedAllocation = fromTokenAmount(claimInfo?.totalAllocated?.toString() ?? '0', this.config.baseDecimals)
} else if (vaultInfo.mode === 'prorata') {
  const tessAvailable = await this.getPoolTessReserve()
  const poolPrice = await this.getPoolPrice()
  const totalDeposit = fromTokenAmount(vaultData.totalDeposit?.toString() ?? '0', this.config.quoteDecimals)
  const maxCapNum = parseFloat(vaultInfo.maxCap) / 10 ** this.config.quoteDecimals

  if (mathIs`${totalDeposit} > ${0}` && mathIs`${poolPrice} > ${0}`) {
    const userShare = math`${userDeposited} / ${totalDeposit}`
    const effectiveUsdc = math`min(${totalDeposit}, ${maxCapNum})`
    const estimatedTessForVault = math`min(${effectiveUsdc} / ${poolPrice}, ${tessAvailable})`
    const userTessAllocation = math`${estimatedTessForVault} * ${userShare}`

    estimatedAllocation = userTessAllocation

    if (mathIs`${totalDeposit} > ${maxCapNum}`) {
      const usedRatio = math`${effectiveUsdc} / ${totalDeposit}`
      const usedUsdc = math`${userDeposited} * ${usedRatio}`
      estimatedRefund = math`${userDeposited} - ${usedUsdc}`
    }
  }
}
```

## Verification Checklist

After migration, verify:

- [ ] All `parseFloat(x) / 10 ** decimals` replaced with `fromTokenAmount(x, decimals)`
- [ ] All numeric comparisons use `mathIs` template literals
- [ ] All arithmetic uses `math` template literals
- [ ] All numbers in template literals are wrapped: `${0}` not `0`
- [ ] Interface types updated from `string` to `BigNumberValue` where appropriate
- [ ] Constants use `BigNumber.ZERO` or `BigNumber.from(0)`
- [ ] Imports are correct: `math-literal` for core, `@/lib/bignumber` for utilities
- [ ] TypeScript builds without errors: `npm run build`
- [ ] Display formatting uses `formatBigNumber()` at UI layer

## Benefits of This Pattern

1. **Precision** - No floating-point rounding errors
2. **Type Safety** - BigNumberValue type prevents mixing with regular numbers
3. **Readability** - Template literals read like natural math expressions
4. **Consistency** - Same pattern everywhere in the codebase
5. **Maintainability** - Clear separation between computation and display

## Related Documentation

- [math-literal.md](.claude/skills/math-literal.md) - Complete math-literal usage guide
- [/src/lib/bignumber.ts](/src/lib/bignumber.ts) - Project utilities and helpers
- [CLAUDE.md](/CLAUDE.md) - Project guidelines
