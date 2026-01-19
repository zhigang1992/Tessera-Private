# Tessera Webapp

## BigNumber / Decimal Utilities

We use `decimal.js` for precise decimal arithmetic, especially when handling values from Hasura GraphQL.

### Hasura Numeric Precision

Hasura returns numeric values with 18 decimal precision. Use the `fromHasuraToNative` function to convert these to JavaScript numbers:

```typescript
import { fromHasuraToNative, type BigNumberSource } from '@/lib/bignumber'

// Convert Hasura amount to native number
const amount = fromHasuraToNative(event.amount_x) // e.g., 1000000000000000000 -> 1.0
```

### Available Exports from `@/lib/bignumber`

- `fromHasuraToNative(value: BigNumberSource): number` - Converts Hasura 18-decimal values to native numbers
- `BigNumberSource` - Type alias for values that can be converted (number, string, bigint, Decimal)
- `Decimal` - Re-exported from decimal.js for direct use when needed
