# Migration Plan: Complete Off-Chain to On-Chain Referral System

**Status**: 🚧 In Progress
**Branch**: `feature/on-chain-migration`
**Target Completion**: 8 weeks
**Last Updated**: 2025-10-30

---

## 🎯 Executive Summary

**Strategy**: Complete migration from off-chain (Cloudflare D1/KV) to on-chain (Solana) referral system. No dual-system support.

**Approach**:

1. Export existing off-chain data (READ-ONLY, no production modifications)
2. Admin migration tool writes data on-chain
3. Replace frontend to use Solana SDK directly
4. Remove features not supported on-chain
5. Users experience seamless transition (their codes just work)

**Key Simplification**: Accepting feature removal (like deactivate) in exchange for simpler architecture and on-chain benefits.

---

## 📊 What Changes

### Features KEEPING (Supported On-Chain)

✅ Create referral codes (6-12 alphanumeric)
✅ Register with referral code
✅ 3-tier referral tracking (owner, tier2, tier3)
✅ Automatic fee distribution (30%, 3%, 2%)
✅ Query referral data (via RPC)
✅ View referral tree

### Features REMOVING (Not Worth Supporting)

❌ **Deactivate referral codes** - Requires off-chain user tracking per README warning
❌ **Referral code editing** - On-chain codes are immutable
❌ **Email verification** - Not on-chain, unnecessary complexity
❌ **Display names** - Keep it simple, just wallet addresses
❌ **Real-time metrics dashboard** - Will query on-chain accounts instead

### Architecture Changes

| Before                            | After                            |
| --------------------------------- | -------------------------------- |
| Cloudflare D1 (SQLite)            | Solana PDAs                      |
| KV sessions (2hr TTL)             | Wallet signature per transaction |
| API endpoints (`/api/referral/*`) | Direct Solana RPC calls          |
| `referral_tree_edges` table       | `UserRegistration` fields        |
| Instant operations                | ~400-800ms confirmations         |
| Free                              | Costs SOL (rent + fees)          |

---

## 🔒 Safety Guardrails

### Production Protection

- ✅ All development on `feature/on-chain-migration` branch
- ✅ Production data: **EXPORT ONLY** (read-only operations)
- ✅ No writes to production D1 database
- ✅ Test on local devnet → public devnet → testnet → mainnet
- ✅ Exported data stored locally, NOT committed to git
- ✅ Can rollback via git at any time

### Testing Workflow

```
Local Devnet (sample data)
  ↓ validated
Public Devnet (full migration test)
  ↓ validated
Testnet (dress rehearsal)
  ↓ validated
Mainnet (production migration)
```

---

## 📋 Migration Plan

### Phase 1: Pre-Migration Data Export (Week 1)

#### 1.1 Create Export Script (READ-ONLY)

**File**: `scripts/export-production-data.ts`

