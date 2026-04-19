# Dev APK Packaging

This guide builds the **dev flavor** of the Tessera Android app — a test APK signed with a keystore that is **committed to the repo** so anyone on the team can reproduce it. For the production flow, see `MOBILE_APP_PROD.md`.

| | Value |
| --- | --- |
| Package ID | `pe.tessera.app.dev` |
| Host | `dev.tessera.fun` (Cloudflare Pages preview) |
| App name on device | `Tessera Dev` |
| Keystore | `android/dev/android.keystore` (tracked) |
| Keystore password | `tessera-dev` (both store and key) |

Dev and prod APKs coexist on the same device because the package IDs differ.

## 1. One-time environment setup

From the project root:

```bash
mise install
```

Installs Java 17 and the android-sdk via mise (see `.mise.toml`). Verify:

```bash
echo $JAVA_HOME $ANDROID_HOME
java -version      # should print 17
```

Bubblewrap + dApp Store CLI + PWA asset generator are already in `devDependencies` — `bun install` covers them.

> Bubblewrap's SDK validator rejects mise's `cmdline-tools/<version>/` layout. During init we'll answer **Yes** to "Install the Android SDK?" so Bubblewrap downloads its own SDK into `~/.bubblewrap/`. The two SDKs don't conflict.

## 2. Verify the dev URL is serving the PWA

Bubblewrap reads the live web manifest at init time. `dev.tessera.fun` auto-deploys from the `main` branch via Cloudflare Pages, so you only need to verify it's alive:

```bash
curl -I https://dev.tessera.fun/manifest.webmanifest
# Expect 200, Content-Type: application/manifest+json
```

If it's not 200 yet, or you've just pushed PWA-related changes (new manifest fields, icons, `assetlinks.json`), push the commit to `main` and wait for Cloudflare Pages to finish the build before continuing.

Override the host with an env var if you want to point the APK at a different host (e.g., a short-lived preview alias):

```bash
TESSERA_APK_HOST=some-branch.tesserapoc.pages.dev bun run mobile:bubblewrap:init:dev
```

## 3. First-time Bubblewrap init

```bash
bun run mobile:bubblewrap:init:dev
```

Answer prompts (⚠ = must match exactly; blanks can be accepted as default):

| Prompt | Answer |
| --- | --- |
| Install the JDK? | **No** (we use mise's Java 17) |
| Path to JDK | press enter if auto-detected matches `$JAVA_HOME`, else paste `$JAVA_HOME` |
| Install the Android SDK? | **Yes** ⚠ (sidesteps the cmdline-tools layout issue) |
| Domain | default — taken from `--manifest` URL |
| URL path | `/` |
| Application name | `Tessera Dev` |
| Short name | `Tessera Dev` |
| Application ID / Package name | `pe.tessera.app.dev` ⚠ |
| Starting version code | `1` |
| Display mode | `standalone` |
| Orientation | `default` or `portrait` |
| Status bar color | default |
| Splash screen background color | default (`#131314`) |
| Icon URL | default |
| Maskable icon URL | default |
| Monochrome icon URL | leave blank |
| Include app shortcuts? | `No` |
| Signing key path | absolute path to `android/dev/android.keystore`, e.g. `/Users/you/code/TesseraPOC/android/dev/android.keystore` ⚠ (relative path breaks — Bubblewrap passes it to `keytool` with the wrong CWD) |
| Key name | `android` |
| Key store password | `tessera-dev` ⚠ |
| Key password | `tessera-dev` ⚠ |
| First and Last name | anything (e.g., `Tessera Dev`) |
| Organizational Unit | `Engineering` |
| Organization | `Tessera` |
| Country | `SG` (or your 2-letter country) |

After init succeeds, commit the two files the gitignore explicitly un-ignores:

```bash
git add android/dev/android.keystore android/dev/twa-manifest.json
git commit -m "Add dev TWA config and keystore"
```

Everything else Bubblewrap wrote under `android/dev/` (gradle wrapper, app/, build/) is gitignored and regenerable via `bubblewrap update`.

## 4. Publish the dev fingerprint to `assetlinks.json`

Init prints a `assetlinks.json` snippet with the SHA-256 fingerprint of the dev keystore. Add it to `public/.well-known/assetlinks.json` (which currently contains `[]`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "pe.tessera.app.dev",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  }
]
```

First check whether the fingerprint is already live on the preview URL:

```bash
curl -s https://dev.tessera.fun/.well-known/assetlinks.json | grep -i "$(keytool -list -v -keystore android/dev/android.keystore -storepass tessera-dev -alias android 2>/dev/null | grep SHA256 | awk '{print $2}')"
```

If that prints the fingerprint, skip ahead to step 5 — nothing to deploy.

If it doesn't (just changed `assetlinks.json`, or first time), commit to `main`, push, wait for Cloudflare Pages to redeploy `dev.tessera.fun`, then:

```bash
curl -I https://dev.tessera.fun/.well-known/assetlinks.json
# Expect 200, Content-Type: application/json
```

Without this, Android launches the APK with the Chrome URL bar instead of full-screen TWA.

## 5. Build + install the APK

```bash
bun run mobile:bubblewrap:build:dev
```

The npm script exports `BUBBLEWRAP_KEYSTORE_PASSWORD=tessera-dev` and `BUBBLEWRAP_KEY_PASSWORD=tessera-dev` so you're not re-prompted. Output at `android/dev/app-release-signed.apk`.

Install on a connected Seeker / Android device:

```bash
adb install -r android/dev/app-release-signed.apk
```

Launch **Tessera Dev** from the home screen. Checks:

- Opens full-screen with no URL bar → TWA + assetlinks verified
- Connect Wallet → Dynamic dialog shows "Mobile Wallet Adapter" → tapping it hands off to Seed Vault / Phantom / Solflare for signing
- Remote-debug with `chrome://inspect/#devices`: Application → Service Workers shows `activated`; Network tab shows `/api/*`, RPC, GraphQL bypassing the SW

