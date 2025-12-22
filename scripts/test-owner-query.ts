/**
 * Test Script: Query referral codes by owner
 *
 * Tests the getProgramAccounts query with memcmp filter
 */

import { Connection, PublicKey } from '@solana/web3.js'

const PROGRAM_ID = new PublicKey('5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog')
const RPC_ENDPOINT = 'https://api.devnet.solana.com'
const OWNER = 'CmJyB8PJqtgLtFAQd3NrX9uZdZTpZMCZNqJNBwv5cb5H'

async function main() {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed')
  const ownerPubkey = new PublicKey(OWNER)

  console.log('='.repeat(80))
  console.log('Testing getProgramAccounts with memcmp filter')
  console.log('='.repeat(80))
  console.log(`Program: ${PROGRAM_ID.toBase58()}`)
  console.log(`Owner: ${ownerPubkey.toBase58()}`)
  console.log()

  // Query with filters (same as use-referral-onchain.ts)
  console.log('🔍 Query 1: With discriminator + owner filters (offset 24)')
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          // Filter by account discriminator (ReferralCode)
          memcmp: {
            offset: 0,
            bytes: 'f8H8SWXTmJC', // base58 of [227, 239, 247, 224, 128, 187, 44, 229]
          },
        },
        {
          // Filter by owner pubkey at offset 24
          memcmp: {
            offset: 24,
            bytes: ownerPubkey.toBase58(),
          },
        },
      ],
    })

    console.log(`   Found ${accounts.length} accounts`)

    for (const { pubkey, account } of accounts) {
      const data = account.data
      let offset = 8

      // Read code
      const codeLen = data.readUInt32LE(offset)
      offset += 4
      const code = data.slice(offset, offset + codeLen).toString('utf8')
      offset += codeLen // Variable-length String

      // Read owner
      const ownerBytes = data.slice(offset, offset + 32)
      const owner = new PublicKey(ownerBytes)

      console.log(`   - PDA: ${pubkey.toBase58()}`)
      console.log(`     Code: ${code}`)
      console.log(`     Owner: ${owner.toBase58()}`)
    }
  } catch (err) {
    console.error(`   ❌ Error:`, err)
  }

  console.log()

  // Query without owner filter to see all codes
  console.log('🔍 Query 2: Only discriminator filter (no owner)')
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          // Filter by account discriminator (ReferralCode)
          memcmp: {
            offset: 0,
            bytes: 'f8H8SWXTmJC',
          },
        },
      ],
    })

    console.log(`   Found ${accounts.length} accounts total`)

    // Find N2M3QQQW specifically
    for (const { pubkey, account } of accounts) {
      const data = account.data
      let offset = 8

      const codeLen = data.readUInt32LE(offset)
      offset += 4
      const code = data.slice(offset, offset + codeLen).toString('utf8')
      offset += codeLen // Variable-length String

      const ownerBytes = data.slice(offset, offset + 32)
      const owner = new PublicKey(ownerBytes)

      if (code === 'N2M3QQQW') {
        console.log(`   ✅ Found N2M3QQQW:`)
        console.log(`      PDA: ${pubkey.toBase58()}`)
        console.log(`      Owner: ${owner.toBase58()}`)
        console.log(`      Matches expected owner: ${owner.equals(ownerPubkey)}`)
      }
    }
  } catch (err) {
    console.error(`   ❌ Error:`, err)
  }

  console.log()

  // Query by checking specific PDA directly
  console.log('🔍 Query 3: Direct PDA lookup for N2M3QQQW')
  try {
    const [codePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('referral_code'), Buffer.from('N2M3QQQW')],
      PROGRAM_ID
    )

    console.log(`   PDA: ${codePDA.toBase58()}`)

    const accountInfo = await connection.getAccountInfo(codePDA)
    if (accountInfo) {
      const data = accountInfo.data

      // Use correct variable-length parsing
      let offset = 8
      const codeLen = data.readUInt32LE(offset)
      offset += 4
      const code = data.slice(offset, offset + codeLen).toString('utf8')
      offset += codeLen // Variable-length!

      const ownerBytes = data.slice(offset, offset + 32)
      const owner = new PublicKey(ownerBytes)

      console.log(`   ✅ Account exists`)
      console.log(`   Code: ${code}`)
      console.log(`   Owner (variable-length parsing): ${owner.toBase58()}`)
      console.log(`   Matches expected: ${owner.equals(ownerPubkey)}`)
    } else {
      console.log(`   ❌ Account not found`)
    }
  } catch (err) {
    console.error(`   ❌ Error:`, err)
  }
}

main().catch(console.error)