```typescript
import { createClient } from '@cloudflare/workers-types'

interface ExportedCode {
  code: string
  owner: string // wallet address
  createdAt: string
  activeLayer: number
}

interface ExportedBinding {
  user: string // wallet address
  code: string
  tier1: string // direct referrer
  tier2: string // grandparent
  tier3: string // great-grandparent
}

async function exportProductionData() {
  console.log('🔍 Exporting production data (READ-ONLY)...')

  // Export referral codes
  const codes = await db
    .prepare(
      `
    SELECT
      code_slug as code,
      wallet_address as owner,
      created_at,
      active_layer
    FROM referral_codes
    WHERE status = 'active'
  `,
    )
    .all()

  // Validate code formats
  const validCodes = codes.results.filter(
    (c) => c.code.length >= 6 && c.code.length <= 12 && /^[a-zA-Z0-9]+$/.test(c.code),
  )

  const invalidCodes = codes.results.filter(
    (c) => c.code.length < 6 || c.code.length > 12 || !/^[a-zA-Z0-9]+$/.test(c.code),
  )

  console.log(`✅ Valid codes: ${validCodes.length}`)
  console.log(`⚠️  Invalid codes: ${invalidCodes.length}`)

  if (invalidCodes.length > 0) {
    console.log('\nInvalid codes that need attention:')
    invalidCodes.forEach((c) => {
      console.log(`  ${c.code} (length: ${c.code.length}, owner: ${c.owner})`)
    })
  }

  // Export trader bindings with tree structure
  const bindings = await db
    .prepare(
      `
    SELECT
      tb.wallet_address as user,
      rc.code_slug as code,
      te1.ancestor_wallet as tier1,
      te2.ancestor_wallet as tier2,
      te3.ancestor_wallet as tier3
    FROM trader_bindings tb
    JOIN referral_codes rc ON tb.referrer_code_id = rc.id
    LEFT JOIN referral_tree_edges te1
      ON te1.descendant_wallet = tb.wallet_address AND te1.level = 1
    LEFT JOIN referral_tree_edges te2
      ON te2.descendant_wallet = tb.wallet_address AND te2.level = 2
    LEFT JOIN referral_tree_edges te3
      ON te3.descendant_wallet = tb.wallet_address AND te3.level = 3
  `,
    )
    .all()

  // Save exports
  const exportData = {
    exportDate: new Date().toISOString(),
    validCodes: validCodes,
    invalidCodes: invalidCodes,
    bindings: bindings.results,
    stats: {
      totalCodes: codes.results.length,
      validCodes: validCodes.length,
      invalidCodes: invalidCodes.length,
      totalBindings: bindings.results.length,
    },
  }

  fs.writeFileSync('data/migration-export.json', JSON.stringify(exportData, null, 2))

  console.log('\n📊 Export Summary:')
  console.log(`  Total codes: ${exportData.stats.totalCodes}`)
  console.log(`  Valid codes: ${exportData.stats.validCodes}`)
  console.log(`  Invalid codes: ${exportData.stats.invalidCodes}`)
  console.log(`  User bindings: ${exportData.stats.totalBindings}`)
  console.log('\n✅ Export saved to data/migration-export.json')
}
```

#### 1.2 Handle Code Format Issues

- Codes must be 6-12 alphanumeric characters
- Contact users with invalid codes to update them
- Document handling strategy for each invalid code

### Phase 2: Deploy On-Chain Programs (Week 1-2)

#### 2.1 Deploy to Local Devnet First

```bash
cd /Users/kylefang/Projects/alex/tessera-on-solana

# Start local validator
solana-test-validator

# Build programs
anchor build

# Deploy to local validator
anchor deploy
```

#### 2.2 Initialize Referral System

```typescript
await program.methods
  .initializeReferralSystem(
    tesseraTokenProgramId,
    2000, // 20% fee reduction
    3000, // 30% to tier 1
    300, // 3% to tier 2
    200, // 2% to tier 3
  )
  .accounts({
    referralConfig: referralConfigPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### Phase 3: Admin Migration Tool (Week 2-3)

#### 3.1 Add Admin Instruction to Contract

**File**: `/Users/kylefang/Projects/alex/tessera-on-solana/programs/referral-system/src/lib.rs`

Add new instruction for seamless migration:

```rust
/// Admin-only instruction to create codes during migration
/// Allows authority to create codes for users without their signature
pub fn admin_create_referral_code_for_migration(
    ctx: Context<AdminCreateReferralCode>,
    code: String,
    owner: Pubkey,
) -> Result<()> {
    require!(
        ctx.accounts.authority.key() == ctx.accounts.referral_config.authority,
        ErrorCode::Unauthorized
    );

    // Validation
    require!(code.len() >= 6 && code.len() <= 12, ErrorCode::InvalidCodeFormat);
    require!(code.chars().all(|c| c.is_alphanumeric()), ErrorCode::InvalidCodeFormat);

    let referral_code = &mut ctx.accounts.referral_code;
    referral_code.code = code;
    referral_code.owner = owner;  // Different from signer (admin)
    referral_code.is_active = true;
    referral_code.total_referrals = 0;
    referral_code.bump = ctx.bumps.referral_code;

    msg!("Admin created referral code: {} for owner: {}", code, owner);

    Ok(())
}

#[derive(Accounts)]
#[instruction(code: String)]
pub struct AdminCreateReferralCode<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ReferralCode::LEN,
        seeds = [b"referral_code", code.as_bytes()],
        bump
    )]
    pub referral_code: Account<'info, ReferralCode>,

    #[account(
        seeds = [b"referral_config"],
        bump = referral_config.bump,
        has_one = authority
    )]
    pub referral_config: Account<'info, ReferralConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

