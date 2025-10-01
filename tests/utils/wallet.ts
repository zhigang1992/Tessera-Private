import { Keypair } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519';

export interface TestWallet {
  keypair: Keypair;
  publicKey: string;
  secretKey: Uint8Array;
}

/**
 * Generate a test wallet with keypair
 */
export function generateTestWallet(): TestWallet {
  const keypair = Keypair.generate();
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}

/**
 * Sign a message with a wallet's secret key
 */
export function signMessage(message: string, secretKey: Uint8Array): string {
  const messageBytes = new TextEncoder().encode(message);
  const signature = ed25519.sign(messageBytes, secretKey.slice(0, 32));
  return Buffer.from(signature).toString('base64');
}

/**
 * Generate a deterministic test wallet from a seed (for reproducible tests)
 */
export function generateTestWalletFromSeed(seed: string): TestWallet {
  const seedBytes = new TextEncoder().encode(seed);
  const hash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hash[i] = seedBytes[i % seedBytes.length] ^ i;
  }
  const keypair = Keypair.fromSeed(hash);
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}
