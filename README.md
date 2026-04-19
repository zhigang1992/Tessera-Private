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

## Environment Variables

**Build time** (read by Vite, must be set before `bun run build`):

| Variable                      | Default | Purpose                                                                                                                                                                                                            |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SW_ENABLED`             | `false` | When `true`, ships a real service worker with precache + offline + update-toast. Default builds emit a self-destroying SW so existing installs clean themselves up; the web manifest and PWA icons are unaffected. |
| `VITE_DYNAMIC_ENVIRONMENT_ID` | —       | Dynamic.xyz environment ID. Required for wallet flows. Put in `.env.local`.                                                                                                                                        |
| `PORT`                        | `6173`  | Vite dev server port.                                                                                                                                                                                              |
| `VITE_API_PORT`               | `8788`  | Local Cloudflare Workers dev port that Vite proxies `/api/*` and `/geo-check.json` to.                                                                                                                             |

**Mobile packaging** (read by the `mobile:*` npm scripts):

| Variable                       | Used by                                       | Default                                                        | Purpose                                                                                              |
| ------------------------------ | --------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `TESSERA_APK_HOST`             | `mobile:bubblewrap:init:{dev,prod}`           | `apk-dev.tesserapoc.pages.dev` (dev) / `app.tessera.pe` (prod) | Overrides the host that Bubblewrap fetches the PWA manifest from at init time.                       |
| `BUBBLEWRAP_KEYSTORE_PASSWORD` | `mobile:bubblewrap:{update,build}:{dev,prod}` | `tessera-dev` (dev, baked into script) / — (prod, must export) | Keystore password. The dev scripts bake `tessera-dev`; prod requires explicit export from 1Password. |
| `BUBBLEWRAP_KEY_PASSWORD`      | same as above                                 | same as above                                                  | Key password. In our setup the key password equals the keystore password.                            |

**Solana dApp Store publish** (only for prod releases):

| Variable            | Purpose                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `PUBLISHER_KEYPAIR` | Absolute path to the publisher's Solana keypair JSON file (outside the repo, stored in 1Password). |
| `SOLANA_RPC`        | Solana RPC endpoint. Use `https://api.mainnet-beta.solana.com` for actual dApp Store submissions.  |

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
