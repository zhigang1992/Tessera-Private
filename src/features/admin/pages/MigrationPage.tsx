/**
 * Admin Migration Page
 *
 * Allows authorized users to migrate off-chain referral data to on-chain
 * with individual batch execution buttons
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { fetchMigrationData, exportMigrationDataAsJson } from '../lib/migration-api';
import { useAdminBatchCreateCodes } from '../hooks/use-admin-batch-create-codes';
import { useAdminCreateSingleCode } from '../hooks/use-admin-create-single-code';
import { useAdminRegisterSingleUser } from '../hooks/use-admin-register-single-user';
import {
  useSolanaConnection,
  fetchReferralCode,
  fetchUserRegistration,
} from '@/lib/solana';
import type {
  MigrationData,
  MigrationConfig,
  ReferralCodeData,
  TraderBindingData,
  BatchState,
} from '../types/migration';

export function MigrationPage() {
  const wallet = useWallet();
  const connection = useSolanaConnection();
  const [migrationData, setMigrationData] = useState<MigrationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<MigrationConfig>({
    batchSize: 10,
    skipExisting: true,
  });

  // Batch states for codes
  const [codeBatches, setCodeBatches] = useState<ReferralCodeData[][]>([]);
  const [codeBatchStates, setCodeBatchStates] = useState<Record<number, BatchState>>({});

  // Batch states for users
  const [userBatches, setUserBatches] = useState<TraderBindingData[][]>([]);
  const [userBatchStates, setUserBatchStates] = useState<Record<number, BatchState>>({});

  const batchCreateCodes = useAdminBatchCreateCodes();
  const createCode = useAdminCreateSingleCode();
  const registerUser = useAdminRegisterSingleUser();

  // Fetch migration data on mount
  useEffect(() => {
    loadMigrationData();
  }, []);

  // Split data into batches when migration data changes
  useEffect(() => {
    if (migrationData) {
      // Split codes into batches
      const newCodeBatches: ReferralCodeData[][] = [];
      for (let i = 0; i < migrationData.referralCodes.length; i += config.batchSize) {
        newCodeBatches.push(migrationData.referralCodes.slice(i, i + config.batchSize));
      }
      setCodeBatches(newCodeBatches);
      setCodeBatchStates(
        Object.fromEntries(newCodeBatches.map((_, i) => [i, { status: 'pending' }]))
      );

      // Split users into batches
      const newUserBatches: TraderBindingData[][] = [];
      for (let i = 0; i < migrationData.traderBindings.length; i += config.batchSize) {
        newUserBatches.push(migrationData.traderBindings.slice(i, i + config.batchSize));
      }
      setUserBatches(newUserBatches);
      setUserBatchStates(
        Object.fromEntries(newUserBatches.map((_, i) => [i, { status: 'pending' }]))
      );
    }
  }, [migrationData, config.batchSize]);

  const loadMigrationData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMigrationData();
      setMigrationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch migration data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCodeBatch = async (batchIndex: number) => {
    const batch = codeBatches[batchIndex];
    if (!batch || !wallet.publicKey) return;

    setCodeBatchStates((prev) => ({
      ...prev,
      [batchIndex]: { status: 'executing' },
    }));

    try {
      // Filter out codes that already exist
      let codesToCreate = batch;
      let skippedCount = 0;

      if (config.skipExisting) {
        const existingChecks = await Promise.all(
          batch.map(async (codeData) => {
            const existing = await fetchReferralCode(connection, codeData.code);
            return { codeData, exists: !!existing };
          })
        );

        codesToCreate = existingChecks.filter((check) => !check.exists).map((check) => check.codeData);
        skippedCount = existingChecks.filter((check) => check.exists).length;
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
        }));
        return;
      }

      // Execute batch create (true on-chain batch operation)
      const result = await batchCreateCodes.mutateAsync({ codes: codesToCreate });

      setCodeBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: 'success',
          signature: result.signature,
          error: skippedCount > 0 ? `Created ${result.count}, skipped ${skippedCount}` : undefined,
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setCodeBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }));
    }
  };

  const handleExecuteUserBatch = async (batchIndex: number) => {
    const batch = userBatches[batchIndex];
    if (!batch || !wallet.publicKey) return;

    setUserBatchStates((prev) => ({
      ...prev,
      [batchIndex]: { status: 'executing' },
    }));

    try {
      const results: string[] = [];
      let successCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      // Execute all users in batch
      for (const bindingData of batch) {
        try {
          // Check if user already registered on-chain
          if (config.skipExisting) {
            const userPubkey = new PublicKey(bindingData.userWallet);
            const existingRegistration = await fetchUserRegistration(connection, userPubkey);
            if (existingRegistration) {
              skippedCount++;
              continue;
            }
          }

          // Register the user
          const result = await registerUser.mutateAsync({ binding: bindingData });
          results.push(result.signature);
          successCount++;
        } catch (err) {
          failedCount++;
          console.error(`Failed to register user ${bindingData.userWallet}:`, err);
        }
      }

      const summary = `Registered ${successCount}, Skipped ${skippedCount}, Failed ${failedCount}`;

      setUserBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: failedCount > 0 && successCount === 0 ? 'failed' : 'success',
          signature: results.length > 0 ? results[0] : undefined,
          error: failedCount > 0 ? `${failedCount} failed` : undefined,
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setUserBatchStates((prev) => ({
        ...prev,
        [batchIndex]: {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }));
    }
  };

  const handleExportData = () => {
    if (migrationData) {
      exportMigrationDataAsJson(migrationData);
    }
  };

  const estimatedCost = migrationData
    ? {
        codes: migrationData.referralCodes.length * 0.001,
        users: migrationData.traderBindings.length * 0.002,
        fees:
          (migrationData.referralCodes.length + migrationData.traderBindings.length) * 0.000005,
      }
    : null;

  const totalCost = estimatedCost
    ? estimatedCost.codes + estimatedCost.users + estimatedCost.fees
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Migration Dashboard</h1>
        <p className="text-gray-600">Migrate off-chain referral data to on-chain Solana program</p>
      </div>

      {/* Step 1: Connect Wallet */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Connect Authority Wallet</h2>
        <div className="flex items-center gap-4">
          <WalletMultiButton />
          {wallet.publicKey && (
            <div className="text-sm text-green-600">
              ✓ Connected: {wallet.publicKey.toBase58().slice(0, 8)}...
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Only the program authority can execute migrations
        </p>
      </div>

      {/* Step 2: Load Data */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Migration Data</h2>

        {isLoading && <div className="text-gray-600">Loading migration data...</div>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadMigrationData}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {migrationData && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded p-4">
                <div className="text-sm text-gray-600">Referral Codes</div>
                <div className="text-2xl font-bold">{migrationData.referralCodes.length}</div>
              </div>
              <div className="bg-green-50 rounded p-4">
                <div className="text-sm text-gray-600">Trader Bindings</div>
                <div className="text-2xl font-bold">{migrationData.traderBindings.length}</div>
              </div>
              <div className="bg-purple-50 rounded p-4">
                <div className="text-sm text-gray-600">Batches</div>
                <div className="text-2xl font-bold">
                  {codeBatches.length + userBatches.length}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadMigrationData}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Refresh Data
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Export JSON
              </button>
            </div>

            {estimatedCost && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
                <h3 className="font-semibold mb-2">Estimated Cost</h3>
                <div className="space-y-1 text-sm">
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
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Step 3: Create Referral Codes</h2>
            <p className="text-sm text-gray-600 mb-4">
              {codeBatches.length} batches of {config.batchSize} codes each (showing first item per batch)
            </p>

            <div className="space-y-2">
              {codeBatches.map((batch, index) => {
                const state = codeBatchStates[index];
                const firstCode = batch[0];

                return (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-sm">
                          Batch {index + 1}: {batch.length} codes
                          <span className="text-gray-500 ml-2">
                            (e.g. {firstCode.code} → {firstCode.ownerWallet.slice(0, 8)}...)
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleExecuteCodeBatch(index)}
                        disabled={!wallet.publicKey || state.status === 'executing'}
                        className={`px-4 py-2 rounded font-medium ${
                          state.status === 'pending'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : state.status === 'executing'
                            ? 'bg-gray-400 text-white cursor-wait'
                            : state.status === 'success'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
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
                        className={`mt-2 p-3 rounded text-sm ${
                          state.status === 'success'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {state.signature && (
                          <div className="mb-2">
                            <div className="font-semibold">First TX:</div>
                            <div className="font-mono text-xs break-all">{state.signature}</div>
                          </div>
                        )}
                        {state.error && (
                          <div className="text-red-700 font-semibold">{state.error}</div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">{state.timestamp}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Batches */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Step 4: Register Users</h2>
            <p className="text-sm text-gray-600 mb-4">
              {userBatches.length} batches of {config.batchSize} users each (showing first item per batch)
            </p>

            <div className="space-y-2">
              {userBatches.map((batch, index) => {
                const state = userBatchStates[index];
                const firstUser = batch[0];

                return (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-sm">
                          Batch {index + 1}: {batch.length} users
                          <span className="text-gray-500 ml-2">
                            (e.g. {firstUser.userWallet.slice(0, 8)}... → {firstUser.referralCode})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleExecuteUserBatch(index)}
                        disabled={!wallet.publicKey || state.status === 'executing'}
                        className={`px-4 py-2 rounded font-medium ${
                          state.status === 'pending'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : state.status === 'executing'
                            ? 'bg-gray-400 text-white cursor-wait'
                            : state.status === 'success'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
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
                        className={`mt-2 p-3 rounded text-sm ${
                          state.status === 'success'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {state.signature && (
                          <div className="mb-2">
                            <div className="font-semibold">First TX:</div>
                            <div className="font-mono text-xs break-all">{state.signature}</div>
                          </div>
                        )}
                        {state.error && (
                          <div className="text-red-700 font-semibold">{state.error}</div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">{state.timestamp}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
