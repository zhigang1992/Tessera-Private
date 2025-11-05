/**
 * Export Production Referral Data (READ-ONLY)
 *
 * This script exports existing referral codes and user bindings from the
 * production Cloudflare D1 database. It is READ-ONLY and makes no modifications
 * to the production database.
 *
 * Usage:
 *   bun run scripts/export-production-data.ts
 *
 * Output:
 *   data/migration-export.json - Complete export with validation
 */

import fs from 'fs'

interface ExportedCode {
  code: string
  owner: string // wallet address
  createdAt: string
  activeLayer: number
}

interface ExportedBinding {
  user: string // wallet address
  code: string
  tier1: string | null // direct referrer
  tier2: string | null // grandparent
  tier3: string | null // great-grandparent
}

interface ExportStats {
  totalCodes: number
  validCodes: number
  invalidCodes: number
  totalBindings: number
  estimatedSOL: number
  estimatedUSD: number
}

interface ExportData {
  exportDate: string
  validCodes: ExportedCode[]
  invalidCodes: ExportedCode[]
  bindings: ExportedBinding[]
  stats: ExportStats
}

/**
 * Validate referral code format for on-chain compatibility
 */
function validateCode(code: string): { valid: boolean; reason?: string } {
  if (code.length < 6) {
    return { valid: false, reason: 'Too short (min 6 chars)' }
  }
  if (code.length > 12) {
    return { valid: false, reason: 'Too long (max 12 chars)' }
  }
  if (!/^[a-zA-Z0-9]+$/.test(code)) {
    return { valid: false, reason: 'Invalid characters (alphanumeric only)' }
  }
  return { valid: true }
}

/**
 * Calculate estimated migration costs
 */
function calculateCosts(numCodes: number, numUsers: number) {
  const RENT_PER_CODE = 0.001 // SOL
  const RENT_PER_USER = 0.002 // SOL
  const TX_FEE = 0.000005 // SOL per transaction
  const SOL_PRICE_USD = 200 // Approximate

  const rentCost = numCodes * RENT_PER_CODE + numUsers * RENT_PER_USER
  const feesCost = (numCodes + numUsers) * TX_FEE
  const totalSOL = rentCost + feesCost
  const totalUSD = totalSOL * SOL_PRICE_USD

  return {
    totalSOL: parseFloat(totalSOL.toFixed(4)),
    totalUSD: parseFloat(totalUSD.toFixed(2)),
  }
}

/**
 * IMPORTANT: This function needs to be connected to your production D1 database
 *
 * For now, this is a template. You need to:
 * 1. Set up Cloudflare Workers authentication
 * 2. Connect to production D1 database
 * 3. Execute the queries below
 *
 * DO NOT modify the database - READ ONLY!
 */
async function exportFromProduction(): Promise<ExportData> {
  console.log('🔍 Starting production data export (READ-ONLY)...\n')

  // TODO: Connect to production Cloudflare D1 database
  // This is a placeholder - replace with actual D1 connection
  // Example:
  // const db = await connectToCloudflareD1({
  //   accountId: process.env.CF_ACCOUNT_ID,
  //   databaseId: process.env.CF_DATABASE_ID,
  //   apiToken: process.env.CF_API_TOKEN,
  // });

  console.log('⚠️  IMPORTANT: You need to connect this script to production D1')
  console.log('⚠️  Modify this script to use your Cloudflare credentials\n')

  // Query 1: Export all active referral codes
  const codesQuery = `
    SELECT
      code_slug as code,
      wallet_address as owner,
      created_at,
      active_layer
    FROM referral_codes
    WHERE status = 'active'
    ORDER BY created_at ASC
  `

  // Query 2: Export all user bindings with 3-tier tree structure
  const bindingsQuery = `
    SELECT
      tb.wallet_address as user,
      rc.code_slug as code,
      te1.ancestor_wallet as tier1,
      te2.ancestor_wallet as tier2,
      te3.ancestor_wallet as tier3
    FROM trader_bindings tb
    JOIN referral_codes rc ON tb.referrer_code_id = rc.id
    LEFT JOIN referral_tree_edges te1
      ON te1.descendant_wallet = tb.wallet_address AND te1.level = 1
    LEFT JOIN referral_tree_edges te2
      ON te2.descendant_wallet = tb.wallet_address AND te2.level = 2
    LEFT JOIN referral_tree_edges te3
      ON te3.descendant_wallet = tb.wallet_address AND te3.level = 3
    ORDER BY tb.bound_at ASC
  `

  // Placeholder data for template
  // Replace this with actual database query results
  const mockCodes: ExportedCode[] = [
    // Example format:
    // {
    //   code: "TESTCODE",
    //   owner: "4xK1X7...", // Solana wallet address
    //   createdAt: "2024-01-01T00:00:00.000Z",
    //   activeLayer: 3
    // }
  ]

  const mockBindings: ExportedBinding[] = [
    // Example format:
    // {
    //   user: "7yN2M8...",
    //   code: "TESTCODE",
    //   tier1: "4xK1X7...", // direct referrer
    //   tier2: "9zA3B4...", // grandparent
    //   tier3: "2wQ5R6..."  // great-grandparent
    // }
  ]

  console.log(`📊 Query templates prepared:`)
  console.log(`   - Codes query: ${codesQuery.split('\n').length} lines`)
  console.log(`   - Bindings query: ${bindingsQuery.split('\n').length} lines\n`)

  // TODO: Execute queries and get results
  // const codesResult = await db.execute(codesQuery);
  // const bindingsResult = await db.execute(bindingsQuery);
  // const allCodes = codesResult.results as ExportedCode[];
  // const allBindings = bindingsResult.results as ExportedBinding[];

  const allCodes = mockCodes // Replace with actual query
  const allBindings = mockBindings // Replace with actual query

  // Validate codes
  const validCodes: ExportedCode[] = []
  const invalidCodes: ExportedCode[] = []

  for (const codeData of allCodes) {
    const validation = validateCode(codeData.code)
    if (validation.valid) {
      validCodes.push(codeData)
    } else {
      invalidCodes.push(codeData)
      console.log(`⚠️  Invalid code: ${codeData.code} - ${validation.reason}`)
      console.log(`   Owner: ${codeData.owner}`)
      console.log(`   Created: ${codeData.createdAt}\n`)
    }
  }

  // Calculate costs
  const costs = calculateCosts(validCodes.length, allBindings.length)

  const stats: ExportStats = {
    totalCodes: allCodes.length,
    validCodes: validCodes.length,
    invalidCodes: invalidCodes.length,
    totalBindings: allBindings.length,
    estimatedSOL: costs.totalSOL,
    estimatedUSD: costs.totalUSD,
  }

  return {
    exportDate: new Date().toISOString(),
    validCodes,
    invalidCodes,
    bindings: allBindings,
    stats,
  }
}

