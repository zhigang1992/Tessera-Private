# Cross-Domain Consent Implementation

## Overview

The Tessera web app (`app.tessera.pe`) now implements cross-domain cookie sharing for user consent (Terms & Conditions and Cookie Consent). When users accept these agreements on one domain, they won't need to accept again when navigating to the other.

## How It Works

### For tessera.pe domains:
- Cookies are set on `.tessera.pe` (parent domain)
- Both `app.tessera.pe` and `tessera.pe` can read/write these cookies
- Users only need to accept once across both sites

### For other domains:
- Cookies are set on the specific domain only (e.g., `dev.tessera.fun`)
- No cross-domain sharing occurs
- Each domain maintains its own consent state

### Fallback Strategy:
- All consent is stored in **both** cookies (for cross-domain) **and** localStorage (for backup)
- If cookies are disabled, localStorage serves as fallback
- This ensures consent is never lost

## Storage Keys

The following keys are used for consent storage:

| Key | Purpose | Expiry |
|-----|---------|--------|
| `tessera_cookie_consent` | Cookie consent acceptance | 365 days |
| `tessera_terms_accepted` | Terms & Conditions acceptance | 365 days |

## Integration Guide for Marketing Site (tessera.pe)

### Option 1: Copy the Utility (Recommended)

Copy the cross-domain storage utility from the web app:

**File:** `src/lib/cross-domain-storage.ts`

This TypeScript file can be used as-is in any TypeScript/JavaScript project.

### Option 2: Implement Your Own

If you prefer to implement your own solution, follow this pattern:

```javascript
// Set consent cookie
function setConsent(key, value) {
  const hostname = window.location.hostname

  // Determine domain
  let domain = ''
  if (hostname.endsWith('.tessera.pe') || hostname === 'tessera.pe') {
    domain = '; domain=.tessera.pe'
  }

  // Set cookie
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; max-age=31536000; path=/; secure; samesite=lax${domain}`

  // Also set in localStorage as backup
  localStorage.setItem(key, value)
}

// Get consent value
function getConsent(key) {
  // Try cookie first
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    cookie = cookie.trim()
    const [name, value] = cookie.split('=')
    if (decodeURIComponent(name) === key) {
      return decodeURIComponent(value)
    }
  }

  // Fallback to localStorage
  return localStorage.getItem(key)
}

// Check if terms accepted
function hasAcceptedTerms() {
  return getConsent('tessera_terms_accepted') === 'true'
}

// Check if cookies accepted
function hasAcceptedCookies() {
  const consent = getConsent('tessera_cookie_consent')
  if (!consent) return false

  try {
    const parsed = JSON.parse(consent)
    return parsed.accepted === true
  } catch {
    return false
  }
}
```

### Implementation Examples

#### Terms & Conditions Modal

```javascript
// Check on page load
if (!hasAcceptedTerms()) {
  showTermsModal()
}

// When user accepts
function onAcceptTerms() {
  setConsent('tessera_terms_accepted', 'true')
  hideTermsModal()
}
```

#### Cookie Consent Banner

```javascript
// Check on page load
if (!hasAcceptedCookies()) {
  showCookieBanner()
}

// When user accepts
function onAcceptCookies() {
  const consent = { accepted: true }
  setConsent('tessera_cookie_consent', JSON.stringify(consent))
  hideCookieBanner()
}

// When user rejects
function onRejectCookies() {
  const consent = { accepted: false }
  setConsent('tessera_cookie_consent', JSON.stringify(consent))
  hideCookieBanner()
}
```

## Testing

### Test Scenarios:

1. **Same-domain acceptance:**
   - Accept terms on `app.tessera.pe`
   - Verify no modal appears on subsequent visits to `app.tessera.pe`

2. **Cross-domain acceptance:**
   - Accept terms on `app.tessera.pe`
   - Navigate to `tessera.pe`
   - Verify no terms modal appears on `tessera.pe`
   - Vice versa: accept on `tessera.pe`, verify no modal on `app.tessera.pe`

3. **Other domains:**
   - Accept terms on `dev.tessera.fun`
   - Verify consent is NOT shared with `app.tessera.pe` or `tessera.pe`
   - Each domain maintains independent consent

4. **Cookie disabled fallback:**
   - Disable cookies in browser
   - Accept terms (should save to localStorage)
   - Refresh page
   - Verify no modal appears (localStorage fallback working)

### Testing in Browser DevTools:

```javascript
// Check current domain configuration
import { getDomainConfig } from '@/lib/cross-domain-storage'
console.log(getDomainConfig())
// Output: { hostname: 'app.tessera.pe', sharedDomain: '.tessera.pe', isCrossDomain: true }

// Check if cross-domain cookies are active
import { isUsingCrossDomainCookies } from '@/lib/cross-domain-storage'
console.log(isUsingCrossDomainCookies()) // true on tessera.pe domains

// View all cookies
document.cookie

// Clear consent (for testing)
import { removeCrossDomainStorage } from '@/lib/cross-domain-storage'
removeCrossDomainStorage('tessera_terms_accepted')
removeCrossDomainStorage('tessera_cookie_consent')
```

## Browser Compatibility

- ✅ Chrome, Edge, Safari, Firefox (all modern versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Incognito/Private mode (cookies cleared on session end as expected)
- ⚠️ Third-party cookie blocking doesn't affect this (these are first-party cookies)

## Security Considerations

- Cookies are set with `Secure` flag (HTTPS only)
- `SameSite=Lax` prevents CSRF attacks
- No sensitive data is stored (only boolean consent flags)
- 365-day expiry (user can clear manually via browser settings)

## Troubleshooting

### Consent not persisting:
- Check browser cookie settings
- Verify HTTPS is used (Secure cookies require HTTPS)
- Check localStorage quota (fallback)

### Cross-domain not working:
- Verify both sites are on `tessera.pe` domain
- Check cookie domain in DevTools → Application → Cookies
- Should see `domain=.tessera.pe` for shared cookies

### Users seeing modal twice:
- Likely hitting app before marketing team implements the utility
- Once both sites use the same storage keys, this will resolve

## Contact

For questions or issues, contact the Tessera development team or open an issue in the repository.

## Deployment Checklist

- [ ] Deploy web app with cross-domain storage
- [ ] Test on staging (`app.staging.tessera.pe` if available)
- [ ] Coordinate with marketing team for their implementation
- [ ] Deploy marketing site with cross-domain storage
- [ ] Test cross-domain flow on production
- [ ] Monitor for any cookie/consent issues

---

**Last Updated:** February 2026
**Version:** 1.0.0
