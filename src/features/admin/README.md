# Admin Migration Feature

Migrate off-chain referral data from Cloudflare D1 database to on-chain Solana program.

## Overview

The admin migration system allows authorized users (program authority) to migrate existing referral codes and trader bindings from the off-chain database to the on-chain Solana referral program.

## Features

- ✅ Fetch migration data from off-chain API
- ✅ Preview and validate data before migration
- ✅ Batch create referral codes (up to 10 per transaction)
- ✅ Batch register users with referral codes (up to 10 per transaction)
- ✅ Real-time progress tracking
- ✅ Cost estimation
- ✅ Dry-run mode for testing
- ✅ Export migration logs and summary

## Usage

### 1. Access the Admin Page

Navigate to `/admin/migration` in your browser.

### 2. Connect Authority Wallet

Only the program authority wallet can execute migrations. Connect using the Solana wallet adapter.

### 3. Load Migration Data

The page automatically fetches current off-chain data from the API endpoint:

- `GET /api/admin/migration/data`

This returns all active referral codes and trader bindings in the format:

```json
{
  "referralCodes": [
    {
      "code": "ABC123",
      "ownerWallet": "5jK9...pQ7w",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "traderBindings": [
    {
      "userWallet": "2nF8...kL3m",
      "referralCode": "ABC123",
      "referrerWallet": "5jK9...pQ7w",
      "boundAt": "2024-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "exportedAt": "2024-01-01T00:00:00Z",
    "totalCodes": 245,
    "totalBindings": 1543,
    "dataSource": "cloudflare-d1"
  }
}
```

### 4. Configure Migration

Set the following options:

- **Batch Size** (1-10): Number of items per transaction
- **Batch Delay** (ms): Delay between batches to avoid rate limiting
- **Dry Run**: Simulate without executing transactions
- **Skip Existing**: Skip codes/users that already exist on-chain

### 5. Execute Migration

Click "Start Migration" to begin. The process runs in two phases:

1. **Phase 1: Create Referral Codes**
   - Uses `admin_batch_create_referral_codes` instruction
   - Creates codes in batches

2. **Phase 2: Register Users**
   - Uses `admin_batch_register_with_referral_code` instruction
   - Registers users with their referral codes

### 6. View Results

After completion, you'll see:

- Total codes created
- Total users registered
- Failed transactions
- Total cost in SOL
- Transaction signatures

## API Endpoints

### GET /api/admin/migration/data

Fetches all migration data from the off-chain database.

**Response:**

```json
{
  "referralCodes": Array<ReferralCodeData>,
  "traderBindings": Array<TraderBindingData>,
  "metadata": {
    "exportedAt": string,
    "totalCodes": number,
    "totalBindings": number,
    "dataSource": string
  }
}
```

## Database Queries

The API endpoint uses these SQL queries:

### Fetch Referral Codes

```sql
SELECT
  rc.code_slug as code,
  rc.wallet_address as ownerWallet,
  CASE WHEN rc.status = 'active' THEN 1 ELSE 0 END as isActive,
  rc.created_at as createdAt
FROM referral_codes rc
WHERE rc.status = 'active'
ORDER BY rc.created_at
```

### Fetch Trader Bindings

```sql
SELECT
  tb.wallet_address as userWallet,
  rc.code_slug as referralCode,
  rc.wallet_address as referrerWallet,
  tb.bound_at as boundAt
FROM trader_bindings tb
JOIN referral_codes rc ON tb.referrer_code_id = rc.id
ORDER BY tb.bound_at
```

## On-Chain Instructions Used

### admin_batch_create_referral_codes

Batch creates multiple referral codes.

**Accounts:**

- `referralConfig`: Global referral config PDA
- `authority`: Program authority (signer)
- `payer`: Transaction payer (signer)
- `systemProgram`: Solana system program

**Args:**

- `codes`: Array of code strings (max 10)
- `owners`: Array of owner public keys (max 10)

### admin_batch_register_with_referral_code

Batch registers multiple users with referral codes.

**Accounts:**

- `referralConfig`: Global referral config PDA
- `authority`: Program authority (signer)
- `payer`: Transaction payer (signer)
- `systemProgram`: Solana system program

**Args:**

- `users`: Array of user public keys (max 10)
- `referralCodeKeys`: Array of referral code PDAs (max 10)

## Cost Estimation

Estimated costs for migration:

- **Referral Code Account**: ~0.001 SOL per code
- **User Registration Account**: ~0.002 SOL per user
- **Transaction Fee**: ~0.000005 SOL per transaction

**Example (100 codes, 1000 users):**

- Codes: 100 × 0.001 = 0.1 SOL
- Users: 1000 × 0.002 = 2.0 SOL
- Fees: 1100 × 0.000005 = 0.0055 SOL
- **Total: ~2.1 SOL (~$420 at $200/SOL)**

## File Structure

```
src/features/admin/
├── pages/
│   └── MigrationPage.tsx           # Main migration dashboard UI
├── hooks/
│   ├── use-migration.ts            # Main migration orchestration
│   ├── use-admin-batch-create-codes.ts   # Batch code creation
│   └── use-admin-batch-register-users.ts # Batch user registration
├── lib/
│   └── migration-api.ts            # API client for fetching data
├── types/
│   └── migration.ts                # TypeScript types
└── index.ts                        # Public exports

functions/api/admin/migration/
└── data.ts                         # API endpoint handler
```

## Security Considerations

⚠️ **Important:**

- Only program authority can execute migrations
- Always test with dry-run mode first
- Verify data before migrating
- Keep private key secure
- Monitor transaction costs
- Have rollback plan ready

## Troubleshooting

### "Wallet not connected"

Connect your Solana wallet using the wallet adapter button.

### "Unauthorized"

Ensure you're using the program authority wallet. Check that the wallet matches the authority in the referral config.

### "Failed to fetch migration data"

Check that:

- API endpoint is running
- Database connection is configured
- CORS is enabled for your domain

### Transaction failures

- Check SOL balance for rent and fees
- Verify batch size is not too large
- Ensure referral codes don't already exist
- Check network congestion

## Development

To run locally:

1. Set up environment variables (see `.env.migration.example`)
2. Start the dev server: `npm run dev`
3. Navigate to `http://localhost:5173/admin/migration`

## Production Checklist

Before migrating on mainnet:

- [ ] Test thoroughly on devnet
- [ ] Verify authority wallet
- [ ] Ensure sufficient SOL balance
- [ ] Backup D1 database
- [ ] Set up monitoring/alerts
- [ ] Prepare rollback plan
- [ ] Export migration data as backup
- [ ] Test with dry-run mode first
- [ ] Execute during low-traffic period
