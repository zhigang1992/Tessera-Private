#!/usr/bin/env bun
/**
 * D1 Database Export/Import Script
 * Exports data from production D1 and imports to local development
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Configuration
const ACCOUNT_ID = 'b2f75eee8466291920000d9b28137185'
const PRODUCTION_DB_ID = '88a7a5ff-2c9f-468b-bc48-053489f735a7'
const PRODUCTION_DB_BINDING = 'DB'  // From wrangler.toml
const LOCAL_DB_NAME = 'tessera-referral-db-local'
const EXPORT_DIR = './data/d1-export'
const EXPORT_FILE = 'production-export.sql'

interface ExportOptions {
  tables?: string[] // Specific tables to export, or all if not specified
  includeData?: boolean // Include data (true) or schema only (false)
}

/**
 * Ensure export directory exists
 */
async function ensureExportDir() {
  try {
    await fs.mkdir(EXPORT_DIR, { recursive: true })
    console.log(`✅ Export directory ready: ${EXPORT_DIR}`)
  } catch (error) {
    console.error('❌ Failed to create export directory:', error)
    throw error
  }
}

/**
 * List all tables in the production database
 */
async function listTables(): Promise<string[]> {
  console.log('\n📋 Fetching table list from production D1...')

  try {
    const { stdout } = await execAsync(
      `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --remote --json ` +
      `--command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"`
    )

    // Parse JSON output
    const jsonMatch = stdout.match(/\[\s*{[\s\S]*}\s*\]/);
    const tables: string[] = []

    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0])
        if (results[0] && results[0].results) {
          for (const row of results[0].results) {
            if (row.name) {
              tables.push(row.name)
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e)
      }
    }

    console.log(`Found ${tables.length} tables:`, tables.join(', '))
    return tables
  } catch (error) {
    console.error('❌ Failed to list tables:', error)
    throw error
  }
}

/**
 * Export schema and data from production D1
 */
