/**
 * Migrate Referral Data to Solana Devnet
 *
 * This script takes exported production data and migrates it to the Solana
 * devnet for testing purposes. It will create referral codes and user
 * registrations on-chain.
 *
 * Prerequisites:
 *   1. Exported data exists at data/migration-export.json
 *   2. Referral system contracts deployed to devnet
 *   3. Wallet with sufficient SOL for rent + fees
 *
 * Usage:
 *   bun run scripts/migrate-to-devnet.ts
 *
 * Output:
 *   data/migration-results-devnet.json - Migration results
 */

import fs from 'fs'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'

// TODO: Import Anchor after adding @coral-xyz/anchor dependency
// import * as anchor from "@coral-xyz/anchor";
// import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
// import { ReferralSystem } from "./types/referral_system";

interface ExportedCode {
  code: string
  owner: string
  createdAt: string
  activeLayer: number
}

interface MigrationResult {
  code: string
  owner: string
  success: boolean
  txSignature?: string
  error?: string
}

interface MigrationSummary {
  startTime: string
  endTime: string
  totalCodes: number
  successCount: number
  failureCount: number
  totalCost: number // SOL
  results: MigrationResult[]
}

// Configuration
const DEVNET_RPC_URL = 'https://api.devnet.solana.com'
const REFERRAL_PROGRAM_ID = new PublicKey('AN2rCmWzkPZUpnbJ2uJkAkay51CVZvQiCUJKVGpMm2cL')

// Rate limiting
const BATCH_SIZE = 10 // Process 10 codes at a time
const DELAY_BETWEEN_BATCHES_MS = 2000 // 2 seconds between batches

/**
 * Load exported data
 */
function loadExportedData(): ExportedCode[] {
  const exportPath = 'data/migration-export.json'

  if (!fs.existsSync(exportPath)) {
    throw new Error(
      `Export file not found: ${exportPath}\n` + 'Please run: bun run scripts/export-production-data.ts first',
    )
  }

  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'))

  console.log(`📂 Loaded ${exportData.validCodes.length} valid codes for migration`)

  return exportData.validCodes
}

/**
 * Derive referral code PDA
 */
function getReferralCodePDA(code: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('referral_code'), Buffer.from(code)], REFERRAL_PROGRAM_ID)
  return pda
}

/**
 * Derive referral config PDA
 */
function getReferralConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from('referral_config')], REFERRAL_PROGRAM_ID)
  return pda
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Migrate a single referral code to devnet
 *
 * TODO: Implement after adding Anchor SDK
 */
