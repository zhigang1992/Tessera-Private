# Tessera Webapp

## Skills

- **Math-Literal Usage**: See [.claude/skills/math-literal.md](.claude/skills/math-literal.md) for detailed usage guide on BigNumber and math operations.

## BigNumber / Decimal Utilities

We use [math-literal](https://github.com/zhigang1992/math-literal) for precise decimal arithmetic. This library wraps `decimal.js` with a clean template literal syntax.

**Key principle:** Keep values as `BigNumber` throughout the system until the final display step. Only convert to string for UI rendering using `formatBigNumber`.

### Quick Start

```typescript
import { BigNumber, math, mathIs, formatBigNumber } from '@/lib/bignumber'

// Create BigNumber values
const a = BigNumber.from('123.456')
const b = BigNumber.from(789)

// Arithmetic using template literals
const sum = math`${a} + ${b}`
const product = math`${a} * ${b}`
const complex = math`(${a} + ${b}) * ${2}`

// Comparisons (return boolean)
const isGreater = mathIs`${a} > ${b}`
const isValid = mathIs`${a} > ${0} && ${a} < ${1000}`

// Display formatting (only at UI layer)
const displayStr = formatBigNumber(sum) // "912.46"
```

### Hasura Numeric Precision

Hasura returns numeric values with 18 decimal precision. Use the `fromHasuraToNative` function to convert these to `BigNumber`:

```typescript
import { fromHasuraToNative, formatBigNumber, type BigNumberValue } from '@/lib/bignumber'

// Convert Hasura amount to BigNumber (keeps precision)
const amount: BigNumberValue = fromHasuraToNative(event.amount_x)

// Only format at the display layer
const displayStr = formatBigNumber(amount) // "1.00"
```

### Available Exports from `@/lib/bignumber`

**Core (from math-literal):**
- `BigNumber` - Object with static methods for creating and manipulating BigNumbers
- `math` - Template literal tag for arithmetic expressions (returns BigNumber)
- `mathIs` - Template literal tag for comparisons (returns boolean)

**Types:**
- `BigNumberValue` - Type for BigNumber values (use this in type annotations)
- `BigNumberSource` - Values that can be converted (number, string, bigint, BigNumberValue)

**Conversion Functions:**
- `fromHasuraToNative(value: BigNumberSource): BigNumberValue` - Converts Hasura 18-decimal values
- `fromTokenAmount(rawAmount, decimals): BigNumberValue` - Convert on-chain token amounts
- `toTokenAmount(amount, decimals): bigint` - Convert to raw on-chain amount
- `parseAmount(amount: string): BigNumberValue` - Parse user input

**Formatting (for display only):**
- `formatBigNumber(value: BigNumberValue, options?): string` - Format for locale-aware display
  - Options: `{ minimumFractionDigits?, maximumFractionDigits?, locale? }`

**Utility Functions:**
- `isZero(value: BigNumberValue): boolean`
- `isPositive(value: BigNumberValue): boolean`

**Constants:**
- `ZERO` - BigNumber representing 0
- `ONE` - BigNumber representing 1

### Examples

```typescript
// Financial calculation
function calculateTotal(price: BigNumberValue, qty: BigNumberValue, taxRate: BigNumberValue) {
  const subtotal = math`${price} * ${qty}`
  const tax = math`${subtotal} * ${taxRate}`
  return math`${subtotal} + ${tax}`
}

// Validation
function validateAmount(amount: BigNumberValue, min: BigNumberValue, max: BigNumberValue) {
  return mathIs`${amount} >= ${min} && ${amount} <= ${max}`
}

// Safe division
function calculateRate(inAmount: BigNumberValue, outAmount: BigNumberValue) {
  if (mathIs`${inAmount} === ${0}`) {
    return BigNumber.from(0)
  }
  return math`${outAmount} / ${inAmount}`
}
```
