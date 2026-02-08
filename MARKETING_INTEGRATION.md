# Marketing Site Integration Guide

## Quick Setup

### 1. Add Script to Webflow

In your Webflow project settings, add this to the **Footer Code** section:

```html
<script src="https://app.tessera.pe/marketing-consent-script.js"></script>
```

Or copy the entire script from `public/marketing-consent-script.js` and paste it inline.

### 2. Ensure Modals Have Correct CSS

Make sure your modals are hidden by default in Webflow:

```css
#tos_modal_overlay {
  display: none;
  /* other styles... */
}

#cookie_modal_overlay {
  display: none;
  /* other styles... */
}
```

### 3. Element IDs Required

The script looks for these IDs (make sure they match in Webflow):

| Element | ID | Purpose |
|---------|-------|---------|
| Terms overlay | `tos_modal_overlay` | Container for terms modal |
| Terms button | `tos_modal_button` | "Continue" button to accept terms |
| Cookie overlay | `cookie_modal_overlay` | Container for cookie banner |
| Cookie window | `cookie_modal_window` | (Optional) Cookie banner window |
| Cookie accept | `cookie_btn_accept` | "Accept" button |
| Cookie reject | `cookie_btn_reject` | "Reject" button |

## How It Works

### Display Logic:
1. ✅ Modals start **hidden** (display: none by default)
2. ✅ Script checks for existing consent
3. ✅ If no consent, modal **fades in** with animation
4. ✅ After accepting, modal **fades out**

### Animation:
- **Fade In**: 300ms ease-in-out (shows modal)
- **Fade Out**: 300ms ease-in-out (hides modal)
- Terms modal appears first (100ms delay)
- Cookie banner appears second (500ms delay)

### Cross-Domain:
- ✅ On `tessera.pe` or `*.tessera.pe` → cookies saved to `.tessera.pe`
- ✅ On other domains → cookies saved to current domain
- ✅ Users won't see modals twice when navigating between sites

## Testing

### Test in Browser Console:

```javascript
// Check current consent status
tesseraConsent.check()

// Clear all consent and reload (to test again)
tesseraConsent.clearAll()

// Force show terms modal (for testing)
tesseraConsent.showTerms()

// Force show cookie banner (for testing)
tesseraConsent.showCookies()
```

### Test Scenarios:

1. **First visit (no consent)**:
   - Terms modal fades in after 100ms
   - Cookie banner fades in after 500ms

2. **Accept terms, reload**:
   - Terms modal stays hidden
   - Cookie banner still shows

3. **Accept cookies, reload**:
   - Both modals stay hidden

4. **Cross-domain test**:
   - Accept on `app.tessera.pe`
   - Visit `tessera.pe`
   - Should NOT see modals

## Storage Keys

These keys are shared with the app:

```javascript
tessera_terms_accepted = "true"
tessera_cookie_consent = '{"accepted":true}'
```

## Customization

### Change animation duration:

```javascript
// In the script, modify these values:
fadeIn(tosOverlay, 500);  // 500ms instead of 300ms
fadeOut(tosOverlay, 500); // 500ms instead of 300ms
```

### Change timing:

```javascript
// Adjust delays in init():
setTimeout(() => {
  fadeIn(tosOverlay, 300);
}, 200); // Change from 100ms to 200ms
```

## Troubleshooting

### Modals not showing:
- Check element IDs match exactly
- Check browser console for errors
- Run `tesseraConsent.check()` to see consent status
- Run `tesseraConsent.clearAll()` to reset

### Modals showing every time:
- Cookies may be blocked by browser
- Check if HTTPS is enabled (required for Secure cookies)
- Check browser console for cookie errors

### Animation not smooth:
- Ensure modals don't have conflicting CSS transitions
- Check that `display: none` is set by default
- Verify no JavaScript conflicts

## Support

For issues, contact the Tessera development team.

---

**Last Updated:** February 2026
