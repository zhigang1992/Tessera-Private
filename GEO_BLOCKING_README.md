# Geo-blocking Implementation for Tessera

This document explains the geo-blocking implementation that restricts access to Tessera from certain jurisdictions.

## Overview

The implementation blocks users from 14 jurisdictions as defined in the Terms of Service at https://terms.tessera.pe:

1. United States of America
2. People's Republic of China
3. Central African Republic
4. Democratic People's Republic of Korea (North Korea)
5. Democratic Republic of Congo
6. Belarus
7. Iran
8. Libya
9. Mali
10. Russia
11. Somalia
12. South Sudan
13. Sudan
14. Yemen

## Architecture

The geo-blocking uses a **defense-in-depth** approach with two layers:

### Layer 1: Cloudflare WAF (Recommended - Primary Defense)
- Blocks users at the edge before they reach your application
- Saves bandwidth and resources
- Provides the best user experience

### Layer 2: Application-Level Check (Secondary Defense)
- Uses Cloudflare headers to detect user location
- Shows an undismissable modal to blocked users
- Catches users who might bypass Cloudflare

## Files Created

```
webapp/
├── src/
│   ├── lib/
│   │   └── geo-blocking.ts              # Geo-blocking utility functions
│   └── components/
│       ├── geo-block-modal.tsx          # Undismissable modal component
│       └── app-providers.tsx            # Updated to include GeoBlockModal
├── functions/
│   └── geo-check.json.ts                # Cloudflare Pages Function
└── cloudflare-worker-geo-check.js       # Alternative Cloudflare Worker
```

## Setup Instructions

### Step 1: Deploy the Geo-Check Endpoint

Choose **ONE** of these methods:

#### Option A: Cloudflare Pages Function (Easiest - Recommended)

The file `functions/geo-check.json.ts` is already created and will be **automatically deployed** when you deploy to Cloudflare Pages.

No additional setup needed! Just deploy your app.

#### Option B: Cloudflare Worker (Alternative)

1. Go to Cloudflare Dashboard > Workers & Pages
2. Click "Create Application" > "Create Worker"
3. Name it: `tessera-geo-check`
4. Replace the code with contents from `cloudflare-worker-geo-check.js`
5. Click "Deploy"
6. Add a route in your domain settings:
   - Pattern: `tessera.fun/geo-check.json`
   - Worker: `tessera-geo-check`

### Step 2: Set Up Cloudflare WAF Rules (Highly Recommended)

1. Go to Cloudflare Dashboard > Security > WAF
2. Click "Create rule"
3. Name: "Block Restricted Jurisdictions"
4. Expression:
   ```
   (ip.geoip.country in {"US" "CN" "CF" "KP" "CD" "BY" "IR" "LY" "ML" "RU" "SO" "SS" "SD" "YE"})
   ```
