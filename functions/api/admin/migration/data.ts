/**
 * Admin Migration Data API
 *
 * GET /api/admin/migration/data
 * Fetches all referral codes and trader bindings for migration
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;

    // Fetch all active referral codes
    const codesQuery = `
      SELECT
        rc.code_slug as code,
        rc.wallet_address as ownerWallet,
        CASE WHEN rc.status = 'active' THEN 1 ELSE 0 END as isActive,
        rc.created_at as createdAt
      FROM referral_codes rc
      WHERE rc.status = 'active'
      ORDER BY rc.created_at
    `;

    const codesResult = await db.prepare(codesQuery).all();

    // Fetch all trader bindings with referral relationships
    const bindingsQuery = `
      SELECT
        tb.wallet_address as userWallet,
        rc.code_slug as referralCode,
        rc.wallet_address as referrerWallet,
        tb.bound_at as boundAt
      FROM trader_bindings tb
      JOIN referral_codes rc ON tb.referrer_code_id = rc.id
      ORDER BY tb.bound_at
    `;

    const bindingsResult = await db.prepare(bindingsQuery).all();

    // Format the response
    const migrationData = {
      referralCodes: codesResult.results.map((row: any) => ({
        code: row.code,
        ownerWallet: row.ownerWallet,
        isActive: Boolean(row.isActive),
        createdAt: row.createdAt,
      })),
      traderBindings: bindingsResult.results.map((row: any) => ({
        userWallet: row.userWallet,
        referralCode: row.referralCode,
        referrerWallet: row.referrerWallet,
        boundAt: row.boundAt,
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        totalCodes: codesResult.results.length,
        totalBindings: bindingsResult.results.length,
        dataSource: 'cloudflare-d1' as const,
      },
    };

    return new Response(JSON.stringify(migrationData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Migration data fetch error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch migration data',
        detail: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
