# Math-Literal Usage Guide

## Overview

This project uses [math-literal](https://github.com/zhigang1992/math-literal) for arbitrary precision arithmetic. The library provides clean mathematical expression syntax using template literals with decimal.js under the hood.

## Quick Start

```typescript
import { BigNumber, math, mathIs } from '@/lib/bignumber'

// Create BigNumber values
const a = BigNumber.from('123.456')
const b = BigNumber.from(789)

// Arithmetic using template literals
const sum = math`${a} + ${b}`
const diff = math`${a} - ${b}`
const product = math`${a} * ${b}`
const quotient = math`${a} / ${b}`
const power = math`${a} ** ${2}`

// Complex expressions with proper precedence
const result = math`(${a} + ${b}) * ${2}`

// Comparisons (return boolean)
const isGreater = mathIs`${a} > ${b}`
const isEqual = mathIs`${a} === ${b}`
const isValid = mathIs`${a} > ${0} && ${a} < ${1000}`
```

## Supported Operators

### Arithmetic (use with `math`)
| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `math\`${a} + ${b}\`` |
| `-` | Subtraction | `math\`${a} - ${b}\`` |
| `*` | Multiplication | `math\`${a} * ${b}\`` |
| `/` | Division | `math\`${a} / ${b}\`` |
| `**` | Exponentiation | `math\`${a} ** ${2}\`` |
| `<<` | Left shift decimals | `math\`${a} << ${2}\`` |
| `>>` | Right shift decimals | `math\`${a} >> ${2}\`` |

### Functions (use with `math`)
- `round()` - Round to nearest integer
- `floor()` - Round down
- `ceil()` - Round up
- `sqrt()` - Square root
- `abs()` - Absolute value
- `ln()` - Natural logarithm
- `exp()` - Exponential (e^x)
- `max()` - Maximum of two values
- `min()` - Minimum of two values

### Comparisons (use with `mathIs`)
| Operator | Description | Example |
|----------|-------------|---------|
| `>` | Greater than | `mathIs\`${a} > ${b}\`` |
| `>=` | Greater or equal | `mathIs\`${a} >= ${b}\`` |
| `<` | Less than | `mathIs\`${a} < ${b}\`` |
| `<=` | Less or equal | `mathIs\`${a} <= ${b}\`` |
| `===` | Equal | `mathIs\`${a} === ${b}\`` |
| `!==` | Not equal | `mathIs\`${a} !== ${b}\`` |

### Logical Operators (use with `mathIs`)
- `&&` - Logical AND
- `||` - Logical OR

## BigNumber Utilities

```typescript
// Creating
const num = BigNumber.from('123.456')
const fromNumber = BigNumber.from(789)

// Type checking
BigNumber.isBigNumber(num) // true

// Conversions
BigNumber.toString(num) // "123.456"
BigNumber.toNumber(num) // 123.456

// Static comparison methods
BigNumber.isEq(num, '123.456') // true
BigNumber.isGt(num, 100) // true
BigNumber.isLt(num, 200) // true
```

## Project-Specific Utilities

The `@/lib/bignumber` module provides additional utilities:

```typescript
import {
  BigNumber,
  math,
  mathIs,
  formatBigNumber,
  fromHasuraToNative,
  fromTokenAmount,
  toTokenAmount,
  parseAmount,
  isZero,
  isPositive,
  ZERO,
  ONE,
} from '@/lib/bignumber'

// Convert Hasura 18-decimal values
const amount = fromHasuraToNative(hasuraValue)

// Token amount conversions
const humanAmount = fromTokenAmount(rawAmount, 6) // 6 decimals for USDC
const rawAmount = toTokenAmount(humanAmount, 6)

// Parse user input
const userValue = parseAmount('123.45')

// Display formatting
const display = formatBigNumber(amount, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
  locale: 'en-US',
})

// Checks
if (isZero(amount)) { /* ... */ }
if (isPositive(amount)) { /* ... */ }
```

## Best Practices

1. **Always use `BigNumber.from()` to create values** - Don't use `new Decimal()` directly
2. **Use `math` template literals for calculations** - They read naturally and maintain precision
3. **Use `mathIs` for comparisons** - Returns boolean, supports logical operators
4. **Only format at display time** - Keep values as BigNumber throughout the system
5. **Use `formatBigNumber()` for UI display** - Handles locale formatting properly

## Examples

### Financial Calculation
```typescript
function calculateTotal(price: BigNumberValue, quantity: BigNumberValue, taxRate: BigNumberValue) {
  const subtotal = math`${price} * ${quantity}`
  const tax = math`${subtotal} * ${taxRate}`
  return math`${subtotal} + ${tax}`
}
```

### Validation
```typescript
function validateAmount(amount: BigNumberValue, min: BigNumberValue, max: BigNumberValue) {
  return mathIs`${amount} >= ${min} && ${amount} <= ${max}`
}
```

### Token Swap Rate
```typescript
function calculateRate(inAmount: BigNumberValue, outAmount: BigNumberValue) {
  if (mathIs`${inAmount} === ${0}`) {
    return BigNumber.from(0)
  }
  return math`${outAmount} / ${inAmount}`
}
```
