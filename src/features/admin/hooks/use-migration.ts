/**
 * Main Migration Hook
 *
 * Orchestrates the entire migration process:
 * 1. Create referral codes
 * 2. Register users with codes
 */

import { useState, useCallback } from 'react'
import { useAdminBatchCreateCodes } from './use-admin-batch-create-codes'
import { useAdminBatchRegisterUsers } from './use-admin-batch-register-users'
import type {
  MigrationData,
  MigrationConfig,
  MigrationProgress,
  MigrationSummary,
  MigrationLog,
  TransactionResult,
} from '../types/migration'

interface UseMigrationResult {
  progress: MigrationProgress
  summary: MigrationSummary | null
  logs: MigrationLog[]
  isRunning: boolean
  startMigration: (data: MigrationData, config: MigrationConfig) => Promise<void>
  pauseMigration: () => void
  resumeMigration: () => void
  cancelMigration: () => void
}

export function useMigration(): UseMigrationResult {
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: 'idle',
    codesCreated: 0,
    codesTotal: 0,
    codesFailed: 0,
    usersRegistered: 0,
    usersTotal: 0,
    usersFailed: 0,
    currentBatch: 0,
    totalBatches: 0,
  })

  const [summary, setSummary] = useState<MigrationSummary | null>(null)
  const [logs, setLogs] = useState<MigrationLog[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  const batchCreateCodes = useAdminBatchCreateCodes()
  const batchRegisterUsers = useAdminBatchRegisterUsers()

  const addLog = useCallback((level: MigrationLog['level'], message: string, data?: any) => {
    const log: MigrationLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    setLogs((prev) => [...prev, log])
    console.log(`[${level.toUpperCase()}]`, message, data)
  }, [])

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const startMigration = useCallback(
    async (data: MigrationData, config: MigrationConfig) => {
      setIsRunning(true)
      setIsPaused(false)
      setIsCancelled(false)
      setLogs([])

      const startTime = Date.now()
      const transactions: TransactionResult[] = []

      try {
        addLog('info', 'Starting migration process', {
          totalCodes: data.referralCodes.length,
          totalBindings: data.traderBindings.length,
        })

        // Phase 1: Create referral codes
        setProgress((prev) => ({
          ...prev,
          phase: 'creating-codes',
          codesTotal: data.referralCodes.length,
          totalBatches: Math.ceil(data.referralCodes.length / config.batchSize),
        }))

        addLog('info', `Creating ${data.referralCodes.length} referral codes...`)

        if (!config.dryRun) {
          const codeResult = await batchCreateCodes.mutateAsync({
            codes: data.referralCodes,
          })

          setProgress((prev) => ({
            ...prev,
            codesCreated: codeResult.successful,
            codesFailed: codeResult.failed,
          }))

          // Add transactions to log
          codeResult.signatures.forEach((sig) => {
            transactions.push({
              type: 'code-creation',
              status: 'success',
              signature: sig,
              timestamp: new Date().toISOString(),
              data: {},
            })
          })

          codeResult.errors.forEach((err) => {
            transactions.push({
              type: 'code-creation',
              status: 'failed',
              error: err.error,
              timestamp: new Date().toISOString(),
              data: { code: err.code },
            })
          })

          addLog('success', `Created ${codeResult.successful} codes`, {
            failed: codeResult.failed,
            signatures: codeResult.signatures,
          })
        } else {
          addLog('info', '(DRY RUN) Simulated code creation')
        }

        // Check for pause/cancel
        if (isCancelled) {
          addLog('warn', 'Migration cancelled by user')
          return
        }

        // Wait between phases
        await delay(config.batchDelayMs)

        // Phase 2: Register users
        setProgress((prev) => ({
          ...prev,
          phase: 'registering-users',
          usersTotal: data.traderBindings.length,
          totalBatches:
            Math.ceil(data.referralCodes.length / config.batchSize) +
            Math.ceil(data.traderBindings.length / config.batchSize),
        }))

        addLog('info', `Registering ${data.traderBindings.length} users...`)

        if (!config.dryRun) {
          const userResult = await batchRegisterUsers.mutateAsync({
            bindings: data.traderBindings,
          })

          setProgress((prev) => ({
            ...prev,
            usersRegistered: userResult.successful,
            usersFailed: userResult.failed,
          }))

          // Add transactions to log
          userResult.signatures.forEach((sig) => {
            transactions.push({
              type: 'user-registration',
              status: 'success',
              signature: sig,
              timestamp: new Date().toISOString(),
              data: {},
            })
          })

          userResult.errors.forEach((err) => {
            transactions.push({
              type: 'user-registration',
              status: 'failed',
              error: err.error,
              timestamp: new Date().toISOString(),
              data: { user: err.user },
            })
          })

          addLog('success', `Registered ${userResult.successful} users`, {
            failed: userResult.failed,
            signatures: userResult.signatures,
          })
        } else {
          addLog('info', '(DRY RUN) Simulated user registration')
        }

        // Mark as completed
        setProgress((prev) => ({ ...prev, phase: 'completed' }))

        const endTime = Date.now()
        const duration = (endTime - startTime) / 1000

        // Build summary
        const migrationSummary: MigrationSummary = {
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date(endTime).toISOString(),
          duration,
          codes: {
            total: data.referralCodes.length,
            successful: progress.codesCreated,
            failed: progress.codesFailed,
            skipped: 0,
          },
          users: {
            total: data.traderBindings.length,
            successful: progress.usersRegistered,
            failed: progress.usersFailed,
            skipped: 0,
          },
          costs: {
            codesRent: 0, // TODO: Calculate from actual transactions
            usersRent: 0,
            transactionFees: 0,
            total: 0,
          },
          transactions,
        }

        setSummary(migrationSummary)
        addLog('success', 'Migration completed successfully!', migrationSummary)
      } catch (error) {
        setProgress((prev) => ({ ...prev, phase: 'failed' }))
        addLog('error', 'Migration failed', error)
        throw error
      } finally {
        setIsRunning(false)
      }
    },
    [batchCreateCodes, batchRegisterUsers, addLog, isCancelled, progress],
  )

  const pauseMigration = useCallback(() => {
    setIsPaused(true)
    addLog('warn', 'Migration paused')
  }, [addLog])

  const resumeMigration = useCallback(() => {
    setIsPaused(false)
    addLog('info', 'Migration resumed')
  }, [addLog])

  const cancelMigration = useCallback(() => {
    setIsCancelled(true)
    setIsRunning(false)
    addLog('warn', 'Migration cancelled')
  }, [addLog])

  return {
    progress,
    summary,
    logs,
    isRunning,
    startMigration,
    pauseMigration,
    resumeMigration,
    cancelMigration,
  }
}
