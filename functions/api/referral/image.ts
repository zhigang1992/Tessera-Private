import type { D1Database, KVNamespace, PagesFunction, R2Bucket } from '@cloudflare/workers-types';
import QRCode from 'qrcode-svg';

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  REFERRAL_IMAGES: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
};

interface BrowserRenderingResponse {
  success: boolean;
  result: {
    screenshot: string; // Base64 encoded
    content: string;
  };
  errors?: Array<{ message: string }>;
}

/**
 * Generate QR code SVG string server-side
 */
function generateQRCodeSVG(text: string): string {
  const qr = new QRCode({
    content: text,
    padding: 0,
    width: 106,
    height: 106,
    color: '#000000',
    background: '#ffffff',
    ecl: 'M',
  });
  return qr.svg();
}

/**
 * Generate HTML content for the share card
 * This is used when the origin is localhost (Browser Rendering API can't access localhost)
 */
function generateShareCardHTML(code: string, _origin: string): string {
  // Generate the referral URL for QR code
  const referralUrl = `https://tessera.fun/?code=${code}`;
  const qrCodeSVG = generateQRCodeSVG(referralUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Share ${code}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 800px;
      height: 450px;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      overflow: hidden;
    }
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 40px 50px;
      z-index: 1;
    }
    .left-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      height: 32px;
      width: auto;
    }
    .ref-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ref-label {
      font-size: 24px;
      font-weight: 900;
      color: #000;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .code-box {
      background: white;
      border-radius: 15px;
      padding: 18px 30px;
      display: inline-block;
      max-width: fit-content;
    }
    .code {
      font-size: 38px;
      font-weight: 900;
      color: #000;
      letter-spacing: 5px;
      font-family: 'Courier New', monospace;
    }
    .qr-section {
      display: flex;
      flex-direction: row;
      gap: 15px;
      align-items: center;
    }
    .qr-container {
      background: white;
      border-radius: 15px;
      padding: 12px;
      display: inline-block;
      width: 130px;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container svg {
      width: 106px;
      height: 106px;
      display: block;
    }
    .qr-text {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      line-height: 1.3;
    }
    .right-section {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  </style>
</head>
<body>
  <img src="https://r2.tessera.fun/bg_1.png" alt="Background" class="background">

  <div class="container">
    <div class="left-section">
      <div class="logo-container">
        <img src="https://r2.tessera.fun/TerreraLogo.png" alt="Tessera Logo" class="logo">
      </div>

      <div class="ref-section">
        <div class="ref-label">REF:</div>
        <div class="code-box">
          <div class="code">${code}</div>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-container">
          ${qrCodeSVG}
        </div>
        <div class="qr-text">Invite users and earn points</div>
      </div>
    </div>

    <div class="right-section">
      <!-- Right side with the person image is part of the background -->
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * API endpoint to generate referral code share images
 * GET /api/referral/image?code=XXXXX
 *
 * This endpoint generates a share image for a referral code by:
 * 1. Checking if the code exists in the database
 * 2. Checking if an image already exists in R2 storage
 * 3. If not, using Cloudflare Browser Rendering API to capture the share modal
 * 4. Saving and returning the image
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing code parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate code format (alphanumeric, 4-10 chars)
  if (!/^[a-zA-Z0-9]{4,10}$/.test(code)) {
    return new Response(JSON.stringify({ error: 'Invalid code format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if the referral code exists in the database
    const referralCode = await env.DB.prepare('SELECT code_slug FROM referral_codes WHERE code_slug = ?')
      .bind(code)
      .first();

    if (!referralCode) {
      return new Response(JSON.stringify({ error: 'Referral code not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if image already exists in R2
    const imageKey = `referral-${code}.png`;
    const existingImage = await env.REFERRAL_IMAGES.get(imageKey);

    if (existingImage) {
      // Return cached image
      return new Response(existingImage.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        },
      });
    }

    // Generate new image using Browser Rendering API
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the origin from the request to construct the share URL
    const origin = url.origin;

    // Create HTML content for the share card
    // We always use HTML rendering instead of URL to have full control
    const htmlContent = generateShareCardHTML(code, origin);

    // Call Browser Rendering API
    const browserRenderingUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/snapshot`;

    const renderResponse = await fetch(browserRenderingUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        viewport: {
          width: 800,
          height: 450,
        },
        screenshotOptions: {
          fullPage: false,
          type: 'png',
        },
        gotoOptions: {
          waitUntil: 'load', // Wait for page to load
          timeout: 15000,
        },
      }),
    });

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      console.error('Browser Rendering API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorText }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const renderData = (await renderResponse.json()) as BrowserRenderingResponse;

    if (!renderData.success || !renderData.result?.screenshot) {
      console.error('Browser Rendering API returned unsuccessful response:', renderData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate screenshot', details: renderData.errors }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Decode base64 screenshot
    const screenshotBase64 = renderData.result.screenshot;
    const screenshotBuffer = Uint8Array.from(atob(screenshotBase64), (c) => c.charCodeAt(0));

    // Save to R2
    await env.REFERRAL_IMAGES.put(imageKey, screenshotBuffer, {
      httpMetadata: {
        contentType: 'image/png',
      },
    });

    // Return the generated image
    return new Response(screenshotBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating referral image:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
