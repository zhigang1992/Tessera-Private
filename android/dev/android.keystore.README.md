# Dev Keystore — `android/dev/android.keystore`

Signs the **dev-only** test APK `pe.tessera.app.dev`. Committed on purpose so any developer can rebuild the dev APK with the same signature (same SHA‑256 → same entry in `public/.well-known/assetlinks.json` → same installed APK on everyone's device without `INSTALL_FAILED_UPDATE_INCOMPATIBLE`).

## Credentials

```
File:     android/dev/android.keystore
Alias:    android
Password: tessera-dev   (keystore password AND key password)
```

The `package.json` scripts `mobile:bubblewrap:{update,build}:dev` set `BUBBLEWRAP_KEYSTORE_PASSWORD` / `BUBBLEWRAP_KEY_PASSWORD` to this value so builds don't re-prompt.

## Scope

- Signs **only** `pe.tessera.app.dev`, never the real `pe.tessera.app`.
- Prod keystore lives in 1Password, not in the repo. See `MOBILE_APP_PACKAGING.md` for how to treat it.

## If this keystore is lost

Delete `android/dev/android.keystore`, re-run `bun run mobile:bubblewrap:init:dev` (accept the default keystore path and password above), copy the new SHA‑256 into `public/.well-known/assetlinks.json`, redeploy. Every teammate will need to `adb uninstall pe.tessera.app.dev` before installing the new build because the signature changed.
