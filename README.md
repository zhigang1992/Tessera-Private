# Tessera

This is a React/Vite app containing:

- Tailwind and Shadcn UI for styling
- [Gill](https://gill.site/) Solana SDK
- Shadcn [Wallet UI](https://registry.wallet-ui.dev) components

## Getting Started

### Installation

#### Download the template

```shell
npx create-solana-dapp@latest -t gh:solana-foundation/templates/gill/Tessera
```

#### Install Dependencies

```shell
npm install
```

### Start the app

```shell
npm run dev
```

## Mobile App Packaging

The web app is also packaged as a Trusted Web Activity (TWA) Android APK, with two flavors that coexist on the same device:

- [`docs/MOBILE_APP_DEV.md`](docs/MOBILE_APP_DEV.md) — build + install the dev-flavor APK (`pe.tessera.app.dev`, committed keystore, deployed via Cloudflare Pages preview branch).
- [`docs/MOBILE_APP_PROD.md`](docs/MOBILE_APP_PROD.md) — build the prod-flavor APK (`pe.tessera.app`, keystore in 1Password) and publish to the Solana dApp Store.

Common npm scripts live under `mobile:*` in `package.json`.

## Dev Wallet via URL Hash (Testing Only)

- Purpose: Quickly test wallet-connected flows without installing a Chrome extension.
- Warning: For local development only. Never use a real/private mainnet key.

How it works

- On startup, `src/dev/url-key-wallet.ts` parses `window.location.hash` for a Solana private key.
- It derives the ed25519 keypair and registers a minimal Wallet Standard wallet named "URL Key Wallet".
- The account is pre-authorized and auto-selected so the app treats it as connected.
- A Phantom-like shim is provided at `window.solana.signMessage(message)` for message signing (used by referral auth).
- The URL hash is removed after parsing; the selected account persists in `localStorage` under `wallet-ui:account`.

Accepted hash formats

- `#<base58SecretKey>`: base58-encoded 64-byte secret key or 32-byte seed.
- `#0x<hex>` or `#<hex>`: 64 hex chars (32 bytes) or 128 hex chars (64 bytes).
- `#[1,2,3,...]`: JSON array of numbers (prefer 64 length for full secret key).
- `#pk=<value>` or `#secret=<value>`: query-like variant; value follows any format above.

Examples

- `http://localhost:5173/#3cx...base58SecretKey...n4`
- `http://localhost:5173/#0xabcdef...` or `http://localhost:5173/#abcdef...`
- `http://localhost:5173/#[99,12,34,...]`
- `http://localhost:5173/#pk=3cx...` or `http://localhost:5173/#secret=3cx...`

Notes

- Chains: The dev wallet advertises `solana:devnet` and `solana:localnet`. Ensure your app cluster is one of these.
- Message signing only: Implemented `solana:signMessage` for auth flows. If you need transaction signing/sending,
  extend `src/dev/url-key-wallet.ts` to add `solana:signTransaction` / `solana:signAndSendTransaction` features.
- Clearing: Use the UI Disconnect button or clear `localStorage["wallet-ui:account"]` to reset selection.
- Disable this behavior: remove the import in `src/main.tsx`:
  `import './dev/url-key-wallet'`

## Cloudflare secrets

`/api/social/check-referral-tweet` reads `TWITTERAPI_IO_KEY` — a twitterapi.io API key — to search for referral tweets.

- Production: `wrangler secret put TWITTERAPI_IO_KEY`
- Local dev: add `TWITTERAPI_IO_KEY=...` to `.dev.vars` (gitignored). Never commit the key.