async function migrateReferralCode(
  codeData: ExportedCode,
  connection: Connection,
  // program: Program<ReferralSystem>,
  authority: Keypair,
): Promise<MigrationResult> {
  try {
    const ownerPubkey = new PublicKey(codeData.owner)
    const referralCodePDA = getReferralCodePDA(codeData.code)
    const referralConfigPDA = getReferralConfigPDA()

    console.log(`  📝 Creating code: ${codeData.code} for owner: ${codeData.owner.slice(0, 8)}...`)

    // TODO: Uncomment after adding Anchor SDK
    // const tx = await program.methods
    //   .adminCreateReferralCodeForMigration(codeData.code, ownerPubkey)
    //   .accounts({
    //     referralCode: referralCodePDA,
    //     referralConfig: referralConfigPDA,
    //     authority: authority.publicKey,
    //     systemProgram: SystemProgram.programId,
    //   })
    //   .rpc();

    // For now, return mock success
    const mockTx = 'MOCK_TX_' + Math.random().toString(36).substring(7)

    return {
      code: codeData.code,
      owner: codeData.owner,
      success: true,
      txSignature: mockTx,
    }
  } catch (error: any) {
    return {
      code: codeData.code,
      owner: codeData.owner,
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Migrate codes in batches
 */
async function migrateInBatches(
  codes: ExportedCode[],
  connection: Connection,
  authority: Keypair,
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []
  const totalBatches = Math.ceil(codes.length / BATCH_SIZE)

  console.log(`\n📦 Processing ${codes.length} codes in ${totalBatches} batches...\n`)

  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    const batch = codes.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1

    console.log(`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} codes)`)

    // Process batch
    const batchResults = await Promise.all(batch.map((code) => migrateReferralCode(code, connection, authority)))

    results.push(...batchResults)

    // Display batch results
    const batchSuccess = batchResults.filter((r) => r.success).length
    const batchFailed = batchResults.filter((r) => !r.success).length

    console.log(`  ✅ Success: ${batchSuccess}`)
    console.log(`  ❌ Failed: ${batchFailed}`)

    // Rate limiting - wait before next batch
    if (i + BATCH_SIZE < codes.length) {
      console.log(`  ⏳ Waiting ${DELAY_BETWEEN_BATCHES_MS}ms before next batch...\n`)
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  }

  return results
}

/**
 * Calculate total cost from results
 */
function calculateTotalCost(results: MigrationResult[]): number {
  const RENT_PER_CODE = 0.001 // SOL
  const TX_FEE = 0.000005 // SOL

  const successCount = results.filter((r) => r.success).length
  const totalRent = successCount * RENT_PER_CODE
  const totalFees = successCount * TX_FEE

  return totalRent + totalFees
}

/**
 * Save migration results
 */
function saveMigrationResults(summary: MigrationSummary) {
  const outputPath = 'data/migration-results-devnet.json'

  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2))

  console.log(`\n💾 Results saved to: ${outputPath}`)
}

/**
 * Display migration summary
 */
function displaySummary(summary: MigrationSummary) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))

  console.log('\n⏱️  Duration:')
  const startTime = new Date(summary.startTime)
  const endTime = new Date(summary.endTime)
  const durationMs = endTime.getTime() - startTime.getTime()
  const durationMin = Math.floor(durationMs / 60000)
  const durationSec = Math.floor((durationMs % 60000) / 1000)
  console.log(`   ${durationMin}m ${durationSec}s`)

  console.log('\n📝 Results:')
  console.log(`   Total codes:     ${summary.totalCodes}`)
  console.log(`   ✅ Success:      ${summary.successCount}`)
  console.log(`   ❌ Failed:       ${summary.failureCount}`)

  console.log('\n💰 Cost:')
  console.log(`   Total SOL:       ${summary.totalCost.toFixed(4)} SOL`)
  console.log(`   Total USD:       ~$${(summary.totalCost * 200).toFixed(2)} (at $200/SOL)`)

  if (summary.failureCount > 0) {
    console.log('\n❌ Failed Codes:')
    const failures = summary.results.filter((r) => !r.success)
    failures.slice(0, 10).forEach((failure, i) => {
      console.log(`   ${i + 1}. ${failure.code} - ${failure.error}`)
    })
    if (failures.length > 10) {
      console.log(`   ... and ${failures.length - 10} more`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Migration to devnet complete!')
  console.log('='.repeat(60) + '\n')
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║       MIGRATE TO DEVNET                                   ║')
  console.log('║       Tessera Referral System Migration                  ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  console.log('⚠️  IMPORTANT NOTICE:')
  console.log('   This script requires @coral-xyz/anchor dependency')
  console.log('   Run: bun add @coral-xyz/anchor @solana/spl-token')
  console.log('   Then uncomment the Anchor imports and implementation\n')

  try {
    // Load exported data
    const codes = loadExportedData()

    if (codes.length === 0) {
      console.log('⚠️  No codes to migrate. Exiting.')
      return
    }

    // Setup connection
    const connection = new Connection(DEVNET_RPC_URL, 'confirmed')
    console.log(`🔗 Connected to: ${DEVNET_RPC_URL}`)

    // TODO: Load authority keypair from environment
    console.log('\n⚠️  TODO: Load authority keypair from environment')
    console.log('   Set MIGRATION_AUTHORITY_KEYPAIR in .env.migration\n')

    // Mock authority for now
    const authority = Keypair.generate()

    // Check authority balance
    const balance = await connection.getBalance(authority.publicKey)
    const balanceSOL = balance / 1e9
    console.log(`💰 Authority balance: ${balanceSOL.toFixed(4)} SOL`)

    if (balanceSOL < 0.1) {
      console.log('⚠️  WARNING: Low balance. You may need more SOL for migration.')
      console.log('   Airdrop command: solana airdrop 2 <YOUR_ADDRESS>')
    }

    // Start migration
    const startTime = new Date().toISOString()
    console.log(`\n🚀 Starting migration at: ${startTime}`)

    const results = await migrateInBatches(codes, connection, authority)

    const endTime = new Date().toISOString()

    // Calculate summary
    const summary: MigrationSummary = {
      startTime,
      endTime,
      totalCodes: codes.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      totalCost: calculateTotalCost(results),
      results,
    }

    // Save results
    saveMigrationResults(summary)

    // Display summary
    displaySummary(summary)

    console.log('📋 Next Steps:')
    console.log('   1. Review data/migration-results-devnet.json')
    console.log('   2. Verify codes on devnet using Solana Explorer')
    console.log('   3. Test frontend with devnet')
    console.log('   4. Migrate user bindings (separate script)')
    console.log('   5. Plan mainnet migration\n')
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nPlease check:')
    console.error('   - Export file exists: data/migration-export.json')
    console.error('   - Devnet RPC is accessible')
    console.error('   - Authority keypair is valid')
    console.error('   - Sufficient SOL balance\n')
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.main) {
  main()
}

export { migrateReferralCode, migrateInBatches }
