# Referral Image API Setup

This document explains how to set up and use the referral image generation API that uses Cloudflare's Browser Rendering API.

## Overview

The `/api/referral/image` endpoint generates social media share images for referral codes. It:
- Validates the referral code exists in the database
- Checks for cached images in R2 storage
- Generates new images using Cloudflare Browser Rendering API
- Caches images to avoid duplicate generation

## Prerequisites

1. **Cloudflare Account with Browser Rendering enabled**
   - Browser Rendering API is available on Workers Paid plan ($5/month)
   - [Enable Browser Rendering](https://developers.cloudflare.com/browser-rendering/)

2. **R2 Bucket created**
   ```bash
   wrangler r2 bucket create tessera-referral-images
   ```

3. **API Token with appropriate permissions**
   - Go to Cloudflare Dashboard > My Profile > API Tokens
   - Create a token with "Browser Rendering" permission

## Setup Steps

### 1. Create R2 Bucket
```bash
wrangler r2 bucket create tessera-referral-images
```

### 2. Set Environment Variables

For local development, create a `.dev.vars` file:
```env
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here
```

For production, set secrets using wrangler:
```bash
wrangler pages secret put CLOUDFLARE_ACCOUNT_ID
# Enter your account ID when prompted

wrangler pages secret put CLOUDFLARE_API_TOKEN
# Enter your API token when prompted
```

### 3. Find Your Account ID
```bash
# Option 1: Using wrangler
wrangler whoami

# Option 2: From Cloudflare Dashboard
# Go to any Workers/Pages page, the account ID is in the URL:
# dash.cloudflare.com/{account-id}/...
```

## API Usage

### Endpoint
```
GET /api/referral/image?code={REFERRAL_CODE}
```

### Parameters
- `code` (required): The referral code (4-10 alphanumeric characters)

### Response
- **Success**: Returns PNG image with `Content-Type: image/png`
- **Cached**: Images are cached in R2 with 1-year browser cache
- **Error**: Returns JSON with error details

### Example Usage

```html
<!-- In HTML -->
<img src="/api/referral/image?code=BMWJXVTT" alt="Share on Twitter" />

<!-- For Twitter meta tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://yourdomain.com/api/referral/image?code=BMWJXVTT" />
```

```javascript
// In JavaScript
const imageUrl = `/api/referral/image?code=${referralCode}`;

// For Twitter Web Intent
const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageUrl)}`;
```

## How It Works

1. **Request arrives** with a referral code query parameter
2. **Validation** checks if the code exists in the database
3. **Cache check** looks for existing image in R2 bucket
4. **Image generation** (if not cached):
   - Constructs URL: `/?code=XXXXX&share_modal=true`
   - Calls Browser Rendering API to screenshot the page
   - Viewport: 1200x630 (optimized for social media)
   - Waits for network idle to ensure modal is loaded
5. **Storage** saves the image to R2 with PNG content type
6. **Response** returns the image with long-term cache headers

## Frontend Integration

### Modify the Share Component

You'll need to update your frontend to:
1. Accept a `share_modal=true` query parameter
2. Automatically open the share modal when this parameter is present
3. Style the modal for screenshot capture

Example implementation:
```typescript
// In your App or Share component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('share_modal') === 'true') {
    const code = params.get('code');
    if (code) {
      // Open share modal with this code
      openShareModal(code);
    }
  }
}, []);
```

## Cost Considerations

- **Browser Rendering API**: ~$0.50 per 1000 screenshots
- **R2 Storage**: $0.015 per GB per month
- **R2 Operations**: Class A (writes) $4.50 per million, Class B (reads) $0.36 per million
- **Caching**: Images are cached indefinitely, so each code generates only ONE screenshot

## Troubleshooting

### "Server configuration error"
- Check that `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set correctly
- Verify the API token has Browser Rendering permissions

### "Failed to generate image"
- Check Browser Rendering API quota/limits
- Verify the share modal URL is accessible
- Check Browser Rendering API status on Cloudflare Dashboard

### Images not updating
- Images are cached permanently in R2
- To regenerate an image, delete it from R2:
  ```bash
  wrangler r2 object delete tessera-referral-images referral-{CODE}.png
  ```

## Testing Locally

1. Start the dev server:
   ```bash
   bun run dev
   ```

2. Start Cloudflare Pages dev server:
   ```bash
   bun run cf:dev
   ```

3. Test the endpoint:
   ```bash
   curl http://localhost:8788/api/referral/image?code=BMWJXVTT --output test.png
   ```

Note: Browser Rendering API calls will work in local development if you have the proper credentials set in `.dev.vars`.