#### 3.2 Create Migration Script

**File**: `scripts/migrate-to-devnet.ts`

```typescript
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { ReferralSystem } from '../target/types/referral_system'
import fs from 'fs'

async function migrateToDevnet() {
  // Load exported data
  const exportData = JSON.parse(fs.readFileSync('data/migration-export.json', 'utf8'))

  console.log(`🚀 Migrating ${exportData.validCodes.length} codes to devnet...`)

  const results = {
    success: [],
    failed: [],
  }

  // Migrate referral codes
  for (const [index, codeData] of exportData.validCodes.entries()) {
    try {
      const ownerPubkey = new PublicKey(codeData.owner)
      const [referralCodePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('referral_code'), Buffer.from(codeData.code)],
        program.programId,
      )

      console.log(`[${index + 1}/${exportData.validCodes.length}] Creating: ${codeData.code}`)

      const tx = await program.methods
        .adminCreateReferralCodeForMigration(codeData.code, ownerPubkey)
        .accounts({
          referralCode: referralCodePDA,
          referralConfig: referralConfigPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      results.success.push({ code: codeData.code, tx })
      console.log(`  ✅ TX: ${tx.slice(0, 8)}...`)

      await sleep(500) // Rate limiting
    } catch (error) {
      results.failed.push({ code: codeData.code, error: error.message })
      console.log(`  ❌ ${error.message}`)
    }
  }

  // Save results
  fs.writeFileSync('data/migration-results.json', JSON.stringify(results, null, 2))

  console.log(`\n📊 Migration Complete:`)
  console.log(`  ✅ Success: ${results.success.length}`)
  console.log(`  ❌ Failed: ${results.failed.length}`)

  // Calculate costs
  const rentCost = results.success.length * 0.001 // SOL per code
  console.log(`\n💰 Cost: ${rentCost} SOL`)
}
```

#### 3.3 Cost Calculation

```typescript
const RENT_PER_CODE = 0.001 // SOL
const RENT_PER_USER = 0.002 // SOL
const TX_FEE = 0.000005 // SOL

function calculateMigrationCost(numCodes: number, numUsers: number) {
  const rentCost = numCodes * RENT_PER_CODE + numUsers * RENT_PER_USER
  const feesCost = (numCodes + numUsers) * TX_FEE
  const totalSOL = rentCost + feesCost
  const totalUSD = totalSOL * 200 // Assuming $200/SOL

  return {
    codes: numCodes * RENT_PER_CODE,
    users: numUsers * RENT_PER_USER,
    fees: feesCost,
    totalSOL,
    totalUSD,
  }
}
```

### Phase 4: Frontend Migration (Week 3-5)

#### 4.1 Add Solana Dependencies

```json
// package.json additions
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.32.1",
    "@solana/spl-token": "^0.3.8"
  }
}
```

#### 4.2 Create On-Chain Client

**File**: `src/features/referral/lib/on-chain-client.ts`

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import ReferralSystemIDL from './referral_system.json'

const REFERRAL_PROGRAM_ID = new PublicKey('AN2rCmWzkPZUpnbJ2uJkAkay51CVZvQiCUJKVGpMm2cL')

export function useReferralProgram() {
  const wallet = useWallet()
  const connection = new Connection(process.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com')

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: 'confirmed',
  })

  const program = new Program(ReferralSystemIDL, REFERRAL_PROGRAM_ID, provider)

  return { program, connection }
}

// PDA Utilities
export function getReferralCodePDA(code: string) {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('referral_code'), Buffer.from(code)], REFERRAL_PROGRAM_ID)
  return pda
}

export function getUserRegistrationPDA(userPubkey: PublicKey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_registration'), userPubkey.toBuffer()],
    REFERRAL_PROGRAM_ID,
  )
  return pda
}

export function getReferralConfigPDA() {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('referral_config')], REFERRAL_PROGRAM_ID)
  return pda
}
```

#### 4.3 Replace API Calls with Transactions

**Create Referral Code Hook**:

```typescript
// src/features/referral/hooks/use-create-code.ts
import { useMutation } from '@tanstack/react-query'
import { useReferralProgram, getReferralCodePDA } from '../lib/on-chain-client'
import { SystemProgram } from '@solana/web3.js'

