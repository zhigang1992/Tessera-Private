#!/usr/bin/env bun
/**
 * Generate test wallets for E2E testing with URL Key Wallet
 *
 * Usage:
 *   bun run scripts/generate-test-wallets.ts
 *   bun run scripts/generate-test-wallets.ts --count 5
 *   bun run scripts/generate-test-wallets.ts --airdrop
 *   bun run scripts/generate-test-wallets.ts --save ./test-wallets.json
 *
 * Output formats for each wallet:
 *   - Public key (address)
 *   - Secret key (base58) - for URL hash
 *   - Secret key (JSON array) - for Solana CLI
 *   - URL for testing
 */

import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'

const DEVNET_RPC = 'https://api.devnet.solana.com'
const LOCAL_APP_URL = 'http://localhost:6173'

interface TestWallet {
  publicKey: string
  secretKeyBase58: string
  secretKeyArray: number[]
  testUrl: string
}

function generateWallet(): TestWallet {
  const keypair = Keypair.generate()
  const secretKeyBase58 = bs58.encode(keypair.secretKey)

  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKeyBase58,
    secretKeyArray: Array.from(keypair.secretKey),
    testUrl: `${LOCAL_APP_URL}/referral#${secretKeyBase58}`,
  }
}

async function airdropSol(publicKey: string, amount: number = 2): Promise<boolean> {
  const connection = new Connection(DEVNET_RPC, 'confirmed')

  try {
    const signature = await connection.requestAirdrop(
      Keypair.fromSecretKey(bs58.decode(publicKey)).publicKey,
      amount * LAMPORTS_PER_SOL,
    )
    // Note: We're just requesting, not waiting for confirmation
    console.log(`  Airdrop requested: ${signature.slice(0, 20)}...`)
    return true
  } catch (error) {
    // Airdrop often fails due to rate limits
    console.log(`  Airdrop failed (rate limited?): ${error}`)
    return false
  }
}

async function airdropToWallet(wallet: TestWallet, amount: number = 2): Promise<boolean> {
  const connection = new Connection(DEVNET_RPC, 'confirmed')

  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(wallet.secretKeyBase58))
    const signature = await connection.requestAirdrop(keypair.publicKey, amount * LAMPORTS_PER_SOL)

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed')
    console.log(`  Airdrop confirmed: ${signature.slice(0, 20)}...`)
    return true
  } catch (error) {
    console.log(`  Airdrop failed: ${error instanceof Error ? error.message : error}`)
    return false
  }
}

async function getBalance(publicKey: string): Promise<number> {
  const connection = new Connection(DEVNET_RPC, 'confirmed')
  try {
    const balance = await connection.getBalance(Keypair.fromSecretKey(bs58.decode(publicKey)).publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch {
    return 0
  }
}

function parseArgs(): { count: number; airdrop: boolean; savePath?: string } {
  const args = process.argv.slice(2)
  let count = 3
  let airdrop = false
  let savePath: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--airdrop') {
      airdrop = true
    } else if (args[i] === '--save' && args[i + 1]) {
      savePath = args[i + 1]
      i++
    }
  }

  return { count, airdrop, savePath }
}

async function main() {
  const { count, airdrop, savePath } = parseArgs()

  console.log('\n=== Test Wallet Generator for URL Key Wallet ===\n')
  console.log(`Generating ${count} wallet(s)...\n`)

  const wallets: TestWallet[] = []

  for (let i = 0; i < count; i++) {
    const wallet = generateWallet()
    wallets.push(wallet)

    console.log(`--- Wallet ${i + 1} ---`)
    console.log(`Public Key:  ${wallet.publicKey}`)
    console.log(`Secret (b58): ${wallet.secretKeyBase58}`)
    console.log(`Test URL:    ${wallet.testUrl}`)

    if (airdrop) {
      console.log(`Requesting airdrop...`)
      await airdropToWallet(wallet)
    }

    console.log('')
  }

  // Save to file if requested
  if (savePath) {
    const output = {
      generated: new Date().toISOString(),
      network: 'devnet',
      appUrl: LOCAL_APP_URL,
      wallets: wallets.map((w) => ({
        publicKey: w.publicKey,
        secretKeyBase58: w.secretKeyBase58,
        secretKeyArray: w.secretKeyArray,
        testUrl: w.testUrl,
      })),
    }

    await Bun.write(savePath, JSON.stringify(output, null, 2))
    console.log(`Saved to: ${savePath}`)
  }

  // Print usage instructions
  console.log('\n=== Usage Instructions ===\n')
  console.log('1. Start the dev server:')
  console.log('   bun run dev\n')
  console.log('2. Open a test URL in your browser (the secret key auto-connects):')
  console.log(`   ${wallets[0].testUrl}\n`)
  console.log('3. For Playwright E2E tests, use the secret key:')
  console.log(`   await page.goto('${LOCAL_APP_URL}/referral#${wallets[0].secretKeyBase58}')\n`)
  console.log('4. To use with solana-keygen (CLI):')
  console.log(`   echo '${JSON.stringify(wallets[0].secretKeyArray)}' > /tmp/test-keypair.json`)
  console.log(`   solana-keygen pubkey /tmp/test-keypair.json\n`)

  if (!airdrop) {
    console.log('Tip: Run with --airdrop to fund wallets with devnet SOL:')
    console.log('   bun run scripts/generate-test-wallets.ts --airdrop\n')
  }
}

main().catch(console.error)
