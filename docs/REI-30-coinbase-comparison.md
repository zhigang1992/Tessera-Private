# Coinbase CDP vs Dynamic/Transak/Moonpay Comparison

**Issue:** REI-30
**Date:** January 14, 2026
**Source:** Dev Telegram group message from Chan A (Jan 10, 2026)

---

## Executive Summary

Coinbase's new CDP (Coinbase Developer Platform) offers three distinct solutions that compete with different aspects of the current Tessera stack:

| Coinbase Solution | Primary Competitor | Key Differentiator |
|-------------------|-------------------|-------------------|
| Widget API | MoonPay, Transak | Free integration, 90+ countries |
| Headless API | Dynamic (custom UI) | Apple Pay, No-KYC under $1K/week |
| Embedded Wallets | Dynamic.xyz | Social login, true self-custody |

---

## 1. Coinbase Widget API

### Overview
Embedded iframe widget with Coinbase branding for crypto on-ramp.

### Key Features
- **Coverage:** 90+ countries globally
- **Platforms:** Mobile + Desktop
- **Cost:** Free to integrate
- **Branding:** Coinbase branding required
- **Setup:** No backend required (simple iframe embed)

### Integration Effort
```
npm install @coinbase/cbpay-sdk
```

Minimal frontend integration using iframe or React component.

### Competitors: MoonPay, Transak

| Feature | Coinbase Widget | MoonPay | Transak |
|---------|-----------------|---------|---------|
| Setup Fee | Free | Unknown | Unknown |
| Countries | 90+ | 160+ | 150+ |
| Backend Required | No | No | No |
| KYC | Handled by Coinbase | Handled by MoonPay | Handled by Transak |
| Branding | Coinbase required | Can be white-labeled | Can be white-labeled |

**Verdict:** Coinbase Widget is simpler but less flexible than MoonPay/Transak due to branding requirements.

---

## 2. Coinbase Headless API (Apple Pay Onramp)

### Overview
API-driven onramp with full UI control and Apple Pay integration.

### Key Features
- **UI Control:** Full customization (Coinbase branding optional)
- **Apple Pay:** Native iOS payment experience
- **No-KYC:** Purchases under $1,000/week
- **Availability:** US only (EU Q1 2026, UK/Canada following)
- **Platform:** iOS apps, Web apps (Android coming soon)
- **Backend:** Required for order creation

### Requirements
- User verification (email OTP + phone number required)
- Phone verification every 60 days
- Domain verification for web apps
- Commercial agreement for production access

### Integration Effort
- Backend API integration required
- Frontend iframe/webview for payment flow
- PostMessage event handling for payment status

### Competitors: Dynamic.xyz (Custom Onramp)

| Feature | Coinbase Headless | Dynamic.xyz |
|---------|-------------------|-------------|
| Apple Pay | Native support | No native Apple Pay |
| No-KYC Limit | $1,000/week | No built-in onramp |
| US Only | Yes (EU Q1 2026) | Global |
| Backend Required | Yes | Yes |
| UI Control | Full | Full |

**Verdict:** Coinbase Headless offers Apple Pay which Dynamic doesn't have. However, Dynamic is primarily a wallet connector, not an onramp solution. They serve different purposes.

---

## 3. Coinbase Embedded Wallets

### Overview
Full wallet solution with social login and self-custody, supporting all EVM chains and Solana.

### Key Features
- **Login Methods:** Email OTP, SMS OTP, Social logins (Google, etc.)
- **Security:** User-custodied (keys exportable)
- **Speed:** Wallet creation <500ms
- **Chains:** All EVM + Solana
- **USDC Rewards:** 3.85% APY (US developers only)
- **Multi-device:** Up to 5 devices
- **Onramp/Offramp:** Built-in

### Integration Effort
```
npm install @coinbase/waas-sdk-react
```

Requires domain allowlisting and security configuration.

### Competitors: Dynamic.xyz

| Feature | Coinbase Embedded | Dynamic.xyz |
|---------|-------------------|-------------|
| Social Login | Email, SMS, Social | Social only |
| Self-Custody | True (exportable keys) | True (MPC) |
| Solana Support | ✅ Yes | ✅ Yes |
| EVM Support | ✅ All chains | ✅ All chains |
| Built-in Onramp | ✅ Yes | ❌ No (requires integration) |
| USDC Rewards | ✅ 3.85% APY | ❌ No |
| Setup Complexity | Medium | Medium |
| Wallet Creation Speed | <500ms | Similar |

**Verdict:** Coinbase Embedded Wallets has significant advantages with built-in onramp/offramp and USDC rewards. Dynamic.xyz is more mature but requires separate onramp integration.

---

## Current Tessera Stack

Based on code analysis:

### Wallet Connection
- **Current:** Solana Wallet Adapter (`@solana/wallet-adapter-react`)
- **Supported Wallets:** Phantom, Solflare
- **Feature Branch:** `feat/dynamic` has Dynamic.xyz integration with `@dynamic-labs/solana`

### Onramp/Fiat
- **Current:** No integrated onramp solution
- **Finding:** No Transak, MoonPay, or onramp implementation in current codebase

---

## Recommendations

### Option A: Replace with Coinbase (Recommended for New Projects)

**Benefits:**
- Unified solution (wallet + onramp)
- USDC rewards revenue share
- Apple Pay for premium mobile UX
- Free widget API for quick MVP

**Drawbacks:**
- US-only for Headless API initially
- Vendor lock-in to Coinbase ecosystem
- Embedded Wallets is newer than Dynamic

### Option B: Hybrid Approach

**Configuration:**
```
Wallet Layer: Dynamic.xyz (mature, multi-chain)
Onramp Layer: Coinbase Widget (free, global)
Mobile Premium: Coinbase Headless (Apple Pay, US-only)
```

**Benefits:**
- Best of both worlds
- Geographic coverage (Global via Widget, US premium via Headless)
- Flexibility to swap components

### Option C: Current Stack + Coinbase Onramp

**Configuration:**
```
Wallet Layer: Solana Wallet Adapter (current)
Onramp Layer: Coinbase Widget
```

**Benefits:**
- Minimal changes
- No vendor lock-in on wallet layer
- Quick implementation

---

## Next Steps

1. **Immediate:** Get access to Coinbase CDP sandbox for testing
2. **Week 1:** Implement Coinbase Widget on test page (done - see `CoinbaseTestPage.tsx`)
3. **Week 1-2:** Evaluate Dynamic.xyz vs Coinbase Embedded Wallets
4. **Week 2:** Prototype Headless API for mobile testing (US only)
5. **Week 3:** Make final decision based on:
   - Geographic user distribution
   - Mobile vs desktop usage
   - Revenue sharing terms

---

## Integration References

- **Widget API:** https://docs.cdp.coinbase.com/onramp/docs/welcome/
- **Headless API:** https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/apple-pay-onramp-api
- **Embedded Wallets:** https://docs.cdp.coinbase.com/embedded-wallets/welcome
- **Demo:** https://demo.cdp.coinbase.com/

---

## Notes from Telegram

> **From:** Chan A (@fiftyeightandeight)
> **Date:** January 10, 2026
> **Message:** "Hi @kylefang would you also please take a look at the Coinbase solution and compare against Dynamic/Transak/Moonpay combo?"

Additional context from same message:
- NDA required for bundle deal discussions
- Interest in potential commercial agreement
- Focus on comparison for Tessera use case
