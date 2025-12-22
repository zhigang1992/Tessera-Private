/**
 * Check if current network mint has required configs initialized
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { getTesseraMintAddress, getTesseraTokenProgramId, getRpcEndpoint } from '@/lib/solana'

async function main() {
  console.log('🔍 Checking Mint Configuration\n')

  const mint = getTesseraMintAddress()
  const programId = getTesseraTokenProgramId()
  const rpcUrl = getRpcEndpoint()

  console.log('Configuration:')
  console.log(`  Mint: ${mint.toBase58()}`)
  console.log(`  Program: ${programId.toBase58()}`)
  console.log(`  RPC: ${rpcUrl}\n`)

  const connection = new Connection(rpcUrl, 'confirmed')

  // Check treasury_config PDA
  const [treasuryConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('treasury_config'), mint.toBuffer()],
    programId,
  )

  console.log(`Treasury Config PDA: ${treasuryConfigPDA.toBase58()}`)

  try {
    const treasuryAccount = await connection.getAccountInfo(treasuryConfigPDA)
    if (treasuryAccount) {
      console.log('✅ Treasury config initialized')
      console.log(`   Owner: ${treasuryAccount.owner.toBase58()}`)
      console.log(`   Lamports: ${treasuryAccount.lamports}`)
      console.log(`   Data Length: ${treasuryAccount.data.length} bytes\n`)
    } else {
      console.log('❌ Treasury config NOT initialized\n')
    }
  } catch (error) {
    console.log('❌ Treasury config NOT initialized\n')
  }

  // Check authorized_programs PDA (using authority from addresses.md)
  const authority = new PublicKey('9UHfCynABPyvSeqZfD3E6A3DPt1xfechkRa1xDm6ZRvY')
  const [authorizedProgramsPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('authorized_programs'), authority.toBuffer()],
    programId,
  )

  console.log(`Authorized Programs PDA: ${authorizedProgramsPDA.toBase58()}`)
  console.log(`  (using authority: ${authority.toBase58()})`)

  try {
    const authAccount = await connection.getAccountInfo(authorizedProgramsPDA)
    if (authAccount) {
      console.log('✅ Authorized programs initialized')
      console.log(`   Owner: ${authAccount.owner.toBase58()}`)
      console.log(`   Lamports: ${authAccount.lamports}`)
      console.log(`   Data Length: ${authAccount.data.length} bytes`)
    } else {
      console.log('❌ Authorized programs NOT initialized')
    }
  } catch (error) {
    console.log('❌ Authorized programs NOT initialized')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
