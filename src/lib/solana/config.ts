/**
 * Solana On-Chain Configuration
 *
 * Central configuration for Solana RPC endpoints and program IDs.
 * Supports multiple environments (localnet, devnet, testnet, mainnet).
 */

import { PublicKey } from '@solana/web3.js';

// Environment detection
export type SolanaNetwork = 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta';

/**
 * Get current network from environment variables
 */
export function getCurrentNetwork(): SolanaNetwork {
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
  return network as SolanaNetwork;
}

/**
 * RPC endpoint URLs for each network
 */
export const RPC_ENDPOINTS: Record<SolanaNetwork, string> = {
  localnet: 'http://127.0.0.1:8899',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};

/**
 * WebSocket endpoint URLs for each network
 */
export const WS_ENDPOINTS: Record<SolanaNetwork, string> = {
  localnet: 'ws://127.0.0.1:8900',
  devnet: 'wss://api.devnet.solana.com',
  testnet: 'wss://api.testnet.solana.com',
  'mainnet-beta': 'wss://api.mainnet-beta.solana.com',
};

/**
 * Get RPC endpoint for current network
 */
export function getRpcEndpoint(): string {
  // Allow override via environment variable
  const override = import.meta.env.VITE_SOLANA_RPC_URL;
  if (override) return override;

  const network = getCurrentNetwork();
  return RPC_ENDPOINTS[network];
}

/**
 * Get WebSocket endpoint for current network
 */
export function getWsEndpoint(): string {
  const network = getCurrentNetwork();
  return WS_ENDPOINTS[network];
}

/**
 * Program IDs - Devnet deployed addresses
 * Configure via environment variables for different networks
 */
export const PROGRAM_IDS = {
  TESSERA_TOKEN: new PublicKey('GVxEUUr9UjePfvviCqwGcioZboBwfs2Ui2tv9TWRUiBW'),
  REFERRAL_SYSTEM: new PublicKey('3dbcAghTFKLzbzZpEf2AdBgvTEVuDA1ffadqWShcVRgV'),
} as const;

/**
 * Get Tessera Token program ID with environment override support
 */
export function getTesseraTokenProgramId(): PublicKey {
  const override = import.meta.env.VITE_TESSERA_TOKEN_PROGRAM_ID;
  if (override) {
    try {
      return new PublicKey(override);
    } catch {
      console.warn('Invalid VITE_TESSERA_TOKEN_PROGRAM_ID, using default');
    }
  }
  return PROGRAM_IDS.TESSERA_TOKEN;
}

/**
 * Get Referral System program ID with environment override support
 */
export function getReferralProgramId(): PublicKey {
  const override = import.meta.env.VITE_REFERRAL_PROGRAM_ID;
  if (override) {
    try {
      return new PublicKey(override);
    } catch {
      console.warn('Invalid VITE_REFERRAL_PROGRAM_ID, using default');
    }
  }
  return PROGRAM_IDS.REFERRAL_SYSTEM;
}

/**
 * Connection configuration options
 */
export const CONNECTION_CONFIG = {
  commitment: 'confirmed' as const,
  confirmTransactionInitialTimeout: 60000, // 60 seconds
};

/**
 * Transaction retry configuration
 */
export const TRANSACTION_CONFIG = {
  maxRetries: 3,
  skipPreflight: false,
  preflightCommitment: 'confirmed' as const,
};

/**
 * Check if running on devnet
 */
export function isDevnet(): boolean {
  return getCurrentNetwork() === 'devnet';
}

/**
 * Check if running on mainnet
 */
export function isMainnet(): boolean {
  return getCurrentNetwork() === 'mainnet-beta';
}

/**
 * Check if running locally
 */
export function isLocalnet(): boolean {
  return getCurrentNetwork() === 'localnet';
}

/**
 * Display-friendly network name
 */
export function getNetworkName(): string {
  const network = getCurrentNetwork();
  const names: Record<SolanaNetwork, string> = {
    localnet: 'Local',
    devnet: 'Devnet',
    testnet: 'Testnet',
    'mainnet-beta': 'Mainnet',
  };
  return names[network];
}

/**
 * Get Solana Explorer URL for transaction
 */
export function getExplorerUrl(signature: string, type: 'tx' | 'address' = 'tx'): string {
  const network = getCurrentNetwork();
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;

  if (type === 'tx') {
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  } else {
    return `https://explorer.solana.com/address/${signature}${cluster}`;
  }
}

/**
 * Get SolScan URL for transaction or address
 */
export function getSolscanUrl(signature: string, type: 'tx' | 'account' = 'tx'): string {
  const network = getCurrentNetwork();
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;

  return `https://solscan.io/${type}/${signature}${cluster}`;
}
