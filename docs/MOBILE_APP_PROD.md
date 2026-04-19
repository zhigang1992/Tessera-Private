# Prod APK Packaging + dApp Store Publishing

This guide builds the **prod flavor** of the Tessera Android app (`pe.tessera.app` signed with a keystore held outside the repo) and publishes it to the Solana dApp Store. For the test flow, see `MOBILE_APP_DEV.md`.

| | Value |
| --- | --- |
| Package ID | `pe.tessera.app` |
| Host | `app.tessera.pe` |
| App name on device | `Tessera` |
| Keystore | Outside the repo, backed up in 1Password |
| Keystore password | Strong random, 1Password |
| Publisher keypair | Outside the repo, 1Password |

> **The prod keystore must never be committed.** If it's lost or leaked, every user already on an older APK will be unable to update without uninstall+reinstall (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). This matters the moment one real user has installed the APK, and is catastrophic after dApp Store publication.

## 1. One-time environment setup

Same as dev:

```bash
mise install          # installs Java 17 + android-sdk
echo $JAVA_HOME $ANDROID_HOME
java -version         # should print 17
```

Additionally, install the Solana CLI for the publish step:

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## 2. Create + back up the prod keystore (first time only)

The prod keystore is created by Bubblewrap's init step below, but decide its storage location **before** running init:

1. Pick a location outside the repo, e.g. `~/tessera-prod-keystore/android.keystore`.
2. Generate a strong, unique keystore password and key password. Record both in 1Password under a `Tessera / Prod APK keystore` entry.
3. After init creates the keystore file at that path, **immediately** upload a copy of `android.keystore` to 1Password alongside the passwords. A keystore file with no password record, or a password with no file, is useless.

Losing the keystore requires distributing a new APK with a new SHA-256 and asking every user to uninstall + reinstall. There's no recovery through Solana or the dApp Store.

## 3. Verify production is serving the PWA

Bubblewrap reads the live manifest at init time. Production usually already has the current PWA assets deployed from normal release flow, so **just verify** — don't redeploy unless a required asset is missing or stale:

```bash
curl -I https://app.tessera.pe/manifest.webmanifest
curl -I https://app.tessera.pe/pwa-512x512.png
curl -I https://app.tessera.pe/maskable-icon-512x512.png
curl -I https://app.tessera.pe/.well-known/assetlinks.json
# All expect 200
```

If any of the above isn't 200, or if you've just pushed PWA-related changes that aren't live yet, redeploy:

```bash
bun run build
bun run cf:deploy
```

## 4. First-time Bubblewrap init

```bash
bun run mobile:bubblewrap:init:prod
```

Answer prompts (⚠ = must match exactly):