async function exportFromProduction(options: ExportOptions = {}) {
  console.log('\n🚀 Starting export from production D1...')
  console.log(`   Database ID: ${PRODUCTION_DB_ID}`)
  console.log(`   Binding: ${PRODUCTION_DB_BINDING}`)

  const exportPath = path.join(EXPORT_DIR, EXPORT_FILE)
  const tables = options.tables || await listTables()

  let sqlContent = '-- Production D1 Export\n'
  sqlContent += `-- Database ID: ${PRODUCTION_DB_ID}\n`
  sqlContent += `-- Exported: ${new Date().toISOString()}\n\n`

  for (const table of tables) {
    console.log(`\n📊 Exporting table: ${table}`)

    // Export schema
    console.log('   - Fetching schema...')
    try {
      const { stdout: schemaOutput } = await execAsync(
        `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --remote ` +
        `--command "SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}';"`
      )

      // Extract CREATE TABLE statement
      const createMatch = schemaOutput.match(/CREATE TABLE[^;]+;/is)
      if (createMatch) {
        sqlContent += `-- Table: ${table}\n`
        sqlContent += `DROP TABLE IF EXISTS ${table};\n`
        sqlContent += createMatch[0] + '\n\n'
      }

      // Export indexes
      const { stdout: indexOutput } = await execAsync(
        `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --remote ` +
        `--command "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='${table}';"`
      )

      const indexMatches = indexOutput.match(/CREATE INDEX[^;]+;/gis) || []
      for (const index of indexMatches) {
        sqlContent += index + '\n'
      }

      if (indexMatches.length > 0) {
        sqlContent += '\n'
      }
    } catch (error) {
      console.error(`   ⚠️ Failed to export schema for ${table}:`, error)
    }

    // Export data if requested
    if (options.includeData !== false) {
      console.log('   - Fetching data...')
      try {
        const { stdout: dataOutput } = await execAsync(
          `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --remote ` +
          `--json --command "SELECT * FROM ${table};"`
        )

        // Parse JSON output
        const jsonMatch = dataOutput.match(/\[.*\]/s)
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0])

          if (Array.isArray(results) && results.length > 0 && results[0].results) {
            const rows = results[0].results
            console.log(`   - Found ${rows.length} rows`)

            if (rows.length > 0) {
              // Generate INSERT statements
              sqlContent += `-- Data for ${table}\n`

              for (const row of rows) {
                const columns = Object.keys(row)
                const values = Object.values(row).map(val => {
                  if (val === null) return 'NULL'
                  if (typeof val === 'number') return val
                  if (typeof val === 'boolean') return val ? 1 : 0
                  // Escape single quotes in strings
                  return `'${String(val).replace(/'/g, "''")}'`
                })

                sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
              }

              sqlContent += '\n'
            }
          }
        }
      } catch (error) {
        console.error(`   ⚠️ Failed to export data for ${table}:`, error)
      }
    }
  }

  // Write to file
  await fs.writeFile(exportPath, sqlContent)
  console.log(`\n✅ Export completed: ${exportPath}`)

  // Show file size
  const stats = await fs.stat(exportPath)
  console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`)

  return exportPath
}

/**
 * Create or recreate local D1 database
 */
async function createLocalDatabase() {
  console.log('\n🔧 Setting up local D1 database...')

  // For local development, we'll use the DB binding from wrangler.toml
  // The local database is automatically created when first accessed
  console.log(`   Using local database with binding: ${PRODUCTION_DB_BINDING}`)
  console.log('   Local database will be created/updated during import')

  // Create .wrangler/state directory if it doesn't exist
  try {
    await fs.mkdir('.wrangler/state/v3/d1', { recursive: true })
    console.log('   ✅ Local database directory ready')
  } catch (error) {
    console.log('   Local database directory already exists')
  }
}

/**
 * Import SQL file to local D1 database
 */
async function importToLocal(sqlFilePath: string) {
  console.log('\n📥 Importing to local D1 database...')
  console.log(`   Source: ${sqlFilePath}`)
  console.log(`   Target: Local database (binding: ${PRODUCTION_DB_BINDING})`)

  try {
    // Read SQL file
    const sqlContent = await fs.readFile(sqlFilePath, 'utf-8')

    // Split into individual statements (simple split by semicolon + newline)
    const statements = sqlContent
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim() + ';')

    console.log(`   Processing ${statements.length} SQL statements...`)

    // Execute statements in batches
    const BATCH_SIZE = 50
    for (let i = 0; i < statements.length; i += BATCH_SIZE) {
      const batch = statements.slice(i, Math.min(i + BATCH_SIZE, statements.length))
      const batchSql = batch.join('\n')

      // Write batch to temp file
      const tempFile = path.join(EXPORT_DIR, `batch_${i}.sql`)
      await fs.writeFile(tempFile, batchSql)

      console.log(`   Executing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(statements.length / BATCH_SIZE)}...`)

      try {
        await execAsync(
          `npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --local --file ${tempFile}`
        )
      } catch (error: any) {
        console.error(`   ⚠️ Batch execution warning:`, error.message?.split('\n')[0])
        // Continue with next batch even if one fails
      }

      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {})
    }

    console.log('✅ Import completed!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  }
}

/**
 * Verify the import by checking table counts
 */
async function verifyImport() {
  console.log('\n🔍 Verifying import...')

  try {
    const tables = await listTables()

    for (const table of tables) {
      try {
        // Get count from production
        const { stdout: prodCount } = await execAsync(
          `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --remote ` +
          `--command "SELECT COUNT(*) as count FROM ${table};"`
        )

        // Get count from local
        const { stdout: localCount } = await execAsync(
          `npx wrangler d1 execute ${PRODUCTION_DB_BINDING} --local ` +
          `--command "SELECT COUNT(*) as count FROM ${table};"`
        )

        // Parse counts
        const prodMatch = prodCount.match(/│\s*(\d+)\s*│/)
        const localMatch = localCount.match(/│\s*(\d+)\s*│/)

        if (prodMatch && localMatch) {
          const prodRows = parseInt(prodMatch[1])
          const localRows = parseInt(localMatch[1])

          if (prodRows === localRows) {
            console.log(`   ✅ ${table}: ${localRows} rows`)
          } else {
            console.log(`   ⚠️ ${table}: Production has ${prodRows} rows, Local has ${localRows} rows`)
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Could not verify ${table}`)
      }
    }
  } catch (error) {
    console.error('⚠️ Verification incomplete:', error)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║          D1 DATABASE EXPORT/IMPORT TOOL               ║')
  console.log('╚════════════════════════════════════════════════════════╝')

  try {
    // Step 1: Ensure export directory exists
    await ensureExportDir()

    // Step 2: Export from production
    const exportPath = await exportFromProduction({
      includeData: true // Set to false for schema only
    })

    // Step 3: Create/prepare local database
    await createLocalDatabase()

    // Step 4: Import to local
    await importToLocal(exportPath)

    // Step 5: Verify import
    await verifyImport()

    console.log('\n🎉 Export and import completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('   1. Update wrangler.toml to use local database for development')
    console.log('   2. Run: npm run dev')
    console.log('   3. Test your application with local data')

  } catch (error) {
    console.error('\n❌ Process failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.main) {
  main()
}

export { exportFromProduction, importToLocal, listTables }