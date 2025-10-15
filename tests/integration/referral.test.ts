import { describe, test, expect, beforeAll } from 'bun:test';
import { generateTestWallet, signMessage, type TestWallet } from '../utils/wallet';

const API_BASE = 'http://localhost:8788';

async function getAuthToken(wallet: TestWallet): Promise<string> {
  // Get nonce
  const nonceResponse = await fetch(`${API_BASE}/api/auth/nonce?wallet=${wallet.publicKey}`);
  const nonceData = await nonceResponse.json();

  // Sign message
  const signature = signMessage(nonceData.message, wallet.secretKey);

  // Verify and get token
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

describe('Referral System', () => {
  let referrerWallet: TestWallet;
  let traderWallet: TestWallet;
  let referrerToken: string;
  let traderToken: string;
  let referralCode: string;

  beforeAll(async () => {
    referrerWallet = generateTestWallet();
    traderWallet = generateTestWallet();

    console.log(`Referrer wallet: ${referrerWallet.publicKey}`);
    console.log(`Trader wallet: ${traderWallet.publicKey}`);

    // Get auth tokens for both wallets
    referrerToken = await getAuthToken(referrerWallet);
    traderToken = await getAuthToken(traderWallet);
  });

  test('POST /api/referral/code - should create a referral code', async () => {
    const response = await fetch(`${API_BASE}/api/referral/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${referrerToken}`,
      },
      body: JSON.stringify({
        activeLayer: 3,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('code');
    expect(data.code).toHaveProperty('id');
    expect(data.code).toHaveProperty('codeSlug');
    expect(data.code).toHaveProperty('status', 'active');
    expect(data.code).toHaveProperty('activeLayer', 3);
    expect(data.code).toHaveProperty('walletAddress', referrerWallet.publicKey);

    referralCode = data.code.codeSlug;
    console.log(`Generated referral code: ${referralCode}`);
  });

  test('POST /api/referral/code - should create a custom referral code', async () => {
    const customCode = `TEST${Date.now().toString().slice(-4)}`; // Last 4 digits of timestamp

    const response = await fetch(`${API_BASE}/api/referral/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${referrerToken}`,
      },
      body: JSON.stringify({
        codeSlug: customCode,
        activeLayer: 2,
      }),
    });

    const data = await response.json();

    // Could be 200 (update) or 201 (create) depending on whether user already has a code
    expect([200, 201]).toContain(response.status);
    expect(data.code.codeSlug).toBe(customCode);
    expect(data.code.activeLayer).toBe(2);
  });

  test('POST /api/referral/code - should reject invalid code format', async () => {
    const response = await fetch(`${API_BASE}/api/referral/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${referrerToken}`,
      },
      body: JSON.stringify({
        codeSlug: 'ab', // Too short
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  test('POST /api/referral/code - should reject unauthorized requests', async () => {
    const response = await fetch(`${API_BASE}/api/referral/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
  });

  test('GET /api/referral/trader - should fetch trader data', async () => {
    const response = await fetch(`${API_BASE}/api/referral/trader`, {
      headers: {
        Authorization: `Bearer ${traderToken}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('walletAddress', traderWallet.publicKey);
    expect(data).toHaveProperty('metrics');
    expect(data.metrics).toHaveProperty('tradingVolume');
    expect(data.metrics).toHaveProperty('feeRebateTotal');
    expect(data.metrics).toHaveProperty('tradingPoints');
    expect(data.metrics).toHaveProperty('feeDiscountPct');
    expect(data).toHaveProperty('referral'); // Should be null initially
  });

  test('POST /api/referral/trader/bind - should bind trader to referrer', async () => {
    const response = await fetch(`${API_BASE}/api/referral/trader/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        referralCode,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('binding');
    expect(data.binding).toHaveProperty('traderWallet', traderWallet.publicKey);
    expect(data.binding).toHaveProperty('referrerCode', referralCode);
    expect(data.binding).toHaveProperty('referrerWallet', referrerWallet.publicKey);
  });

  test('POST /api/referral/trader/bind - should prevent self-binding', async () => {
    const response = await fetch(`${API_BASE}/api/referral/trader/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${referrerToken}`,
      },
      body: JSON.stringify({
        referralCode, // Trying to bind to own code
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('own referral code');
  });

  test('POST /api/referral/trader/bind - should reject non-existent code', async () => {
    const newTrader = generateTestWallet();
    const newTraderToken = await getAuthToken(newTrader);

    const response = await fetch(`${API_BASE}/api/referral/trader/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newTraderToken}`,
      },
      body: JSON.stringify({
        referralCode: 'NOTEXIST',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
  });

  test('GET /api/referral/trader - should show binding after binding', async () => {
    const response = await fetch(`${API_BASE}/api/referral/trader`, {
      headers: {
        Authorization: `Bearer ${traderToken}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.referral).not.toBeNull();
    expect(data.referral).toHaveProperty('referrerCode', referralCode);
    expect(data.referral).toHaveProperty('referrerWallet', referrerWallet.publicKey);
  });

  test('GET /api/referral/affiliate - should fetch affiliate data', async () => {
    const response = await fetch(`${API_BASE}/api/referral/affiliate`, {
      headers: {
        Authorization: `Bearer ${referrerToken}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('walletAddress', referrerWallet.publicKey);
    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('referralCodes');
    expect(data).toHaveProperty('tree');

    // Should have at least 1 referral code
    expect(data.referralCodes.length).toBeGreaterThan(0);

    // Tree should show 1 L1 trader (the trader we bound)
    expect(data.tree).toHaveProperty('l1TraderCount', 1);
    expect(data.tree).toHaveProperty('l2TraderCount', 0);
    expect(data.tree).toHaveProperty('l3TraderCount', 0);
    expect(data.tree).toHaveProperty('totalTraderCount', 1);
  });

  test('Multi-level referral tree - should create 3-level hierarchy', async () => {
    // Create L2 and L3 traders
    const l2Trader = generateTestWallet();
    const l3Trader = generateTestWallet();

    const l2Token = await getAuthToken(l2Trader);
    const l3Token = await getAuthToken(l3Trader);

    // L2 trader creates their own code
    const l2CodeResponse = await fetch(`${API_BASE}/api/referral/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${l2Token}`,
      },
      body: JSON.stringify({ activeLayer: 3 }),
    });

    const l2CodeData = await l2CodeResponse.json();
    const l2Code = l2CodeData.code.codeSlug;

    // L2 binds to L1 (traderWallet)
    await fetch(`${API_BASE}/api/referral/trader/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${l2Token}`,
      },
      body: JSON.stringify({ referralCode }),
    });

    // L3 binds to L2
    await fetch(`${API_BASE}/api/referral/trader/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${l3Token}`,
      },
      body: JSON.stringify({ referralCode: l2Code }),
    });

    // Check referrer's tree now shows all 3 levels
    const affiliateResponse = await fetch(`${API_BASE}/api/referral/affiliate`, {
      headers: {
        Authorization: `Bearer ${referrerToken}`,
      },
    });

    const affiliateData = await affiliateResponse.json();

    expect(affiliateData.tree.l1TraderCount).toBe(2); // trader + l2Trader
    expect(affiliateData.tree.l2TraderCount).toBe(1); // l3Trader
    expect(affiliateData.tree.totalTraderCount).toBe(3);
  });
});
