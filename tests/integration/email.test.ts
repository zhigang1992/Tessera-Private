import { describe, test, expect, beforeAll } from 'bun:test';
import { generateTestWallet, signMessage, type TestWallet } from '../utils/wallet';

const API_BASE = 'http://localhost:8788';

async function getAuthToken(wallet: TestWallet): Promise<string> {
  const nonceResponse = await fetch(`${API_BASE}/api/auth/nonce?wallet=${wallet.publicKey}`);
  const nonceData = await nonceResponse.json();
  const signature = signMessage(nonceData.message, wallet.secretKey);

  const verifyResponse = await fetch(`${API_BASE}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: wallet.publicKey,
      nonce: nonceData.nonce,
      signature,
      timestamp: nonceData.issuedAt,
      signatureEncoding: 'base64',
    }),
  });

  const verifyData = await verifyResponse.json();
  return verifyData.token;
}

describe('Email Verification', () => {
  let testWallet: TestWallet;
  let authToken: string;

  beforeAll(async () => {
    testWallet = generateTestWallet();
    authToken = await getAuthToken(testWallet);
    console.log(`Test wallet: ${testWallet.publicKey}`);
  });

  test('POST /api/referral/email/request - should request email verification', async () => {
    const testEmail = `test-${Date.now()}@example.com`;

    const response = await fetch(`${API_BASE}/api/referral/email/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('email', testEmail);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('verificationLink'); // For testing
    expect(data).toHaveProperty('expiresAt');

    console.log(`Verification link: ${data.verificationLink}`);

    // Extract token from verification link
    const urlParams = new URL(data.verificationLink);
    const token = urlParams.searchParams.get('token');

    expect(token).toBeTruthy();

    // Test verification endpoint
    const verifyResponse = await fetch(`${API_BASE}/api/referral/email/verify?token=${token}`);
    const verifyData = await verifyResponse.json();

    expect(verifyResponse.status).toBe(200);
    expect(verifyData).toHaveProperty('success', true);
    expect(verifyData).toHaveProperty('message');
    expect(verifyData).toHaveProperty('walletAddress', testWallet.publicKey);
    expect(verifyData).toHaveProperty('email', testEmail);
  });

  test('POST /api/referral/email/request - should reject invalid email', async () => {
    const response = await fetch(`${API_BASE}/api/referral/email/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email: 'not-an-email',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  test('POST /api/referral/email/request - should reject duplicate email', async () => {
    const testEmail = `duplicate-${Date.now()}@example.com`;
    const anotherWallet = generateTestWallet();
    const anotherToken = await getAuthToken(anotherWallet);

    // First wallet claims the email
    const firstResponse = await fetch(`${API_BASE}/api/referral/email/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    expect(firstResponse.status).toBe(200);

    // Second wallet tries to claim the same email
    const secondResponse = await fetch(`${API_BASE}/api/referral/email/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anotherToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const secondData = await secondResponse.json();

    expect(secondResponse.status).toBe(409);
    expect(secondData).toHaveProperty('error');
    expect(secondData.error).toContain('already associated');
  });

  test('GET /api/referral/email/verify - should reject invalid token', async () => {
    const response = await fetch(`${API_BASE}/api/referral/email/verify?token=invalid-token`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
  });

  test('GET /api/referral/email/verify - should handle already verified email', async () => {
    const testEmail = `already-verified-${Date.now()}@example.com`;

    // Request verification
    const requestResponse = await fetch(`${API_BASE}/api/referral/email/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const requestData = await requestResponse.json();
    const urlParams = new URL(requestData.verificationLink);
    const token = urlParams.searchParams.get('token');

    // Verify once
    const firstVerify = await fetch(`${API_BASE}/api/referral/email/verify?token=${token}`);
    expect(firstVerify.status).toBe(200);

    // Verify again with same token (token is cleared after first verification)
    const secondVerify = await fetch(`${API_BASE}/api/referral/email/verify?token=${token}`);
    const secondData = await secondVerify.json();

    // Token is cleared after verification, so second attempt returns 404
    expect(secondVerify.status).toBe(404);
    expect(secondData).toHaveProperty('error');
  });

  test('GET /api/referral/affiliate - should show verified email status', async () => {
    const testEmail = `status-check-${Date.now()}@example.com`;

    // Request and verify email
    const requestResponse = await fetch(`${API_BASE}/api/referral/email/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const requestData = await requestResponse.json();
    const urlParams = new URL(requestData.verificationLink);
    const token = urlParams.searchParams.get('token');

    await fetch(`${API_BASE}/api/referral/email/verify?token=${token}`);

    // Check affiliate endpoint shows verified email
    const affiliateResponse = await fetch(`${API_BASE}/api/referral/affiliate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const affiliateData = await affiliateResponse.json();

    expect(affiliateResponse.status).toBe(200);
    expect(affiliateData).toHaveProperty('email', testEmail);
    expect(affiliateData).toHaveProperty('emailVerified', true);
  });
});
