import { describe, test, expect, beforeAll } from 'bun:test';
import { generateTestWallet, signMessage, type TestWallet } from '../utils/wallet';

const API_BASE = 'http://localhost:8788';

describe('Auth Flow', () => {
  let testWallet: TestWallet;

  beforeAll(() => {
    testWallet = generateTestWallet();
    console.log(`Test wallet: ${testWallet.publicKey}`);
  });

  test('GET /api/auth/nonce - should issue a nonce for a wallet', async () => {
    const response = await fetch(`${API_BASE}/api/auth/nonce?wallet=${testWallet.publicKey}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('nonce');
    expect(data).toHaveProperty('walletAddress', testWallet.publicKey);
    expect(data).toHaveProperty('issuedAt');
    expect(data).toHaveProperty('expiresAt');
    expect(data).toHaveProperty('ttlSeconds', 300);
    expect(data).toHaveProperty('message');

    // Verify message format
    expect(data.message).toContain('Sign in to Tessera Referral Program');
    expect(data.message).toContain(`Nonce: ${data.nonce}`);
  });

  test('GET /api/auth/nonce - should reject invalid wallet address', async () => {
    const response = await fetch(`${API_BASE}/api/auth/nonce?wallet=invalid`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  test('POST /api/auth/verify - should verify signature and issue session token', async () => {
    // Step 1: Get nonce
    const nonceResponse = await fetch(`${API_BASE}/api/auth/nonce?wallet=${testWallet.publicKey}`);
    const nonceData = await nonceResponse.json();

    expect(nonceResponse.status).toBe(200);

    // Step 2: Sign the message
    const signature = signMessage(nonceData.message, testWallet.secretKey);

    // Step 3: Verify signature
    const verifyResponse = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWallet.publicKey,
        nonce: nonceData.nonce,
        signature,
        timestamp: nonceData.issuedAt,
        signatureEncoding: 'base64',
      }),
    });

    const verifyData = await verifyResponse.json();

    expect(verifyResponse.status).toBe(200);
    expect(verifyData).toHaveProperty('token');
    expect(verifyData).toHaveProperty('tokenType', 'session');
    expect(verifyData).toHaveProperty('walletAddress', testWallet.publicKey);
    expect(verifyData).toHaveProperty('issuedAt');
    expect(verifyData).toHaveProperty('expiresAt');
  });

  test('POST /api/auth/verify - should reject invalid signature', async () => {
    // Step 1: Get nonce
    const nonceResponse = await fetch(`${API_BASE}/api/auth/nonce?wallet=${testWallet.publicKey}`);
    const nonceData = await nonceResponse.json();

    // Step 2: Use wrong signature
    const wrongSignature = 'invalidSignatureBase64==';

    // Step 3: Try to verify
    const verifyResponse = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWallet.publicKey,
        nonce: nonceData.nonce,
        signature: wrongSignature,
        timestamp: nonceData.issuedAt,
        signatureEncoding: 'base64',
      }),
    });

    const verifyData = await verifyResponse.json();

    expect(verifyResponse.status).toBe(400);
    expect(verifyData).toHaveProperty('error');
  });

  test('POST /api/auth/verify - should reject reused nonce', async () => {
    // Step 1: Get nonce
    const nonceResponse = await fetch(`${API_BASE}/api/auth/nonce?wallet=${testWallet.publicKey}`);
    const nonceData = await nonceResponse.json();

    // Step 2: Sign and verify once
    const signature = signMessage(nonceData.message, testWallet.secretKey);
    const firstVerify = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWallet.publicKey,
        nonce: nonceData.nonce,
        signature,
        timestamp: nonceData.issuedAt,
        signatureEncoding: 'base64',
      }),
    });

    expect(firstVerify.status).toBe(200);

    // Step 3: Try to use the same nonce again
    const secondVerify = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWallet.publicKey,
        nonce: nonceData.nonce,
        signature,
        timestamp: nonceData.issuedAt,
        signatureEncoding: 'base64',
      }),
    });

    const secondData = await secondVerify.json();

    expect(secondVerify.status).toBe(409);
    expect(secondData).toHaveProperty('error');
    expect(secondData.error).toContain('already used');
  });
});