5. Action: **Block**
6. Response:
   - Type: Custom HTML
   - Status Code: 403
   - Body: (You can customize this)
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Access Restricted</title>
     <style>
       body {
         font-family: system-ui, -apple-system, sans-serif;
         display: flex;
         align-items: center;
         justify-content: center;
         min-height: 100vh;
         margin: 0;
         background: #f5f5f5;
       }
       .container {
         max-width: 500px;
         padding: 2rem;
         background: white;
         border-radius: 8px;
         box-shadow: 0 2px 10px rgba(0,0,0,0.1);
         text-align: center;
       }
       h1 { color: #dc2626; }
     </style>
   </head>
   <body>
     <div class="container">
       <h1>Access Restricted</h1>
       <p>We're sorry, but Tessera is not available in your jurisdiction.</p>
       <p>Due to regulatory requirements, we cannot provide services to users located in certain jurisdictions.</p>
       <p>For more information, please review our <a href="https://terms.tessera.pe">Terms of Service</a>.</p>
     </div>
   </body>
   </html>
   ```
7. Click "Deploy"

### Step 3: Test the Implementation

#### Test in Development (Local)

Since Cloudflare headers won't be present in local development, the modal won't show. To test:

1. Modify `/geo-check.json` endpoint to return a test country:
   ```typescript
   // Temporarily return blocked country for testing
   return new Response(
     JSON.stringify({ country: "US" }),
     // ...
   )
   ```

2. Or mock the endpoint by creating `public/geo-check.json`:
   ```json
   {
     "country": "US"
   }
   ```

#### Test in Production

Use a VPN to connect from a blocked country and verify:
- ✅ Cloudflare blocks at the edge (preferred)
- ✅ OR the modal appears and cannot be dismissed

### Step 4: Monitor and Update

1. **Monitor FATF Lists**: The Terms of Service reference dynamic lists (FATF High-Risk Jurisdictions, UN Sanctions). You may need to update `BLOCKED_COUNTRIES` in `src/lib/geo-blocking.ts` periodically.

2. **Check Cloudflare Analytics**: Monitor blocked requests in Cloudflare Dashboard > Security > Events

## How It Works

### Application Flow

1. **App loads** → `AppProviders` mounts → `GeoBlockModal` component renders
2. **GeoBlockModal** calls `isBlockedCountry()` function
3. **isBlockedCountry()** fetches `/geo-check.json`
4. **Cloudflare Pages Function** reads `CF-IPCountry` header and returns it as JSON
5. **GeoBlockModal** checks if country is in `BLOCKED_COUNTRIES` list
6. **If blocked** → Shows undismissable modal with explanation
7. **If not blocked** → Modal doesn't render, app works normally

### Undismissable Modal Features

The modal prevents dismissal by:
- ✅ Blocking ESC key (`onEscapeKeyDown`)
- ✅ Blocking overlay clicks (`onPointerDownOutside`)
- ✅ Hiding the close button (CSS + `onInteractOutside`)
- ✅ Setting `open={true}` permanently when blocked

## Customization

### Update Blocked Countries

Edit `src/lib/geo-blocking.ts`:

```typescript
export const BLOCKED_COUNTRIES = [
  'US', // United States
  'CN', // China
  // Add more ISO 3166-1 alpha-2 country codes
] as const
```

### Update Modal Content

Edit `src/components/geo-block-modal.tsx` to change:
- Title text
- Description
- Styling
- Links

### Fail-Safe Behavior

By default, if the geo-check fails, the app **fails open** (allows access). To change this to **fail closed** (blocks on error), modify `isBlockedCountry()`:

```typescript
} catch (error) {
  console.error('Failed to check geo-blocking:', error)
  // Change to fail closed:
  return {
    blocked: true, // Changed from false
    country: null,
    countryName: 'Unknown',
  }
}
```

## Troubleshooting

### Modal doesn't show in production
1. Check `/geo-check.json` endpoint returns country code
2. Verify Cloudflare is proxying your domain (orange cloud icon)
3. Check browser console for errors

### Geo-check endpoint returns null
1. Ensure your domain is proxied through Cloudflare (DNS settings)
2. The `CF-IPCountry` header is only added when requests go through Cloudflare
3. For local development, use the test mock approach above

### Users report being blocked incorrectly
1. Check if they're using a VPN
2. Verify the country code in `CF-IPCountry` header
3. Review Cloudflare Security Events logs

## Security Considerations

1. **Don't rely solely on client-side checks** - Use Cloudflare WAF rules as primary defense
2. **VPN Bypass** - Users can bypass geo-blocking with VPNs. This is acceptable for compliance purposes as they are making false representations
3. **Header Spoofing** - The `CF-IPCountry` header can only be spoofed if Cloudflare is bypassed
4. **Fail-Open vs Fail-Closed** - Current implementation fails open (safer for legitimate users)

## Compliance Notes

Per the Terms of Service at https://terms.tessera.pe:

- Users from blocked jurisdictions who access via VPN are making false representations (Section 3.1)
- These representations are "deemed repeated each time you access and/or use Tessera"
- This implementation provides reasonable technical measures to enforce the restrictions
- The undismissable modal ensures users are informed of the restrictions

## Support

For questions or issues, contact the development team or refer to:
- Terms of Service: https://terms.tessera.pe
- Cloudflare Documentation: https://developers.cloudflare.com/
