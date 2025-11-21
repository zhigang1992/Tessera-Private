/**
 * Initialize Treasury Config for Existing Mint
 *
 * This script initializes the treasury_config PDA for an existing mint
 * that was created before the treasury_config feature was added.
 */

import { Connection, PublicKey } from '@solana/web3.js'

const DEVNET_RPC = 'https://api.devnet.solana.com'
const TESSERA_TOKEN_PROGRAM_ID = new PublicKey('TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf')
const MINT_ADDRESS = new PublicKey('A8xxQEFytK4DS7F8fGh4uWf56TFrYg2Jynmay2dd8SbS')

async function main() {
  console.log('🏦 Initializing Treasury Config\n')

  const connection = new Connection(DEVNET_RPC, 'confirmed')
  const tesseraTokenProgramId = TESSERA_TOKEN_PROGRAM_ID
  const mint = MINT_ADDRESS

  console.log('Program ID:', tesseraTokenProgramId.toBase58())
  console.log('Mint:', mint.toBase58())
  console.log()

  // Derive treasury config PDA
  const [treasuryConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('treasury_config'), mint.toBuffer()],
    tesseraTokenProgramId
  )

  console.log('Treasury Config PDA:', treasuryConfigPDA.toBase58())
  console.log()

  // Check if already initialized
  const accountInfo = await connection.getAccountInfo(treasuryConfigPDA)

  if (accountInfo) {
    console.log('✅ Treasury config already initialized!')
    console.log('   Owner:', accountInfo.owner.toBase58())
    console.log('   Lamports:', accountInfo.lamports)
    console.log('   Data Length:', accountInfo.data.length, 'bytes')
    return
  }

  console.log('❌ Treasury config NOT initialized')
  console.log()
  console.log('To initialize, you need to:')
  console.log('1. Go to the contract repository: /Users/kylefang/Projects/alex/tessera-on-solana')
  console.log('2. Run the initialize_treasury_config instruction with the deployer wallet')
  console.log()
  console.log('Or create a new test mint with:')
  console.log('   cd /Users/kylefang/Projects/alex/tessera-on-solana')
  console.log('   pnpm tsx scripts/deploy/create-new-test-mint.ts')
  console.log()
  console.log('Then update the mint address in src/lib/solana/config.ts')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
