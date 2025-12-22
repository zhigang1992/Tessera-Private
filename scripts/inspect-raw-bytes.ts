/**
 * Inspect Raw Account Bytes
 *
 * Fetches and displays the raw bytes of a referral code account
 */

import { Connection, PublicKey } from '@solana/web3.js'

const PROGRAM_ID = new PublicKey('5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog')
const RPC_ENDPOINT = 'https://api.devnet.solana.com'

async function inspectAccount(code: string) {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed')

  const [codePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('referral_code'), Buffer.from(code)],
    PROGRAM_ID
  )

  console.log(`Code: ${code}`)
  console.log(`PDA: ${codePDA.toBase58()}`)
  console.log('='.repeat(80))

  const accountInfo = await connection.getAccountInfo(codePDA)
  if (!accountInfo) {
    console.log('Account not found')
    return
  }

  const data = accountInfo.data
  console.log(`Account size: ${data.length} bytes`)
  console.log()

  // Show hex dump
  console.log('Hex Dump:')
  for (let i = 0; i < data.length; i += 16) {
    const chunk = data.slice(i, Math.min(i + 16, data.length))
    const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(chunk).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('')
    console.log(`${i.toString().padStart(4, '0')}: ${hex.padEnd(48, ' ')} | ${ascii}`)
  }
  console.log()

  // Manual parsing
  console.log('Field Breakdown:')
  let offset = 0

  // Discriminator
  const discriminator = data.slice(offset, offset + 8)
  console.log(`[${offset.toString().padStart(3, ' ')}-${(offset + 7).toString().padStart(3, ' ')}] Discriminator: [${Array.from(discriminator).join(', ')}]`)
  offset += 8

  // Code (String: u32 length + bytes)
  const codeLen = data.readUInt32LE(offset)
  console.log(`[${offset.toString().padStart(3, ' ')}-${(offset + 3).toString().padStart(3, ' ')}] Code length (u32): ${codeLen}`)
  offset += 4

  const codeBytes = data.slice(offset, offset + codeLen)
  console.log(`[${offset.toString().padStart(3, ' ')}-${(offset + codeLen - 1).toString().padStart(3, ' ')}] Code bytes: "${codeBytes.toString('utf8')}"`)

  // Show what's after code bytes until offset + 12
  const paddingStart = offset + codeLen
  const codeFieldEnd = offset + 12
  if (paddingStart < codeFieldEnd) {
    const padding = data.slice(paddingStart, codeFieldEnd)
    console.log(`[${paddingStart.toString().padStart(3, ' ')}-${(codeFieldEnd - 1).toString().padStart(3, ' ')}] Padding: [${Array.from(padding).join(', ')}]`)
  }
  offset += 12

  // Owner (Pubkey: 32 bytes)
  const ownerBytes = data.slice(offset, offset + 32)
  const owner = new PublicKey(ownerBytes)
  console.log(`[${offset.toString().padStart(3, ' ')}-${(offset + 31).toString().padStart(3, ' ')}] Owner (Pubkey): ${owner.toBase58()}`)
  offset += 32

  // is_active (bool: 1 byte)
  const isActive = data[offset]
  console.log(`[${offset.toString().padStart(3, ' ')}] is_active (bool): ${isActive} (${isActive === 1 ? 'true' : 'false'})`)
  offset += 1

  // total_referrals (u32: 4 bytes)
  const totalReferrals = data.readUInt32LE(offset)
  console.log(`[${offset.toString().padStart(3, ' ')}-${(offset + 3).toString().padStart(3, ' ')}] total_referrals (u32): ${totalReferrals}`)
  offset += 4

  // bump (u8: 1 byte)
  const bump = data[offset]
  console.log(`[${offset.toString().padStart(3, ' ')}] bump (u8): ${bump}`)
  offset += 1

  console.log()
  console.log(`Total parsed: ${offset} bytes (Account size: ${data.length} bytes)`)
}

async function main() {
  await inspectAccount('N2M3QQQW')
  console.log('\n\n')
  await inspectAccount('TEST2025')
}

main().catch(console.error)
