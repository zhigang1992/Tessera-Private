/**
 * Test Anchor Serialization
 *
 * This script tests how Anchor serializes the ReferralCode struct
 */

import { PublicKey } from '@solana/web3.js'
import { BorshCoder } from '@coral-xyz/anchor'
import ReferralSystemIDL from '../src/lib/idl/referral_system.json'
import type { ReferralSystem } from '../src/generated/referral-system/types'

const coder = new BorshCoder(ReferralSystemIDL as any)

// Test data
const testData = {
  code: 'N2M3QQQW',
  owner: new PublicKey('CmJyB8PJqtgLtFAQd3NrX9uZdZTpZMCZNqJNBwv5cb5H'),
  isActive: true,
  totalReferrals: 0,
  bump: 254,
}

console.log('Testing Anchor Serialization')
console.log('='.repeat(80))
console.log('Test Data:', testData)
console.log()

// Encode using Anchor
const encoded = coder.accounts.encode('referralCode', testData)
console.log('Encoded length:', encoded.length)
console.log('Encoded hex:', encoded.toString('hex'))
console.log()

// Show byte-by-byte breakdown
console.log('Byte Breakdown:')
let offset = 0

// Discriminator
const discriminator = encoded.slice(offset, offset + 8)
console.log(`[${offset}-${offset + 7}] Discriminator: ${discriminator.toString('hex')} (${Array.from(discriminator)})`)
offset += 8

// Code (String)
const codeLen = encoded.readUInt32LE(offset)
console.log(`[${offset}-${offset + 3}] Code length: ${codeLen}`)
offset += 4

const codeBytes = encoded.slice(offset, offset + codeLen)
console.log(`[${offset}-${offset + codeLen - 1}] Code bytes: "${codeBytes.toString('utf8')}"`)

// Check what's in the padding area
const paddingStart = offset + codeLen
const paddingEnd = offset + 12
if (paddingStart < paddingEnd) {
  const padding = encoded.slice(paddingStart, paddingEnd)
  console.log(`[${paddingStart}-${paddingEnd - 1}] Padding: ${padding.toString('hex')} (${Array.from(padding)})`)
}
offset += 12

// Owner
const ownerBytes = encoded.slice(offset, offset + 32)
const owner = new PublicKey(ownerBytes)
console.log(`[${offset}-${offset + 31}] Owner: ${owner.toBase58()}`)
offset += 32

// is_active
const isActive = encoded[offset] === 1
console.log(`[${offset}] is_active: ${isActive} (byte: ${encoded[offset]})`)
offset += 1

// total_referrals
const totalReferrals = encoded.readUInt32LE(offset)
console.log(`[${offset}-${offset + 3}] total_referrals: ${totalReferrals}`)
offset += 4

// bump
const bump = encoded[offset]
console.log(`[${offset}] bump: ${bump}`)
offset += 1

console.log()
console.log('Total offset:', offset, 'Total length:', encoded.length)

// Now decode it back to verify
console.log()
console.log('='.repeat(80))
console.log('Decoding back:')
const decoded = coder.accounts.decode('referralCode', encoded)
console.log('Decoded:', {
  code: decoded.code,
  owner: decoded.owner.toBase58(),
  isActive: decoded.isActive,
  totalReferrals: decoded.totalReferrals,
  bump: decoded.bump,
})