export function useCreateReferralCode() {
  const { program } = useReferralProgram()
  const wallet = useWallet()

  return useMutation({
    mutationFn: async (code: string) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const referralCodePDA = getReferralCodePDA(code)

      const tx = await program.methods
        .createReferralCode(code)
        .accounts({
          referralCode: referralCodePDA,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return { code, txSignature: tx }
    },
  })
}
```

**Bind Referral Code Hook**:

```typescript
// src/features/referral/hooks/use-bind-code.ts
export function useBindReferralCode() {
  const { program } = useReferralProgram()
  const wallet = useWallet()

  return useMutation({
    mutationFn: async (code: string) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const referralCodePDA = getReferralCodePDA(code)
      const userRegistrationPDA = getUserRegistrationPDA(wallet.publicKey)
      const referralConfigPDA = getReferralConfigPDA()

      // Note: Requires all Tessera Token accounts
      // This is a simplified example
      const tx = await program.methods
        .registerWithReferralCode()
        .accounts({
          referralCode: referralCodePDA,
          userRegistration: userRegistrationPDA,
          referralConfig: referralConfigPDA,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          // ... additional Tessera Token accounts
        })
        .rpc()

      return { code, txSignature: tx }
    },
  })
}
```

#### 4.4 Remove Old Code

Delete these files:

- `functions/api/referral/*` - All API endpoints
- `functions/api/auth/*` - Authentication endpoints
- `functions/lib/auth.ts` - Auth utilities
- `functions/lib/session.ts` - Session management
- `src/features/referral/hooks/use-referral-auth.ts` - Auth hooks
- `src/features/referral/lib/api-client.ts` - API client

#### 4.5 Query On-Chain Data

```typescript
// src/features/referral/hooks/use-query-data.ts

export function useQueryUserRegistration() {
  const wallet = useWallet()
  const { program } = useReferralProgram()

  return useQuery({
    queryKey: ['userRegistration', wallet.publicKey?.toString()],
    queryFn: async () => {
      if (!wallet.publicKey) return null

      const pda = getUserRegistrationPDA(wallet.publicKey)

      try {
        const account = await program.account.userRegistration.fetch(pda)
        return account
      } catch {
        return null // Account doesn't exist
      }
    },
    enabled: !!wallet.publicKey,
  })
}
```

### Phase 5: Remove Unsupported Features (Week 5)

#### Features to Remove

1. **Deactivate/Reactivate Codes** - Requires off-chain tracking
2. **Email Verification** - Not on-chain
3. **Display Names** - Just use wallet addresses
4. **Metrics Dashboard** - Query on-chain accounts instead
5. **Edit Referral Codes** - Immutable on-chain

#### Update UI Messaging

```typescript
<Alert>
  <InfoIcon />
  <AlertTitle>On-Chain Referrals</AlertTitle>
  <AlertDescription>
    Referral codes are stored on Solana blockchain and cannot be edited
    or deactivated. Choose your code carefully!
  </AlertDescription>
</Alert>
```

### Phase 6: Testing (Week 6-7)

#### 6.1 Local Devnet Testing

```bash
# Start local validator
solana-test-validator

# Run migration with sample data
bun run scripts/migrate-to-devnet.ts

# Test frontend
bun run dev
```

#### 6.2 Test Checklist

- [ ] Create referral code
- [ ] Register with referral code
- [ ] Query user registration
- [ ] Verify 3-tier chain construction
- [ ] Test with multiple users (A → B → C → D)
- [ ] Verify fee distribution percentages
- [ ] Test error cases (invalid code, duplicate code, etc.)

### Phase 7: Migration Day (Week 8)

#### 7.1 Pre-Migration

- [ ] Export final production data snapshot
- [ ] Deploy contracts to mainnet
- [ ] Test admin migration script on devnet with full data
- [ ] Announce migration to users (24hr notice)

#### 7.2 Migration Window

```
09:00 - Put site in maintenance mode
09:15 - Export final production data
09:30 - Run admin migration script on mainnet
10:30 - Verify all codes migrated successfully
11:00 - Deploy new frontend to production
11:15 - Remove maintenance mode
11:30 - Monitor for errors
```

#### 7.3 Rollback Plan

If migration fails:

1. Restore D1 database from backup
2. Redeploy old frontend
3. Announce delay
4. Investigate and fix issues
5. Reschedule migration

---

## 💰 Cost Estimate

**Estimated Migration Cost** (100 codes, 1000 users):

- Codes: 100 × 0.001 SOL = 0.1 SOL
- Users: 1000 × 0.002 SOL = 2 SOL
- Fees: 1100 × 0.000005 SOL = 0.0055 SOL
- **Total: ~2.1 SOL (~$420 at $200/SOL)**

**Ongoing Costs** (per 1000 new users/month):

- **~2 SOL/month (~$400/month)**

---

## 📅 Timeline

**Total: 8 weeks**

| Week | Phase                | Tasks                                             |
| ---- | -------------------- | ------------------------------------------------- |
| 1    | Data Export & Deploy | Export production data, deploy to devnet          |
| 2-3  | Admin Migration Tool | Add contract instruction, create migration script |
| 3-5  | Frontend Migration   | Replace API calls with Solana SDK                 |
| 5    | Remove Features      | Clean up unsupported functionality                |
| 6-7  | Testing              | Comprehensive testing on devnet/testnet           |
| 8    | Migration Day        | Production migration and monitoring               |

---

## ⚠️ Key Risks

### Risk 1: Code Format Incompatibility

**Impact**: Some existing codes may be < 6 chars
**Mitigation**: Contact users to update codes, document invalid codes

### Risk 2: Migration Script Failures

**Impact**: Incomplete migration
**Mitigation**: Batch operations, add retries, test thoroughly on devnet

### Risk 3: User Experience Degradation

**Impact**: Users confused by wallet signatures & costs
**Mitigation**: Clear UI messaging, cost display, onboarding tooltips

### Risk 4: High Migration Costs

**Impact**: Unexpected SOL costs
**Mitigation**: Calculate exact costs before migration, budget appropriately

---

## 🎯 Success Metrics

### Migration Success

- [ ] 100% of valid codes migrated
- [ ] 100% of user bindings migrated
- [ ] 3-tier chains correctly reconstructed
- [ ] Zero data loss

### Post-Migration (Week 1)

- [ ] > 80% users successfully create codes
- [ ] > 80% users successfully bind codes
- [ ] Average transaction time < 2 seconds
- [ ] Error rate < 5%

### Post-Migration (Month 1)

- [ ] On-chain fee distribution working
- [ ] No critical bugs
- [ ] User adoption stable/growing

---

## 📁 Project Structure

```
Tessera/
├── MIGRATION_PLAN.md           # This file
├── scripts/
│   ├── export-production-data.ts    # Read-only export
│   └── migrate-to-devnet.ts        # Migration script
├── data/                       # Git-ignored
│   ├── migration-export.json       # Exported data
│   └── migration-results.json      # Migration results
├── src/features/referral/
│   ├── lib/
│   │   └── on-chain-client.ts     # Solana SDK client
│   └── hooks/
│       ├── use-create-code.ts     # Create code mutation
│       ├── use-bind-code.ts       # Bind code mutation
│       └── use-query-data.ts      # Query on-chain data
└── .env.migration              # Migration env vars

tessera-on-solana/
└── programs/referral-system/src/
    └── lib.rs                  # Add admin instruction
```

---

## 🚦 Status Updates

### 2025-10-30

- ✅ Created feature branch `feature/on-chain-migration`
- ✅ Documented complete migration plan
- 🚧 Next: Create data export script

---

## 📞 Contacts & Resources

- **Solana RPC**: https://api.devnet.solana.com
- **Program IDs**:
  - Tessera Token: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`
  - Referral System: `AN2rCmWzkPZUpnbJ2uJkAkay51CVZvQiCUJKVGpMm2cL`
- **Contract Repository**: `/Users/kylefang/Projects/alex/tessera-on-solana`

---

## ✅ Next Steps

1. Review this plan with team
2. Create data directory and export script
3. Add admin instruction to contract
4. Begin Phase 1: Data export

**Ready to proceed with implementation!**
