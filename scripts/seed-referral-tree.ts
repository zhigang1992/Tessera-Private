#!/usr/bin/env bun
/**
 * Script to seed a 3-layer referral tree for testing
 * Creates multiple wallets and builds a referral hierarchy
 */

import { Keypair } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519';

const API_BASE = 'http://localhost:8788';

interface SessionToken {
  token: string;
  walletAddress: string;
}

// Helper to convert Uint8Array to base64
function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

// Authenticate a wallet and get session token
async function authenticate(keypair: Keypair): Promise<SessionToken> {
  const walletAddress = keypair.publicKey.toBase58();

  // Step 1: Get nonce
  const nonceResponse = await fetch(`${API_BASE}/api/auth/nonce?wallet=${walletAddress}`);
  const nonceData = await nonceResponse.json();

  console.log(`  📝 Got nonce for ${walletAddress.slice(0, 8)}...`);

  // Step 2: Sign the message
  const message = new TextEncoder().encode(nonceData.message);
  const signature = ed25519.sign(message, keypair.secretKey.slice(0, 32));

  // Step 3: Verify signature and get session token
  const verifyResponse = await fetch(`${API_BASE}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      nonce: nonceData.nonce,
      signature: toBase64(signature),
      timestamp: nonceData.issuedAt,
      signatureEncoding: 'base64',
    }),
  });

  const verifyData = await verifyResponse.json();

  if (!verifyResponse.ok) {
    throw new Error(`Auth failed: ${JSON.stringify(verifyData)}`);
  }

  console.log(`  ✅ Authenticated ${walletAddress.slice(0, 8)}...`);
  return { token: verifyData.token, walletAddress };
}

// Create a referral code
async function createCode(token: string, codeSlug: string, activeLayer: number = 3): Promise<void> {
  const response = await fetch(`${API_BASE}/api/referral/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ codeSlug, activeLayer }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Create code failed: ${JSON.stringify(data)}`);
  }

  console.log(`  📝 Created code: ${codeSlug}`);
}

// Bind to a referral code
async function bindToCode(token: string, referralCode: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/referral/trader/bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ referralCode }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Bind failed: ${JSON.stringify(data)}`);
  }

  console.log(`  🔗 Bound to code: ${referralCode}`);
}

// Get affiliate data to verify tree
async function getAffiliateData(token: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/referral/affiliate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

async function main() {
  console.log('🌳 Building 3-Layer Referral Tree\n');

  // Generate test wallets
  console.log('📦 Generating test wallets...');
  const wallets = {
    root: Keypair.generate(),      // Top level (you)
    l1_a: Keypair.generate(),       // L1 - Trader A
    l1_b: Keypair.generate(),       // L1 - Trader B
    l1_c: Keypair.generate(),       // L1 - Trader C
    l2_a: Keypair.generate(),       // L2 - Under L1_A
    l2_b: Keypair.generate(),       // L2 - Under L1_A
    l2_c: Keypair.generate(),       // L2 - Under L1_B
    l3_a: Keypair.generate(),       // L3 - Under L2_A
    l3_b: Keypair.generate(),       // L3 - Under L2_B
    l3_c: Keypair.generate(),       // L3 - Under L2_C
  };

  console.log(`  Root: ${wallets.root.publicKey.toBase58()}`);
  console.log(`  Generated ${Object.keys(wallets).length} wallets\n`);

  // Authenticate all wallets
  console.log('🔐 Authenticating wallets...');
  const sessions: Record<string, SessionToken> = {};
  for (const [name, keypair] of Object.entries(wallets)) {
    sessions[name] = await authenticate(keypair);
  }
  console.log('');

  // Root creates main code
  console.log('👤 Root: Creating referral code "TREEROOT"');
  await createCode(sessions.root.token, 'TREEROOT', 3);
  console.log('');

  // L1 traders bind to root and create their codes
  console.log('🌿 Layer 1: Binding traders to root...');
  await bindToCode(sessions.l1_a.token, 'TREEROOT');
  await bindToCode(sessions.l1_b.token, 'TREEROOT');
  await bindToCode(sessions.l1_c.token, 'TREEROOT');

  console.log('\n🌿 Layer 1: Creating their own codes...');
  await createCode(sessions.l1_a.token, 'BRANCHA', 3);
  await createCode(sessions.l1_b.token, 'BRANCHB', 3);
  console.log('');

  // L2 traders bind to L1 codes
  console.log('🍃 Layer 2: Binding traders...');
  await bindToCode(sessions.l2_a.token, 'BRANCHA');
  await bindToCode(sessions.l2_b.token, 'BRANCHA');
  await bindToCode(sessions.l2_c.token, 'BRANCHB');

  console.log('\n🍃 Layer 2: Creating their own codes...');
  await createCode(sessions.l2_a.token, 'LEAFA', 3);
  await createCode(sessions.l2_b.token, 'LEAFB', 3);
  await createCode(sessions.l2_c.token, 'LEAFC', 3);
  console.log('');

  // L3 traders bind to L2 codes
  console.log('🌱 Layer 3: Binding traders...');
  await bindToCode(sessions.l3_a.token, 'LEAFA');
  await bindToCode(sessions.l3_b.token, 'LEAFB');
  await bindToCode(sessions.l3_c.token, 'LEAFC');
  console.log('');

  // Verify the tree
  console.log('🔍 Verifying referral tree for root...');
  const affiliateData = await getAffiliateData(sessions.root.token);

  console.log('\n📊 Root Referral Tree Stats:');
  console.log(`  L1 Traders: ${affiliateData.tree.l1TraderCount}`);
  console.log(`  L2 Traders: ${affiliateData.tree.l2TraderCount}`);
  console.log(`  L3 Traders: ${affiliateData.tree.l3TraderCount}`);
  console.log(`  Total: ${affiliateData.tree.totalTraderCount}`);

  console.log('\n🎯 L1 Wallets:');
  affiliateData.tree.l1Traders.forEach((addr: string) => {
    console.log(`    ${addr.slice(0, 8)}...${addr.slice(-8)}`);
  });

  console.log('\n🎯 L2 Wallets:');
  affiliateData.tree.l2Traders.forEach((addr: string) => {
    console.log(`    ${addr.slice(0, 8)}...${addr.slice(-8)}`);
  });

  console.log('\n🎯 L3 Wallets:');
  affiliateData.tree.l3Traders.forEach((addr: string) => {
    console.log(`    ${addr.slice(0, 8)}...${addr.slice(-8)}`);
  });

  console.log('\n✅ Tree seeding complete!');
  console.log(`\n🌐 View in browser as wallet: ${sessions.root.walletAddress}`);
  console.log(`   Session token: ${sessions.root.token}\n`);
}

main().catch(console.error);
