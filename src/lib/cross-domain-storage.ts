/**
 * Cross-Domain Storage Utility
 *
 * Provides a unified storage API that automatically uses cookies for cross-domain
 * persistence when appropriate, and falls back to localStorage otherwise.
 *
 * For tessera.pe domains:
 * - Sets cookies on .tessera.pe to share between app.tessera.pe and tessera.pe
 *
 * For other domains (dev.tessera.fun, localhost, etc.):
 * - Uses domain-specific cookies (no cross-domain sharing)
 * - Also stores in localStorage as backup
 */

interface StorageOptions {
  key: string
  value: string
  expiryDays?: number
}

/**
 * Determines if the current domain should use a shared parent domain for cookies
 * Returns the domain to use for cookies, or null to use the current domain
 */
function getSharedDomain(): string | null {
  const hostname = window.location.hostname

  // Don't set domain for localhost or IPs
  if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null
  }

  // Check if we're on a tessera.pe subdomain
  if (hostname.endsWith('.tessera.pe') || hostname === 'tessera.pe') {
    return '.tessera.pe'
  }

  // For other domains (dev.tessera.fun, etc.), don't use parent domain
  return null
}

/**
 * Sets a value in both cookie and localStorage for redundancy
 */
export function setCrossDomainStorage({ key, value, expiryDays = 365 }: StorageOptions): void {
  // Store in localStorage as backup
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error('Error setting localStorage:', error)
  }

  // Set cookie
  const domain = getSharedDomain()
  const maxAge = expiryDays * 24 * 60 * 60 // Convert days to seconds

  let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  cookieString += `; max-age=${maxAge}`
  cookieString += '; path=/'
  cookieString += '; secure'
  cookieString += '; samesite=lax'

  // Only set domain if we have a shared domain
  if (domain) {
    cookieString += `; domain=${domain}`
  }

  document.cookie = cookieString
}

/**
 * Gets a value from either cookie or localStorage
 * Priority: cookie first (cross-domain), then localStorage (fallback)
 */
export function getCrossDomainStorage(key: string): string | null {
  // Try to get from cookie first (works cross-domain)
  const cookieValue = getCookie(key)
  if (cookieValue !== null) {
    return cookieValue
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error('Error reading localStorage:', error)
    return null
  }
}

/**
 * Removes a value from both cookie and localStorage
 */
export function removeCrossDomainStorage(key: string): void {
  // Remove from localStorage
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }

  // Remove cookie
  const domain = getSharedDomain()

  let cookieString = `${encodeURIComponent(key)}=`
  cookieString += '; max-age=0'
  cookieString += '; path=/'

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  document.cookie = cookieString
}

/**
 * Helper function to read a cookie value
 */
function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '='
  const cookies = document.cookie.split(';')

  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }

  return null
}

/**
 * Check if we're currently using cross-domain cookies
 * Useful for debugging or showing info to developers
 */
export function isUsingCrossDomainCookies(): boolean {
  return getSharedDomain() !== null
}

/**
 * Get the current domain configuration
 * Useful for debugging
 */
export function getDomainConfig() {
  const hostname = window.location.hostname
  const sharedDomain = getSharedDomain()

  return {
    hostname,
    sharedDomain,
    isCrossDomain: sharedDomain !== null,
    cookieDomain: sharedDomain || hostname,
  }
}
