/**
 * Diagnostic Script: Check Referral Code Memory Layout
 *
 * This script checks if a referral code can be properly deserialized by Anchor.
 * Codes created with admin_create_referral_code (old single method) have wrong layout.
 * Codes created with admin_batch_create_referral_codes have correct layout.
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import ReferralSystemIDL from '../src/lib/idl/referral_system.json'
import type { ReferralSystem } from '../src/generated/referral-system/types'

const PROGRAM_ID = new PublicKey('5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog')
const RPC_ENDPOINT = 'https://api.devnet.solana.com'

function getReferralCodePDA(code: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('referral_code'), Buffer.from(code)],
    PROGRAM_ID
  )
}

async function checkCodeLayout(connection: Connection, program: Program<ReferralSystem>, code: string) {
  const [codePDA] = getReferralCodePDA(code)

  console.log(`\nChecking code: "${code}"`)
  console.log(`  PDA: ${codePDA.toBase58()}`)

  // Method 1: Try Anchor's auto-deserializer
  let anchorWorks = false
  try {
    const codeAccount = await program.account.referralCode.fetch(codePDA)
    console.log(`  ✅ Anchor deserialize: SUCCESS`)
    console.log(`     - Code: ${codeAccount.code}`)
    console.log(`     - Owner: ${codeAccount.owner.toBase58()}`)
    console.log(`     - Active: ${codeAccount.isActive}`)
    console.log(`     - Referrals: ${codeAccount.totalReferrals}`)
    anchorWorks = true
  } catch (err) {
    console.log(`  ❌ Anchor deserialize: FAILED`)
    console.log(`     Error: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Method 2: Try manual deserialization
  let manualWorks = false
  try {
    const accountInfo = await connection.getAccountInfo(codePDA)
    if (!accountInfo) {
      console.log(`  ❌ Manual deserialize: Account not found`)
      return { code, anchorWorks, manualWorks, status: 'NOT_FOUND' }
    }

    const data = accountInfo.data

    // Verify discriminator
    const expectedDiscriminator = Buffer.from([227, 239, 247, 224, 128, 187, 44, 229])
    const actualDiscriminator = data.slice(0, 8)
    if (!expectedDiscriminator.equals(actualDiscriminator)) {
      console.log(`  ❌ Manual deserialize: Wrong discriminator`)
      return { code, anchorWorks, manualWorks, status: 'WRONG_DISCRIMINATOR' }
    }

    let offset = 8
    // Read code (String: u32 length + N bytes - variable length!)
    // IMPORTANT: Anchor serializes String as variable-length, not fixed 12 bytes
    const codeLen = data.readUInt32LE(offset)
    offset += 4
    const codeStr = data.slice(offset, offset + codeLen).toString('utf8')
    offset += codeLen // Variable length - only advance by actual string length

    const ownerBytes = data.slice(offset, offset + 32)
    const owner = new PublicKey(ownerBytes)
    offset += 32

    const isActive = data[offset] === 1
    offset += 1

    const totalReferrals = data.readUInt32LE(offset)

    console.log(`  ✅ Manual deserialize: SUCCESS`)
    console.log(`     - Code: ${codeStr}`)
    console.log(`     - Owner: ${owner.toBase58()}`)
    console.log(`     - Active: ${isActive}`)
    console.log(`     - Referrals: ${totalReferrals}`)
    manualWorks = true
  } catch (err) {
    console.log(`  ❌ Manual deserialize: FAILED`)
    console.log(`     Error: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Determine status
  let status: string
  if (anchorWorks && manualWorks) {
    status = 'CORRECT_LAYOUT'
  } else if (!anchorWorks && manualWorks) {
    status = 'WRONG_LAYOUT'
  } else if (!anchorWorks && !manualWorks) {
    status = 'CORRUPTED'
  } else {
    status = 'UNKNOWN'
  }

  console.log(`  Status: ${status}`)

  return { code, anchorWorks, manualWorks, status }
}

async function main() {
  const codesToCheck = process.argv.slice(2)

  if (codesToCheck.length === 0) {
    console.log('Usage: bun run scripts/check-code-layout.ts <CODE1> [CODE2] ...')
    console.log('Example: bun run scripts/check-code-layout.ts 3XGLJF3V B7VTTTAN BY94M2RB')
    process.exit(1)
  }

  const connection = new Connection(RPC_ENDPOINT, 'confirmed')
  const provider = new AnchorProvider(
    connection,
    {} as any,
    { commitment: 'confirmed' }
  )
  const program = new Program<ReferralSystem>(
    ReferralSystemIDL as ReferralSystem,
    provider
  )

  console.log('='.repeat(80))
  console.log('Referral Code Layout Checker')
  console.log('='.repeat(80))
  console.log(`RPC: ${RPC_ENDPOINT}`)
  console.log(`Program: ${PROGRAM_ID.toBase58()}`)

  const results = []
  for (const code of codesToCheck) {
    const result = await checkCodeLayout(connection, program, code)
    results.push(result)
  }

  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))

  const correctLayout = results.filter(r => r.status === 'CORRECT_LAYOUT')
  const wrongLayout = results.filter(r => r.status === 'WRONG_LAYOUT')
  const notFound = results.filter(r => r.status === 'NOT_FOUND')
  const corrupted = results.filter(r => r.status === 'CORRUPTED')

  console.log(`Total checked: ${results.length}`)
  console.log(`✅ Correct layout (can be used): ${correctLayout.length}`)
  console.log(`❌ Wrong layout (MUST recreate): ${wrongLayout.length}`)
  console.log(`⚠️  Not found: ${notFound.length}`)
  console.log(`💥 Corrupted: ${corrupted.length}`)

  if (wrongLayout.length > 0) {
    console.log('\n⚠️  Codes with WRONG LAYOUT (must be recreated):')
    wrongLayout.forEach(r => console.log(`   - ${r.code}`))
  }

  if (notFound.length > 0) {
    console.log('\n⚠️  Codes NOT FOUND:')
    notFound.forEach(r => console.log(`   - ${r.code}`))
  }
}

main().catch(console.error)