## 6. Iterating

**Web code changes don't need a new APK.** The TWA is a thin wrapper; every launch loads the latest web assets from `dev.tessera.fun`. Just push to `main` — Cloudflare Pages rebuilds `dev.tessera.fun`, and next time the TWA opens (or after a pull-to-refresh) the new content takes over.

Rebuild the APK **only** when:

- `twa-manifest.json` changed (name, colors, shortcuts)
- `public/manifest.webmanifest` changed (start_url, new required icon)
- Target Android SDK / version code was bumped
- Keystore fingerprint needs to change

In those cases:

```bash
bun run mobile:bubblewrap:update:dev
bun run mobile:bubblewrap:build:dev
adb install -r android/dev/app-release-signed.apk
```

## 7. Regenerating PWA icons (when the logo changes)

```bash
bun run mobile:icons
```

Reads `public/pwa-source-icon.svg`, writes `public/pwa-{64,192,512}x*.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico`. Commit, redeploy, rebuild the APK.

## If the dev keystore is lost

Delete `android/dev/android.keystore`, rerun `bun run mobile:bubblewrap:init:dev` (same answers), commit the new `android/dev/android.keystore`, copy the new SHA-256 into `public/.well-known/assetlinks.json`, redeploy. Every teammate must `adb uninstall pe.tessera.app.dev` before installing the rebuilt APK because the signature changed.

## Troubleshooting

- **`The provided androidSdk isn't correct.`** — Rerun init and answer **Yes** to "Install the Android SDK?". mise's SDK layout is incompatible with Bubblewrap's validator.
- **`Command failed: keytool ... -keystore "android/dev-keystore/..."`** — Leftover from an earlier (different) keystore path. Rerun init; at the "Signing key path" prompt, accept the default or paste the absolute path.
- **`INSTALL_FAILED_UPDATE_INCOMPATIBLE`** — Device already has an APK with a different signature for the same package ID. `adb uninstall pe.tessera.app.dev` first.
- **TWA opens with Chrome URL bar.** `assetlinks.json` isn't reachable on the host, or the SHA-256 in it doesn't match the installed APK's cert. Redeploy the preview host and reinstall.
- **Wallet connect dialog is empty.** MWA registration requires a secure context. Remote-debug and check `window.isSecureContext === true` and look for `Loaded Solana Mobile Wallet Adapter` in the console.
- **`/api/*` requests fail offline.** Expected — the service worker excludes API/RPC routes on purpose. DevTools Network confirms they bypass the SW.
- **Bubblewrap re-prompts for keystore password.** Run via `bun run mobile:bubblewrap:build:dev`, not by calling `bubblewrap build` directly — the npm script is what sets the password env vars.
