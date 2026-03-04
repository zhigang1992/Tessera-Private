import { onRequest as geoCheck } from '../functions/geo-check.json'
import { onRequestGet as shareRedirect } from '../functions/s'
import { onRequest as authNonce } from '../functions/api/auth/nonce'
import { onRequest as authVerify } from '../functions/api/auth/verify'
import { onRequestPost as chatCompletions } from '../functions/api/chat/completions'
import { onRequestGet as ledgerlensReserves } from '../functions/api/ledgerlens/reserves'
import { onRequest as merkleProof } from '../functions/api/merkle-proof/[wallet]'
import { onRequestGet as referralAffiliate } from '../functions/api/referral/affiliate'
import { onRequestPost as referralCode } from '../functions/api/referral/code'
import { onRequestGet as referralImage } from '../functions/api/referral/image'
import { onRequestGet as referralTrader } from '../functions/api/referral/trader'
import { onRequestPost as referralTraderBind } from '../functions/api/referral/trader/bind'
import { onRequestGet as adminMigrationData } from '../functions/api/admin/migration/data'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  LEADERBOARD_CACHE: KVNamespace
  REFERRAL_IMAGES: R2Bucket
  CLOUDFLARE_AI_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  APP_ENV: string
}

// Minimal context to satisfy PagesFunction handlers
function createContext(request: Request, env: Env, params: Record<string, string> = {}) {
  return {
    request,
    env,
    params,
    data: {},
    next: async () => new Response('Not Found', { status: 404 }),
    waitUntil: (_promise: Promise<unknown>) => {},
    passThroughOnException: () => {},
    functionPath: '',
  } as unknown as Parameters<typeof geoCheck>[0]
}

function methodNotAllowed(allowed: string): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: allowed },
  })
}

function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return newResponse
}

type Handler = (ctx: ReturnType<typeof createContext>) => Response | Promise<Response>

// Route table: [pathname, method | null, handler]
// method=null means handler does its own method filtering
const routes: [string, string | null, Handler][] = [
  ['/geo-check.json', null, geoCheck as Handler],
  ['/s', 'GET', shareRedirect as Handler],
  ['/api/auth/nonce', null, authNonce as Handler],
  ['/api/auth/verify', null, authVerify as Handler],
  ['/api/chat/completions', 'POST', chatCompletions as Handler],
  ['/api/ledgerlens/reserves', 'GET', ledgerlensReserves as Handler],
  ['/api/referral/affiliate', 'GET', referralAffiliate as Handler],
  ['/api/referral/code', 'POST', referralCode as Handler],
  ['/api/referral/image', 'GET', referralImage as Handler],
  ['/api/referral/trader/bind', 'POST', referralTraderBind as Handler],
  ['/api/referral/trader', 'GET', referralTrader as Handler],
  ['/api/admin/migration/data', 'GET', adminMigrationData as Handler],
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    const { pathname } = url

    try {
      // Static routes
      for (const [path, method, handler] of routes) {
        if (pathname === path) {
          if (method && request.method !== method) {
            return addCorsHeaders(methodNotAllowed(method))
          }
          const response = await handler(createContext(request, env) as never)
          return addCorsHeaders(response)
        }
      }

      // Dynamic route: /api/merkle-proof/:wallet
      if (pathname.startsWith('/api/merkle-proof/')) {
        const wallet = pathname.slice('/api/merkle-proof/'.length)
        if (wallet) {
          const response = await (merkleProof as Handler)(
            createContext(request, env, { wallet }) as never,
          )
          return addCorsHeaders(response)
        }
      }

      return new Response('Not Found', { status: 404 })
    } catch (error) {
      console.error('Worker error:', error)
      return addCorsHeaders(new Response('Internal Server Error', { status: 500 }))
    }
  },
} satisfies ExportedHandler<Env>
