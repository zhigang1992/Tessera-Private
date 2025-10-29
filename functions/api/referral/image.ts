import type { D1Database, KVNamespace, PagesFunction, R2Bucket } from '@cloudflare/workers-types';

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
 * Generate HTML content for the share card
 * This is used when the origin is localhost (Browser Rendering API can't access localhost)
 */
function generateShareCardHTML(code: string, origin: string): string {
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
      width: 1200px;
      height: 630px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 60px;
      max-width: 900px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .description {
      font-size: 24px;
      color: #666;
      margin-bottom: 40px;
    }
    .code-container {
      background: #f5f5f5;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .code-label {
      font-size: 18px;
      color: #666;
      margin-bottom: 10px;
    }
    .code {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      font-size: 20px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎯 Tessera</div>
    <div class="title">Join Tessera!</div>
    <div class="description">Use my referral code to get started with private equity trading</div>
    <div class="code-container">
      <div class="code-label">REFERRAL CODE</div>
      <div class="code">${code}</div>
    </div>
    <div class="footer">${origin}</div>
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

    // For localhost/development, we can't use URL since Browser Rendering API can't access it
    // Instead, we'll use HTML content directly
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    // Create HTML content for the share card
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
        ...(isLocalhost ? { html: htmlContent } : { url: `${origin}/?code=${code}&share_modal=true` }),
        viewport: {
          width: 1200,
          height: 630, // Standard social media share dimensions
        },
        screenshotOptions: {
          fullPage: false,
          type: 'png',
        },
        gotoOptions: {
          waitUntil: 'load', // Wait for page to load
          timeout: 10000,
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