| Prompt | Answer |
| --- | --- |
| Install the JDK? | **No** (we use mise's Java 17) |
| Path to JDK | press enter if auto-detected matches `$JAVA_HOME`, else paste it |
| Install the Android SDK? | **Yes** ⚠ |
| Domain | default — taken from `--manifest` URL |
| URL path | `/` |
| Application name | `Tessera` |
| Short name | `Tessera` |
| Application ID / Package name | `pe.tessera.app` ⚠ |
| Starting version code | `1` (or the next unused value — see below) |
| Display mode | `standalone` |
| Orientation | `default` or `portrait` |
| Status bar color | default |
| Splash screen background color | default (`#131314`) |
| Icon URL | default |
| Maskable icon URL | default |
| Monochrome icon URL | leave blank |
| Include app shortcuts? | `No` |
| Signing key path | **absolute** path outside the repo, e.g. `/Users/you/tessera-prod-keystore/android.keystore` ⚠ (must be absolute — relative paths break Bubblewrap's keytool invocation; must be outside the repo — never commit a prod keystore) |
| Key name | `android` |
| Key store password | from 1Password ⚠ |
| Key password | from 1Password ⚠ |
| First and Last name | `Tessera` |
| Organizational Unit | `Engineering` |
| Organization | `Tessera` |
| Country | `SG` (or your 2-letter country) |

After init, confirm the keystore landed **outside the repo** and that nothing under `android/prod/` is staged for commit:

```bash
ls /Users/you/tessera-prod-keystore/android.keystore
git status android/prod/      # should show no tracked changes
```

The `android/.gitignore` fully ignores `android/prod/`, so there's no accidental commit, but double-check before pushing.

**Upload the keystore file to 1Password now**, before moving on.

### Hand off the fingerprint to the frontend owner

Init prints a `assetlinks.json` snippet at the end. Grab the SHA-256 fingerprint from that snippet (or re-run `keytool -list -v -keystore /path/to/prod/keystore -alias android` with the prod password) and send it to whoever owns `public/` + deployment. Ask them to:

1. Append the prod entry to `public/.well-known/assetlinks.json` alongside the existing dev entry (see the next section for the exact shape).
2. Commit, merge to the branch that deploys to `app.tessera.pe`, and confirm `https://app.tessera.pe/.well-known/assetlinks.json` returns 200 with the new entry.

You (the APK author) don't touch the web repo for this — the keystore fingerprint is the only thing that crosses over, and it's not a secret.

### Version code bumping

Android rejects an update whose `versionCode` is not strictly greater than the currently-installed one. Bubblewrap stores the current number in `android/prod/twa-manifest.json > appVersionCode`. Before every new release:

1. Open `android/prod/twa-manifest.json`
2. Bump `appVersionCode` (e.g. `1` → `2`) and optionally `appVersionName` (e.g. `1.0.0` → `1.0.1`)
3. Run `bun run mobile:bubblewrap:update:prod` to regenerate the Android project

If `android/prod/twa-manifest.json` ever gets wiped (it's gitignored), restore it from a backup or rerun init and pick the next version code manually.

## 5. Publish the prod fingerprint to `assetlinks.json`

Init prints an `assetlinks.json` snippet with the SHA-256 of the prod keystore. Append it to the existing dev entry in `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "pe.tessera.app.dev",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "pe.tessera.app",
      "sha256_cert_fingerprints": ["11:22:33:..."]
    }
  }
]
```

First check whether the prod fingerprint is already live:

```bash
curl -s https://app.tessera.pe/.well-known/assetlinks.json | grep pe.tessera.app\"
```

If you see the prod entry, skip ahead to step 6. Otherwise commit the updated `public/.well-known/assetlinks.json` and redeploy — without the prod fingerprint on production, Android will launch the APK with the Chrome URL bar:

```bash
bun run build
bun run cf:deploy
curl https://app.tessera.pe/.well-known/assetlinks.json
```

## 6. Build + smoke-test the APK

```bash
export BUBBLEWRAP_KEYSTORE_PASSWORD='<from-1password>'
export BUBBLEWRAP_KEY_PASSWORD='<from-1password>'
bun run mobile:bubblewrap:build:prod
```

Output at `android/prod/app-release-signed.apk` and `.aab`.

Install on a test device (uninstall any leftover dev build first):

```bash
adb uninstall pe.tessera.app || true
adb install -r android/prod/app-release-signed.apk
```

Verify:

- Launches full-screen, no Chrome URL bar → TWA + assetlinks confirmed
- Connect Wallet → Dynamic dialog shows Mobile Wallet Adapter → handoff to Seed Vault / installed wallet
- Remote-debug via `chrome://inspect/#devices`: `/api/*`, RPC, GraphQL bypass the service worker

Do not skip the smoke test. A broken prod APK in the dApp Store means every install is broken until a new version is accepted.

## 7. Publish to the Solana dApp Store (first release)

One-time: create the publisher keypair and record it in 1Password.

```bash
solana-keygen new --outfile ~/secrets/tessera-publisher.json
# Copy the JSON into 1Password alongside the public key
```

Fill in `dapp-store/config.yaml` with publisher name, URLs, support contact, and place media assets under `dapp-store/media/`:

- `icon.png` — 512×512 (matches `public/pwa-512x512.png`)
- `banner.png` — 1200×600
- `screenshot-1.png` through `screenshot-4.png` — portrait
- `feature-graphic.png` — 1024×500 (optional)

Then:

```bash
export PUBLISHER_KEYPAIR=~/secrets/tessera-publisher.json
export SOLANA_RPC=https://api.mainnet-beta.solana.com

cd dapp-store

# Create on-chain NFTs: publisher, then app, then first release.
dapp-store create publisher -k "$PUBLISHER_KEYPAIR" -u "$SOLANA_RPC"
dapp-store create app       -k "$PUBLISHER_KEYPAIR" -u "$SOLANA_RPC"
dapp-store create release   -k "$PUBLISHER_KEYPAIR" -u "$SOLANA_RPC" \
  -b ../android/prod/app-release-signed.apk

# Validate + submit to the publisher portal.
bun run mobile:dappstore:validate
dapp-store publish submit -k "$PUBLISHER_KEYPAIR" -u "$SOLANA_RPC" \
  --requestor-is-authorized
```

Solana Mobile then reviews the submission. Track status via the publisher portal; rejection comes back with feedback.

## 8. Subsequent releases

For each new version:

1. Bump `appVersionCode` (and `appVersionName`) in `android/prod/twa-manifest.json`.
2. Redeploy the web app if the release requires manifest/icon changes:
   ```bash
   bun run build && bun run cf:deploy
   ```
3. Rebuild and re-sign:
   ```bash
   bun run mobile:bubblewrap:update:prod
   bun run mobile:bubblewrap:build:prod
   ```
4. Smoke-test with `adb install -r`.
5. Create a new on-chain release NFT + submit update:
   ```bash
   cd dapp-store
   dapp-store create release -k "$PUBLISHER_KEYPAIR" -u "$SOLANA_RPC" \
     -b ../android/prod/app-release-signed.apk
   dapp-store publish update -k "$PUBLISHER_KEYPAIR" -u "$SOLANA_RPC" \
     --requestor-is-authorized
   ```

Most web-only changes don't require a new APK — the TWA pulls the latest PWA content from `app.tessera.pe` on each launch. Rebuild only when the manifest, icons, colors, or version code need to change.

## What never goes in the repo

- Prod keystore (`.keystore` file)
- Prod keystore passwords (not even in `.env`)
- Publisher keypair (`tessera-publisher.json`)
- `android/prod/` directory as a whole — the gitignore covers this, but run `git status` after init to confirm

## Troubleshooting

- **`The provided androidSdk isn't correct.`** — Rerun init and answer **Yes** to "Install the Android SDK?".
- **APK rejected by dApp Store reviewer.** Read the feedback in the publisher portal; common issues are missing screenshots, privacy policy URL not live, or version code regression.
- **`INSTALL_FAILED_UPDATE_INCOMPATIBLE` on smoke test.** Signature differs from the previously-installed APK. `adb uninstall pe.tessera.app` and retry.
- **TWA opens with URL bar.** Prod `assetlinks.json` missing the prod entry, or fingerprint mismatch. Check `curl https://app.tessera.pe/.well-known/assetlinks.json` and compare against `keytool -list -v -keystore /path/to/keystore`.
- **Trying to update an existing release: "version code must be greater".** Bump `appVersionCode` in `android/prod/twa-manifest.json`, re-run `update` + `build`.
- **Lost prod keystore.** If no real users have installed yet: regenerate, update `assetlinks.json`, redeploy, rebuild APK, resubmit. If users already have the app: the same steps, but users will need to uninstall their current copy manually; communicate clearly. There's no cryptographic recovery.
