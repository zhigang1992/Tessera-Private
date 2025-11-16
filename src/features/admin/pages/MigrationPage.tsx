/**
 * Admin Migration Page
 *
 * Allows authorized users to migrate off-chain referral data to on-chain
 * with individual batch execution buttons
 */

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import { fetchMigrationData, exportMigrationDataAsJson } from '../lib/migration-api'
import { useAdminBatchCreateCodes } from '../hooks/use-admin-batch-create-codes'
import { useAdminRegisterSingleUser } from '../hooks/use-admin-register-single-user'
import { useAdminCloseCode } from '../hooks/use-admin-close-code'
import {
  useSolanaConnection,
  fetchUserRegistration,
  checkReferralCodeLayout,
} from '@/lib/solana'
import type {
  MigrationData,
  MigrationConfig,
  ReferralCodeData,
  TraderBindingData,
  BatchState,
} from '../types/migration'

export function MigrationPage() {
  const wallet = useWallet()
  const connection = useSolanaConnection()
  const [migrationData, setMigrationData] = useState<MigrationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataWarning, setDataWarning] = useState<string | null>(null)

  const [config] = useState<MigrationConfig>({
    batchSize: 10,
    skipExisting: true,
  })

  // Batch states for codes
  const [codeBatches, setCodeBatches] = useState<ReferralCodeData[][]>([])
  const [codeBatchStates, setCodeBatchStates] = useState<Record<number, BatchState>>({})

  // Batch states for users
  const [userBatches, setUserBatches] = useState<TraderBindingData[][]>([])
  const [userBatchStates, setUserBatchStates] = useState<Record<number, BatchState>>({})

  const batchCreateCodes = useAdminBatchCreateCodes()
  const registerUser = useAdminRegisterSingleUser()
  const closeCode = useAdminCloseCode()

  // State for close code section
  const [closeCodeInput, setCloseCodeInput] = useState('')
  const [closeCodeResult, setCloseCodeResult] = useState<{
    status: 'success' | 'error'
    message: string
    signature?: string
  } | null>(null)

  // Fetch migration data on mount
  useEffect(() => {
    loadMigrationData()
  }, [])

  // Split data into batches when migration data changes
  useEffect(() => {
    if (migrationData) {
      // Split codes into batches
      const newCodeBatches: ReferralCodeData[][] = []
      for (let i = 0; i < migrationData.referralCodes.length; i += config.batchSize) {
        newCodeBatches.push(migrationData.referralCodes.slice(i, i + config.batchSize))
      }
      setCodeBatches(newCodeBatches)
      setCodeBatchStates(Object.fromEntries(newCodeBatches.map((_, i) => [i, { status: 'pending' }])))

      // Split users into batches
      const newUserBatches: TraderBindingData[][] = []
      for (let i = 0; i < migrationData.traderBindings.length; i += config.batchSize) {
        newUserBatches.push(migrationData.traderBindings.slice(i, i + config.batchSize))
      }
      setUserBatches(newUserBatches)
      setUserBatchStates(Object.fromEntries(newUserBatches.map((_, i) => [i, { status: 'pending' }])))
    }
  }, [migrationData, config.batchSize])

  const loadMigrationData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchMigrationData()

      // Validate: Check if all trader bindings reference codes that exist in referralCodes
      const codeSet = new Set(data.referralCodes.map((c) => c.code))
      const missingCodes: string[] = []

      data.traderBindings.forEach((binding) => {
        if (!codeSet.has(binding.referralCode)) {
          if (!missingCodes.includes(binding.referralCode)) {
            missingCodes.push(binding.referralCode)
          }
        }
      })

      if (missingCodes.length > 0) {
        console.warn('⚠️  Data validation warning:')
        console.warn(`Found ${missingCodes.length} referral codes in traderBindings that are NOT in referralCodes:`)
        missingCodes.forEach((code) => console.warn(`  - "${code}"`))
        console.warn(
          '\nThese users cannot be migrated because their referral codes were not included in the referralCodes data.',
        )

        // Log which users are affected
        const affectedUsers = data.traderBindings.filter((b) => missingCodes.includes(b.referralCode))
        console.warn(`Affected users: ${affectedUsers.length}`)
        console.warn('First 5 affected users:')
        affectedUsers.slice(0, 5).forEach((b) => {
          console.warn(`  ${b.userWallet.slice(0, 8)}... → code: "${b.referralCode}"`)
        })

        // Set warning message for UI
        setDataWarning(
          `Data mismatch detected: ${affectedUsers.length} users reference ${missingCodes.length} ` +
            `referral codes that are not in the referralCodes data. These users will fail to migrate. ` +
            `Check console for details.`,
        )
      } else {
        setDataWarning(null)
      }

      setMigrationData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch migration data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecuteCodeBatch = async (batchIndex: number) => {
    const batch = codeBatches[batchIndex]
    if (!batch || !wallet.publicKey) return

    setCodeBatchStates((prev) => ({
      ...prev,
      [batchIndex]: { status: 'executing' },
    }))

    try {
      // Filter out codes that already exist
      let codesToCreate = batch
      let skippedCount = 0

      if (config.skipExisting) {
        const existingChecks = await Promise.all(
          batch.map(async (codeData) => {
            const layout = await checkReferralCodeLayout(connection, codeData.code)
            return { codeData, layout }
          }),
        )

        // Only skip codes that exist AND have correct layout
        // Codes with wrong layout need to be recreated
        codesToCreate = existingChecks
          .filter((check) => !check.layout.exists || check.layout.needsRecreation)
          .map((check) => check.codeData)

        skippedCount = existingChecks.filter((check) => check.layout.exists && !check.layout.needsRecreation).length

        // Log codes that need recreation
        const needsRecreation = existingChecks.filter((check) => check.layout.needsRecreation)
        if (needsRecreation.length > 0) {
          console.log(`⚠️  ${needsRecreation.length} codes have wrong layout and will be recreated:`)
          needsRecreation.forEach((check) => console.log(`   - ${check.codeData.code}`))
        }
      }

      if (codesToCreate.length === 0) {
        // All codes already exist
        setCodeBatchStates((prev) => ({
          ...prev,
          [batchIndex]: {
            status: 'success',
            error: `All ${skippedCount} codes already exist`,
            timestamp: new Date().toISOString(),
          },
        }))
        return
      }

      // Execute batch create (true on-chain batch operation)
      console.log(`🔄 Executing batch ${batchIndex + 1}: Creating ${codesToCreate.length} codes...`)
      const result = await batchCreateCodes.mutateAsync({ codes: codesToCreate })

      console.log(`✅ Batch ${batchIndex + 1} complete: TX ${result.signature}`)
      setCodeBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: 'success',
          signature: result.signature,
          error: skippedCount > 0 ? `Created ${result.count}, skipped ${skippedCount}` : undefined,
          timestamp: new Date().toISOString(),
        },
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ Batch ${batchIndex + 1} failed:`, errorMessage, err)

      setCodeBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: 'failed',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      }))

      // Show alert with detailed error
      alert(`Batch ${batchIndex + 1} Failed:\n\n${errorMessage}\n\nCheck console for details.`)
    }
  }

  const handleExecuteUserBatch = async (batchIndex: number) => {
    const batch = userBatches[batchIndex]
    if (!batch || !wallet.publicKey) return

    setUserBatchStates((prev) => ({
      ...prev,
      [batchIndex]: { status: 'executing' },
    }))

    try {
      const results: string[] = []
      let successCount = 0
      let skippedCount = 0
      let failedCount = 0
      const errors: Array<{ item: string; error: string }> = []

      console.log(`🔄 Executing user batch ${batchIndex + 1}: Registering ${batch.length} users...`)

      // Execute all users in batch (NOTE: This is NOT a true batch - each user is a separate transaction)
      for (const bindingData of batch) {
        try {
          // Check if user already registered on-chain
          if (config.skipExisting) {
            const userPubkey = new PublicKey(bindingData.userWallet)
            const existingRegistration = await fetchUserRegistration(connection, userPubkey)
            if (existingRegistration) {
              console.log(`  ⏭️  Skipped ${bindingData.userWallet.slice(0, 8)}... (already registered)`)
              skippedCount++
              continue
            }
          }

          // Register the user (each registration is a separate transaction)
          console.log(`  📝 Registering ${bindingData.userWallet.slice(0, 8)}... with code ${bindingData.referralCode}`)
          const result = await registerUser.mutateAsync({ binding: bindingData })
          console.log(`  ✅ Success: TX ${result.signature.slice(0, 8)}...`)
          results.push(result.signature)
          successCount++
        } catch (err) {
          failedCount++
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          errors.push({
            item: `${bindingData.userWallet.slice(0, 8)}... → ${bindingData.referralCode}`,
            error: errorMessage,
          })
          console.error(`  ❌ Failed to register ${bindingData.userWallet.slice(0, 8)}...:`, errorMessage, err)
        }
      }

      const summary = `Registered ${successCount}, Skipped ${skippedCount}, Failed ${failedCount}`
      console.log(`✅ User batch ${batchIndex + 1} complete: ${summary}`)

      setUserBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: failedCount > 0 && successCount === 0 ? 'failed' : 'success',
          signature: results.length > 0 ? results[0] : undefined,
          error: failedCount > 0 ? summary : undefined,
          timestamp: new Date().toISOString(),
          details: {
            successful: successCount,
            failed: failedCount,
            skipped: skippedCount,
            errors,
          },
        },
      }))

      // Show alert if there were failures
      if (failedCount > 0) {
        const errorDetails = errors.map((e) => `  - ${e.item}: ${e.error}`).join('\n')
        alert(`User Batch ${batchIndex + 1} completed with errors:\n\n${summary}\n\nFailed registrations:\n${errorDetails}\n\nCheck console for full details.`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`❌ User batch ${batchIndex + 1} failed:`, errorMessage, err)

      setUserBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: 'failed',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      }))

      // Show alert with detailed error
      alert(`User Batch ${batchIndex + 1} Failed:\n\n${errorMessage}\n\nCheck console for details.`)
    }
  }

  const handleExportData = () => {
    if (migrationData) {
      exportMigrationDataAsJson(migrationData)
    }
  }

  const handleCloseCode = async () => {
    if (!closeCodeInput.trim()) {
      setCloseCodeResult({
        status: 'error',
        message: 'Please enter a referral code',
      })
      return
    }

    try {
      setCloseCodeResult(null)
      console.log(`🗑️  Attempting to close code: ${closeCodeInput}`)

      const result = await closeCode.mutateAsync({ code: closeCodeInput.trim() })

      setCloseCodeResult({
        status: 'success',
        message: `Successfully closed code: ${result.code}`,
        signature: result.signature,
      })
      setCloseCodeInput('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Failed to close code:', errorMessage, err)

      setCloseCodeResult({
        status: 'error',
        message: `Failed to close code: ${errorMessage}`,
      })
    }
  }

  const estimatedCost = migrationData
    ? {
        codes: migrationData.referralCodes.length * 0.001,
        users: migrationData.traderBindings.length * 0.002,
        fees: (migrationData.referralCodes.length + migrationData.traderBindings.length) * 0.000005,
      }
    : null

  const totalCost = estimatedCost ? estimatedCost.codes + estimatedCost.users + estimatedCost.fees : 0

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">Admin Migration Dashboard</h1>
          <p className="text-black/60 dark:text-white/60">Migrate off-chain referral data to on-chain Solana program</p>
        </div>

        {/* Step 1: Connect Wallet */}
        <div className="bg-[#F7F7FA] dark:bg-[#111111] border border-[#E4E4E7] dark:border-[#27272A] rounded-[24px] shadow-none p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Step 1: Connect Authority Wallet</h2>
          <div className="flex items-center gap-4">
            <WalletMultiButton />
            {wallet.publicKey && (
              <div className="text-sm text-green-600 dark:text-green-400">
                ✓ Connected: {wallet.publicKey.toBase58().slice(0, 8)}...
              </div>
            )}
          </div>
          <p className="text-sm text-black/50 dark:text-white/50 mt-2">
            Only the program authority can execute migrations
          </p>
        </div>

        {/* Step 2: Load Data */}
        <div className="bg-[#F7F7FA] dark:bg-[#111111] border border-[#E4E4E7] dark:border-[#27272A] rounded-[24px] shadow-none p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Step 2: Migration Data</h2>

          {isLoading && <div className="text-black/60 dark:text-white/60">Loading migration data...</div>}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-[16px] p-4 mb-4">
              <p className="text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={loadMigrationData}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {migrationData && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-[16px] p-4">
                  <div className="text-sm text-black/60 dark:text-white/60">Referral Codes</div>
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {migrationData.referralCodes.length}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 rounded-[16px] p-4">
                  <div className="text-sm text-black/60 dark:text-white/60">Trader Bindings</div>
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {migrationData.traderBindings.length}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-[16px] p-4">
                  <div className="text-sm text-black/60 dark:text-white/60">Batches</div>
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {codeBatches.length + userBatches.length}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadMigrationData}
                  className="px-4 py-2 bg-[#E9ECF2] dark:bg-[#27272A] hover:bg-[#D1D5DB] dark:hover:bg-[#3F3F46] text-black dark:text-white rounded-[16px] text-sm"
                >
                  Refresh Data
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-[#E9ECF2] dark:bg-[#27272A] hover:bg-[#D1D5DB] dark:hover:bg-[#3F3F46] text-black dark:text-white rounded-[16px] text-sm"
                >
                  Export JSON
                </button>
              </div>

              {dataWarning && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-[16px] p-4 mt-4">
                  <h3 className="font-semibold mb-2 text-orange-900 dark:text-orange-300">
                    ⚠️ Data Validation Warning
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-400">{dataWarning}</p>
                </div>
              )}

              {estimatedCost && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-[16px] p-4 mt-4">
                  <h3 className="font-semibold mb-2 text-black dark:text-white">Estimated Cost</h3>
                  <div className="space-y-1 text-sm text-black dark:text-white">
                    <div className="flex justify-between">
                      <span>Codes Rent:</span>
                      <span>{estimatedCost.codes.toFixed(4)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users Rent:</span>
                      <span>{estimatedCost.users.toFixed(4)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction Fees:</span>
                      <span>{estimatedCost.fees.toFixed(6)} SOL</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total:</span>
                      <span>{totalCost.toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Execute Batches */}
        {migrationData && (
          <>
            {/* Code Batches */}
            <div className="bg-[#F7F7FA] dark:bg-[#111111] border border-[#E4E4E7] dark:border-[#27272A] rounded-[24px] shadow-none p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Step 3: Create Referral Codes</h2>
              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                {codeBatches.length} batches of {config.batchSize} codes each (showing first item per batch)
              </p>

              <div className="space-y-2">
                {codeBatches.map((batch, index) => {
                  const state = codeBatchStates[index]
                  const firstCode = batch[0]

                  return (
                    <div
                      key={index}
                      className="border border-[#E4E4E7] dark:border-[#27272A] rounded-[16px] p-4 bg-white dark:bg-[#09090B]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-black dark:text-white">
                            Batch {index + 1}: {batch.length} codes
                            <span className="text-black/50 dark:text-white/50 ml-2">
                              (e.g. {firstCode.code} → {firstCode.ownerWallet.slice(0, 8)}...)
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecuteCodeBatch(index)}
                          disabled={!wallet.publicKey || state.status === 'executing'}
                          className={`px-4 py-2 rounded-[12px] font-medium ${
                            state.status === 'pending'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : state.status === 'executing'
                                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-wait'
                                : state.status === 'success'
                                  ? 'bg-green-600 dark:bg-green-700 text-white'
                                  : 'bg-red-600 dark:bg-red-700 text-white'
                          } disabled:opacity-50`}
                        >
                          {state.status === 'pending' && 'Execute'}
                          {state.status === 'executing' && 'Executing...'}
                          {state.status === 'success' && '✓ Success'}
                          {state.status === 'failed' && '✗ Failed'}
                        </button>
                      </div>

                      {/* Transaction Result */}
                      {state.status !== 'pending' && state.status !== 'executing' && (
                        <div
                          className={`mt-2 p-3 rounded-[12px] text-sm ${
                            state.status === 'success'
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {state.signature && (
                            <div className="mb-2">
                              <div className="font-semibold">TX:</div>
                              <div className="font-mono text-xs break-all">{state.signature}</div>
                            </div>
                          )}
                          {state.error && (
                            <div className="text-red-700 dark:text-red-400 font-semibold">{state.error}</div>
                          )}
                          <div className="text-xs text-black/50 dark:text-white/50 mt-1">{state.timestamp}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* User Batches */}
            <div className="bg-[#F7F7FA] dark:bg-[#111111] border border-[#E4E4E7] dark:border-[#27272A] rounded-[24px] shadow-none p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Step 4: Register Users</h2>
              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                {userBatches.length} batches of {config.batchSize} users each (showing first item per batch)
              </p>

              <div className="space-y-2">
                {userBatches.map((batch, index) => {
                  const state = userBatchStates[index]
                  const firstUser = batch[0]

                  return (
                    <div
                      key={index}
                      className="border border-[#E4E4E7] dark:border-[#27272A] rounded-[16px] p-4 bg-white dark:bg-[#09090B]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-black dark:text-white">
                            Batch {index + 1}: {batch.length} users
                            <span className="text-black/50 dark:text-white/50 ml-2">
                              (e.g. {firstUser.userWallet.slice(0, 8)}... → {firstUser.referralCode})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecuteUserBatch(index)}
                          disabled={!wallet.publicKey || state.status === 'executing'}
                          className={`px-4 py-2 rounded-[12px] font-medium ${
                            state.status === 'pending'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : state.status === 'executing'
                                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-wait'
                                : state.status === 'success'
                                  ? 'bg-green-600 dark:bg-green-700 text-white'
                                  : 'bg-red-600 dark:bg-red-700 text-white'
                          } disabled:opacity-50`}
                        >
                          {state.status === 'pending' && 'Execute'}
                          {state.status === 'executing' && 'Executing...'}
                          {state.status === 'success' && '✓ Success'}
                          {state.status === 'failed' && '✗ Failed'}
                        </button>
                      </div>

                      {/* Transaction Result */}
                      {state.status !== 'pending' && state.status !== 'executing' && (
                        <div
                          className={`mt-2 p-3 rounded-[12px] text-sm ${
                            state.status === 'success'
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {/* Summary */}
                          {state.details && (
                            <div className="mb-3 font-semibold">
                              Summary: {state.details.successful} successful, {state.details.skipped} skipped,{' '}
                              {state.details.failed} failed
                            </div>
                          )}

                          {state.signature && (
                            <div className="mb-2">
                              <div className="font-semibold">First TX:</div>
                              <div className="font-mono text-xs break-all">{state.signature}</div>
                            </div>
                          )}

                          {/* Individual Errors */}
                          {state.details && state.details.errors.length > 0 && (
                            <div className="mt-3 border-t border-red-200 dark:border-red-800 pt-3">
                              <div className="font-semibold mb-2">Failed Registrations:</div>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {state.details.errors.map((err, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2"
                                  >
                                    <div className="font-mono text-xs mb-1">{err.item}</div>
                                    <div className="text-xs text-red-700 dark:text-red-400">{err.error}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-black/50 dark:text-white/50 mt-2">{state.timestamp}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Close Referral Code Section */}
        {wallet.publicKey && (
          <div className="bg-[#F7F7FA] dark:bg-[#111111] border border-[#E4E4E7] dark:border-[#27272A] rounded-[24px] shadow-none p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Close Referral Code</h2>
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              Close a referral code account and reclaim rent. Use this to clean up old or invalid codes.
            </p>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={closeCodeInput}
                onChange={(e) => setCloseCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter referral code (e.g. TEST2025)"
                className="flex-1 px-4 py-2 bg-white dark:bg-black border border-[#E4E4E7] dark:border-[#27272A] rounded-[12px] text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                maxLength={12}
              />
              <button
                onClick={handleCloseCode}
                disabled={!closeCodeInput.trim() || closeCode.isPending}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-[12px] font-medium transition-colors disabled:cursor-not-allowed"
              >
                {closeCode.isPending ? 'Closing...' : 'Close Code'}
              </button>
            </div>

            {/* Result Message */}
            {closeCodeResult && (
              <div
                className={`p-4 rounded-[12px] ${
                  closeCodeResult.status === 'success'
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50'
                }`}
              >
                <div
                  className={`font-semibold mb-2 ${
                    closeCodeResult.status === 'success'
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}
                >
                  {closeCodeResult.status === 'success' ? '✅ Success' : '❌ Error'}
                </div>
                <div
                  className={`text-sm mb-2 ${
                    closeCodeResult.status === 'success'
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {closeCodeResult.message}
                </div>
                {closeCodeResult.signature && (
                  <div className="text-xs font-mono text-green-600 dark:text-green-500 break-all">
                    TX: {closeCodeResult.signature}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-[12px]">
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ <strong>Warning:</strong> This action is permanent and cannot be undone. The code account will
                be deleted and rent will be returned to your wallet.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