/**
 * Save export data to JSON file
 */
function saveExport(data: ExportData) {
  const outputPath = 'data/migration-export.json'

  // Ensure data directory exists
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true })
  }

  // Save export
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

  console.log(`\n✅ Export saved to: ${outputPath}`)
}

/**
 * Display export summary
 */
function displaySummary(data: ExportData) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 EXPORT SUMMARY')
  console.log('='.repeat(60))

  console.log('\n📅 Export Date:', data.exportDate)

  console.log('\n📝 Referral Codes:')
  console.log(`   Total codes:     ${data.stats.totalCodes}`)
  console.log(`   ✅ Valid codes:  ${data.stats.validCodes} (will be migrated)`)
  console.log(`   ❌ Invalid codes: ${data.stats.invalidCodes} (need attention)`)

  console.log('\n👥 User Bindings:')
  console.log(`   Total bindings:  ${data.stats.totalBindings}`)

  console.log('\n💰 Estimated Migration Cost:')
  console.log(`   Total SOL:       ${data.stats.estimatedSOL} SOL`)
  console.log(`   Total USD:       ~$${data.stats.estimatedUSD} (at $200/SOL)`)

  if (data.invalidCodes.length > 0) {
    console.log('\n⚠️  INVALID CODES FOUND:')
    console.log('   The following codes cannot be migrated and need attention:')
    data.invalidCodes.forEach((code, i) => {
      const validation = validateCode(code.code)
      console.log(`   ${i + 1}. ${code.code} - ${validation.reason}`)
      console.log(`      Owner: ${code.owner}`)
    })
    console.log('\n   📋 Action Required:')
    console.log('      - Contact users to update their codes')
    console.log('      - Or pad codes to meet 6-char minimum')
    console.log('      - Document handling strategy for each code')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Export complete! Ready for migration planning.')
  console.log('='.repeat(60) + '\n')
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════════╗')
    console.log('║       PRODUCTION DATA EXPORT (READ-ONLY)                 ║')
    console.log('║       Tessera Referral System Migration                  ║')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')

    console.log('⚠️  SAFETY NOTICE:')
    console.log('   This script is READ-ONLY and will not modify production data.')
    console.log('   It will export data to: data/migration-export.json')
    console.log('   This file is gitignored and will NOT be committed.\n')

    // Export data
    const exportData = await exportFromProduction()

    // Save to file
    saveExport(exportData)

    // Display summary
    displaySummary(exportData)

    console.log('📋 Next Steps:')
    console.log('   1. Review data/migration-export.json')
    console.log('   2. Handle any invalid codes')
    console.log('   3. Run cost estimate: bun run scripts/estimate-migration-cost.ts')
    console.log('   4. Proceed with migration script\n')
  } catch (error) {
    console.error('\n❌ Export failed:', error)
    console.error('\nPlease check:')
    console.error('   - Cloudflare credentials are correct')
    console.error('   - Database connection is working')
    console.error('   - You have read permissions\n')
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.main) {
  main()
}

export { exportFromProduction, validateCode, calculateCosts }
