/**
 * Geo-blocking utilities for Tessera
 * Checks if user is accessing from a blocked jurisdiction
 */

export const BLOCKED_COUNTRIES = [
  'US', // United States of America
  'CN', // People's Republic of China
  'CF', // Central African Republic
  'KP', // Democratic People's Republic of Korea (North Korea)
  'CD', // Democratic Republic of Congo
  'BY', // Belarus
  'IR', // Iran
  'LY', // Libya
  'ML', // Mali
  'RU', // Russia
  'SO', // Somalia
  'SS', // South Sudan
  'SD', // Sudan
  'YE', // Yemen
] as const

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States of America',
  CN: "People's Republic of China",
  CF: 'Central African Republic',
  KP: "Democratic People's Republic of Korea",
  CD: 'Democratic Republic of Congo',
  BY: 'Belarus',
  IR: 'Iran',
  LY: 'Libya',
  ML: 'Mali',
  RU: 'Russia',
  SO: 'Somalia',
  SS: 'South Sudan',
  SD: 'Sudan',
  YE: 'Yemen',
}

/**
 * Checks if the current request is from a blocked country
 * Uses Cloudflare's CF-IPCountry header via a simple endpoint
 *
 * Note: You need to create a simple endpoint at /geo-check.json that returns:
 * { "country": "US" } where the country code comes from CF-IPCountry header
 *
 * This can be done with Cloudflare Workers or a simple serverless function.
 */
export async function isBlockedCountry(): Promise<{
  blocked: boolean
  country: string | null
  countryName: string | null
}> {
  try {
    // Fetch the geo-check endpoint
    // This endpoint should be a simple Cloudflare Worker or static JSON file
    // that includes the CF-IPCountry header value
    const response = await fetch('/geo-check.json', {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Geo-check endpoint not available')
    }

    const data = await response.json()
    const country = data.country || null

    const blocked = country ? BLOCKED_COUNTRIES.includes(country) : false
    const countryName = country && blocked ? COUNTRY_NAMES[country] || country : null

    return {
      blocked,
      country,
      countryName,
    }
  } catch (error) {
    console.error('Failed to check geo-blocking:', error)
    // Fail open - don't block if check fails
    return {
      blocked: false,
      country: null,
      countryName: null,
    }
  }
}

/**
 * Gets the country code from Cloudflare headers (server-side only)
 * This should be used in your API endpoint
 */
export function getCountryFromHeaders(headers: Headers): string | null {
  return headers.get('CF-IPCountry') || null
}
