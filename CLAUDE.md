# Tessera Webapp

## BigNumber / Decimal Utilities

We use `decimal.js` for precise decimal arithmetic, especially when handling values from Hasura GraphQL.

**Key principle:** Keep values as `BigNumber` throughout the system until the final display step. Only convert to string for UI rendering using `formatBigNumber`.

### Hasura Numeric Precision

Hasura returns numeric values with 18 decimal precision. Use the `fromHasuraToNative` function to convert these to `BigNumber`:

```typescript
import { fromHasuraToNative, formatBigNumber, type BigNumber } from '@/lib/bignumber'

// Convert Hasura amount to BigNumber (keeps precision)
const amount: BigNumber = fromHasuraToNative(event.amount_x)

// Only format at the display layer
const displayStr = formatBigNumber(amount) // "1.00"
```

### Available Exports from `@/lib/bignumber`

**Types:**
- `BigNumber` - Core type for all numeric calculations (alias for Decimal)
- `BigNumberSource` - Values that can be converted (number, string, bigint, Decimal)

**Conversion Functions:**
- `fromHasuraToNative(value: BigNumberSource): BigNumber` - Converts Hasura 18-decimal values to BigNumber
- `toBigNumber(value: BigNumberSource): BigNumber` - Create BigNumber from any source

**Formatting (for display only):**
- `formatBigNumber(value: BigNumber, options?): string` - Format for locale-aware display
  - Options: `{ minimumFractionDigits?, maximumFractionDigits?, locale? }`

**Utility Functions:**
- `isZero(value: BigNumber): boolean`
- `isPositive(value: BigNumber): boolean`

**Constants:**
- `ZERO` - BigNumber representing 0
- `ONE` - BigNumber representing 1

**Re-exports:**
- `Decimal` - From decimal.js for direct operations
