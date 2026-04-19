import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

const DEFAULT_DYNAMIC_ENVIRONMENT_ID = '28958007-e672-4e24-bd56-abadc9d639e9'

export type VerifiedCredential = {
  id?: string
  format?: string
  oauth_provider?: string
  oauth_username?: string
  oauth_display_name?: string
  oauth_account_id?: string
  oauth_emails?: string[]
  oauth_account_photos?: string[]
  public_identifier?: string
  verified_at?: string
}

export type DynamicJwtClaims = JWTPayload & {
  sub?: string
  verified_credentials?: VerifiedCredential[]
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(environmentId: string) {
  const cached = jwksCache.get(environmentId)
  if (cached) return cached
  const url = new URL(`https://app.dynamicauth.com/api/v0/sdk/${environmentId}/.well-known/jwks`)
  const jwks = createRemoteJWKSet(url)
  jwksCache.set(environmentId, jwks)
  return jwks
}

export function resolveDynamicEnvironmentId(env: { DYNAMIC_ENVIRONMENT_ID?: string }): string {
  return env.DYNAMIC_ENVIRONMENT_ID?.trim() || DEFAULT_DYNAMIC_ENVIRONMENT_ID
}

export async function verifyDynamicJwt(
  token: string,
  environmentId: string,
): Promise<DynamicJwtClaims> {
  const jwks = getJwks(environmentId)
  const { payload } = await jwtVerify(token, jwks)
  return payload as DynamicJwtClaims
}

export function findTwitterCredential(claims: DynamicJwtClaims): VerifiedCredential | null {
  const credentials = claims.verified_credentials
  if (!Array.isArray(credentials)) return null
  return (
    credentials.find(
      (c) => c?.format === 'oauth' && (c.oauth_provider === 'twitter' || c.oauth_provider === 'x'),
    ) ?? null
  )
}
