/**
 * Verify Referral Config on Devnet
 *
 * This script checks if the referral config account exists and can be fetched
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import type { ReferralSystem } from '@/generated/referral-system/types'
import ReferralSystemIDL from '../src/lib/idl/referral_system.json'

const DEVNET_RPC = 'https://api.devnet.solana.com'
const REFERRAL_PROGRAM_ID = new PublicKey('5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog')

function getReferralConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('referral_config')], programId)
}

async function main() {
  console.log('🔍 Verifying Referral Config on Devnet\n')
  console.log('Program ID:', REFERRAL_PROGRAM_ID.toBase58())
  console.log('RPC Endpoint:', DEVNET_RPC)
  console.log()

  const connection = new Connection(DEVNET_RPC, 'confirmed')

  // Derive config PDA
  const [configPDA, bump] = getReferralConfigPDA(REFERRAL_PROGRAM_ID)
  console.log('Config PDA:', configPDA.toBase58())
  console.log('Bump:', bump)
  console.log()

  // Check if account exists
  console.log('Checking if account exists...')
  const accountInfo = await connection.getAccountInfo(configPDA)

  if (!accountInfo) {
    console.log('❌ Config account does NOT exist')
    console.log('   The referral config needs to be initialized first')
    console.log('   Run: cd /Users/kylefang/Projects/alex/tessera-on-solana && pnpm run initialize-referral')
    process.exit(1)
  }

  console.log('✅ Config account exists')
  console.log('   Owner:', accountInfo.owner.toBase58())
  console.log('   Lamports:', accountInfo.lamports)
  console.log('   Data Length:', accountInfo.data.length, 'bytes')
  console.log()

  // Try to deserialize with Anchor
  console.log('Attempting to deserialize with Anchor...')
  try {
    const readOnlyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    }

    const provider = new AnchorProvider(connection, readOnlyWallet as any, {
      commitment: 'confirmed',
    })

    const program = new Program<ReferralSystem>(
      ReferralSystemIDL as ReferralSystem,
      provider
    )

    const config = await program.account.referralConfig.fetch(configPDA)

    console.log('✅ Successfully deserialized config:')
    console.log('   Authority:', (config.authority as PublicKey).toBase58())
    console.log('   Token Program:', (config.tesseraTokenProgram as PublicKey).toBase58())
    console.log('   Default Fee Reduction:', (config as any).defaultFeeReductionPercentage, '(percentage)')
    console.log('   Tier 1 Split:', (config as any).tier1SplitPercentage, '%')
    console.log('   Tier 2 Split:', (config as any).tier2SplitPercentage, '%')
    console.log('   Tier 3 Split:', (config as any).tier3SplitPercentage, '%')
    console.log('   Bump:', config.bump)
    console.log()
    console.log('🎉 Config is valid and can be fetched!')

  } catch (error) {
    console.log('❌ Failed to deserialize config:')
    console.log('   Error:', error instanceof Error ? error.message : String(error))
    console.log()
    console.log('   This might indicate:')
    console.log('   1. Account has wrong discriminator (wrong account type)')
    console.log('   2. Account data structure doesn\'t match IDL')
    console.log('   3. Account is corrupted')
    console.log()

    // Try manual inspection
    console.log('Manual inspection of account data:')
    const discriminator = accountInfo.data.slice(0, 8)
    console.log('   Discriminator (first 8 bytes):', Buffer.from(discriminator).toString('hex'))

    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
