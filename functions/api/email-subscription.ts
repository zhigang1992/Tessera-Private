import type { D1Database, PagesFunction } from '@cloudflare/workers-types'

type Env = {
  DB: D1Database
}

interface EmailSubscriptionRequest {
  walletAddress: string
  email: string
  source?: string
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateWalletAddress(address: string): boolean {
  // Basic Solana address validation (base58, 32-44 chars)
  return address.length >= 32 && address.length <= 44
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // Parse request body
    const body = (await request.json()) as EmailSubscriptionRequest

    const { walletAddress, email, source = 'auction_claim' } = body

    // Validate inputs
    if (!walletAddress || typeof walletAddress !== 'string') {
      return Response.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!validateWalletAddress(walletAddress)) {
      return Response.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const db = env.DB

    // Ensure user exists first (required for foreign key)
    await db
      .prepare(
        "INSERT INTO users (wallet_address) VALUES (?) ON CONFLICT(wallet_address) DO UPDATE SET updated_at = datetime('now')",
      )
      .bind(walletAddress)
      .run()

    // Insert or update email subscription
    const result = await db
      .prepare(`
        INSERT INTO email_subscriptions (wallet_address, email, source)
        VALUES (?, ?, ?)
        ON CONFLICT(wallet_address) DO UPDATE SET
          email = excluded.email,
          source = excluded.source,
          updated_at = datetime('now')
      `)
      .bind(walletAddress, email.toLowerCase().trim(), source)
      .run()

    if (!result.success) {
      console.error('Failed to save email subscription:', result.error)
      return Response.json({ error: 'Failed to save email subscription' }, { status: 500 })
    }

    return Response.json(
      {
        success: true,
        message: 'Email subscription saved successfully',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('Email subscription error:', error)
    return Response.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
