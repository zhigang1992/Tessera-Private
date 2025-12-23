import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js'
import DLMM from '@meteora-ag/dlmm'
import BN from 'bn.js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSolanaCluster, SolanaClusterId } from '@/components/solana/solana-cluster-context'

interface LogEntry {
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}

interface PoolInfo {
  address: string
  tokenX: { mint: string; symbol?: string }
  tokenY: { mint: string; symbol?: string }
  activeBin: number
  binStep: number
}

interface SwapQuoteResult {
  consumedInAmount: string
  outAmount: string
  minOutAmount: string
  priceImpact: string
  binArraysPubkey: PublicKey[]
}

export default function DebugMeteoraPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const { cluster, clusters, setCluster } = useSolanaCluster()

  // State
  const [poolAddress, setPoolAddress] = useState('')
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [dlmmPool, setDlmmPool] = useState<DLMM | null>(null)
  const [swapAmount, setSwapAmount] = useState('1000000') // 1 token with 6 decimals
  const [swapDirection, setSwapDirection] = useState<'XtoY' | 'YtoX'>('XtoY')
  const [slippageBps, setSlippageBps] = useState('100') // 1%
  const [swapQuote, setSwapQuote] = useState<SwapQuoteResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date(), type, message }])
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // Load pool info
  const handleLoadPool = async () => {
    if (!poolAddress) {
      addLog('error', 'Please enter a pool address')
      return
    }

    setIsLoading(true)
    clearLogs()
    addLog('info', `Loading pool: ${poolAddress}`)
    addLog('info', `Network: ${cluster.label} (${cluster.endpoint})`)

    try {
      const poolPubkey = new PublicKey(poolAddress)
      addLog('info', 'Creating DLMM instance...')

      // Create DLMM instance with cluster option for devnet
      const pool = await DLMM.create(connection, poolPubkey, {
        cluster: cluster.url === 'devnet' ? 'devnet' : 'mainnet-beta',
      })
      setDlmmPool(pool)
      addLog('success', 'DLMM instance created successfully')

      // Get active bin
      addLog('info', 'Fetching active bin...')
      const activeBin = await pool.getActiveBin()
      addLog('success', `Active bin: ${activeBin.binId}, Price: ${activeBin.price}`)

      const info: PoolInfo = {
        address: poolAddress,
        tokenX: {
          mint: pool.tokenX.publicKey.toBase58(),
          symbol: pool.tokenX.publicKey.toBase58().slice(0, 8) + '...',
        },
        tokenY: {
          mint: pool.tokenY.publicKey.toBase58(),
          symbol: pool.tokenY.publicKey.toBase58().slice(0, 8) + '...',
        },
        activeBin: activeBin.binId,
        binStep: pool.lbPair.binStep,
      }

      setPoolInfo(info)
      addLog('success', `Pool loaded! Token X: ${info.tokenX.mint}`)
      addLog('success', `Token Y: ${info.tokenY.mint}`)
      addLog('info', `Bin step: ${info.binStep}`)
    } catch (error) {
      addLog('error', `Failed to load pool: ${error instanceof Error ? error.message : String(error)}`)
      setPoolInfo(null)
      setDlmmPool(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Get swap quote
  const handleGetQuote = async () => {
    if (!dlmmPool) {
      addLog('error', 'Please load a pool first')
      return
    }

    setIsLoading(true)
    addLog('info', `Getting swap quote for ${swapAmount} (direction: ${swapDirection})...`)

    try {
      const swapForY = swapDirection === 'XtoY'
      addLog('info', `Fetching bin arrays for swap (swapForY: ${swapForY})...`)

      const binArrays = await dlmmPool.getBinArrayForSwap(swapForY)
      addLog('success', `Found ${binArrays.length} bin arrays`)

      const amount = new BN(swapAmount)
      const slippage = new BN(slippageBps)

      addLog('info', `Calculating quote with slippage: ${slippageBps} bps...`)
      const quote = await dlmmPool.swapQuote(amount, swapForY, slippage, binArrays)

      const result: SwapQuoteResult = {
        consumedInAmount: quote.consumedInAmount.toString(),
        outAmount: quote.outAmount.toString(),
        minOutAmount: quote.minOutAmount.toString(),
        priceImpact: quote.priceImpact ? quote.priceImpact.toString() : 'N/A',
        binArraysPubkey: quote.binArraysPubkey,
      }

      setSwapQuote(result)
      addLog('success', `Quote received!`)
      addLog('info', `  Input: ${result.consumedInAmount}`)
      addLog('info', `  Output: ${result.outAmount}`)
      addLog('info', `  Min Output: ${result.minOutAmount}`)
      addLog('info', `  Price Impact: ${result.priceImpact}`)
    } catch (error) {
      addLog('error', `Failed to get quote: ${error instanceof Error ? error.message : String(error)}`)
      setSwapQuote(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Execute swap
  const handleSwap = async () => {
    if (!dlmmPool || !swapQuote || !wallet.publicKey || !wallet.signTransaction) {
      addLog('error', 'Missing requirements: pool, quote, or wallet connection')
      return
    }

    setIsLoading(true)
    addLog('info', 'Preparing swap transaction...')

    try {
      const swapForY = swapDirection === 'XtoY'
      const [inToken, outToken] = swapForY
        ? [dlmmPool.tokenX.publicKey, dlmmPool.tokenY.publicKey]
        : [dlmmPool.tokenY.publicKey, dlmmPool.tokenX.publicKey]

      addLog('info', `In token: ${inToken.toBase58()}`)
      addLog('info', `Out token: ${outToken.toBase58()}`)
      addLog('info', `User: ${wallet.publicKey.toBase58()}`)

      const swapTx = await dlmmPool.swap({
        inToken,
        outToken,
        inAmount: new BN(swapQuote.consumedInAmount),
        minOutAmount: new BN(swapQuote.minOutAmount),
        lbPair: dlmmPool.pubkey,
        user: wallet.publicKey,
        binArraysPubkey: swapQuote.binArraysPubkey,
      })

      addLog('info', 'Signing and sending transaction...')

      // Handle the transaction
      let txHash: string
      if (swapTx instanceof Transaction) {
        // Legacy transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        swapTx.recentBlockhash = blockhash
        swapTx.feePayer = wallet.publicKey

        const signed = await wallet.signTransaction(swapTx)
        txHash = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction({ signature: txHash, blockhash, lastValidBlockHeight })
      } else {
        // Versioned transaction or other format
        txHash = await sendAndConfirmTransaction(connection, swapTx as Transaction, [])
      }

      addLog('success', `Swap successful! TX: ${txHash}`)
      addLog('info', `Explorer: https://explorer.solana.com/tx/${txHash}?cluster=${cluster.url}`)
    } catch (error) {
      addLog('error', `Swap failed: ${error instanceof Error ? error.message : String(error)}`)
      if (error instanceof Error && 'logs' in error) {
        addLog('error', `Logs: ${JSON.stringify((error as { logs?: string[] }).logs, null, 2)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meteora DLMM Debug</h1>
          <p className="text-muted-foreground mt-1">Test Meteora DLMM swap integration directly</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Network:</Label>
          <div className="flex gap-1">
            {clusters.map((c) => (
              <Button
                key={c.id}
                variant={cluster.id === c.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCluster(c.id as SolanaClusterId)
                  // Clear pool state when switching networks
                  setPoolInfo(null)
                  setDlmmPool(null)
                  setSwapQuote(null)
                  clearLogs()
                  addLog('info', `Switched to ${c.label}`)
                }}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Connect your wallet to execute swaps</CardDescription>
        </CardHeader>
        <CardContent>
          {wallet.connected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {wallet.publicKey?.toBase58().slice(0, 8)}...{wallet.publicKey?.toBase58().slice(-8)}
                </p>
                <p className="text-xs text-muted-foreground">Connected via {wallet.wallet?.adapter.name}</p>
              </div>
              <Button variant="outline" onClick={() => wallet.disconnect()}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={() => setVisible(true)}>Connect Wallet</Button>
          )}
        </CardContent>
      </Card>

      {/* Pool Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Load Pool</CardTitle>
          <CardDescription>Enter a DLMM pool address to load its information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poolAddress">Pool Address</Label>
            <Input
              id="poolAddress"
              placeholder="e.g., ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq"
              value={poolAddress}
              onChange={(e) => setPoolAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find pools at{' '}
              <a
                href="https://dlmm-api.meteora.ag/pair/all"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                dlmm-api.meteora.ag/pair/all
              </a>
              {cluster.url === 'devnet' && (
                <>
                  {' '}
                  or{' '}
                  <a href="https://devnet.meteora.ag" target="_blank" rel="noopener noreferrer" className="underline">
                    devnet.meteora.ag
                  </a>
                </>
              )}
            </p>
          </div>
          <Button onClick={handleLoadPool} disabled={isLoading || !poolAddress}>
            {isLoading ? 'Loading...' : 'Load Pool'}
          </Button>

          {poolInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Pool Information:</p>
              <div className="text-xs space-y-1 font-mono">
                <p>
                  <span className="text-muted-foreground">Token X:</span> {poolInfo.tokenX.mint}
                </p>
                <p>
                  <span className="text-muted-foreground">Token Y:</span> {poolInfo.tokenY.mint}
                </p>
                <p>
                  <span className="text-muted-foreground">Active Bin:</span> {poolInfo.activeBin}
                </p>
                <p>
                  <span className="text-muted-foreground">Bin Step:</span> {poolInfo.binStep}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swap Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Swap Configuration</CardTitle>
          <CardDescription>Configure and execute a swap</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="swapAmount">Amount (raw, with decimals)</Label>
              <Input
                id="swapAmount"
                type="text"
                placeholder="1000000"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">e.g., 1000000 = 1 token with 6 decimals</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slippage">Slippage (bps)</Label>
              <Input
                id="slippage"
                type="text"
                placeholder="100"
                value={slippageBps}
                onChange={(e) => setSlippageBps(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">100 bps = 1%</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Swap Direction</Label>
            <div className="flex gap-2">
              <Button
                variant={swapDirection === 'XtoY' ? 'default' : 'outline'}
                onClick={() => setSwapDirection('XtoY')}
                className="flex-1"
              >
                X → Y
              </Button>
              <Button
                variant={swapDirection === 'YtoX' ? 'default' : 'outline'}
                onClick={() => setSwapDirection('YtoX')}
                className="flex-1"
              >
                Y → X
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGetQuote} disabled={isLoading || !dlmmPool} variant="outline">
              {isLoading ? 'Loading...' : 'Get Quote'}
            </Button>
            <Button onClick={handleSwap} disabled={isLoading || !swapQuote || !wallet.connected}>
              {isLoading ? 'Processing...' : 'Execute Swap'}
            </Button>
          </div>

          {swapQuote && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Swap Quote:</p>
              <div className="text-xs space-y-1 font-mono">
                <p>
                  <span className="text-muted-foreground">Input Amount:</span> {swapQuote.consumedInAmount}
                </p>
                <p>
                  <span className="text-muted-foreground">Output Amount:</span> {swapQuote.outAmount}
                </p>
                <p>
                  <span className="text-muted-foreground">Min Output:</span> {swapQuote.minOutAmount}
                </p>
                <p>
                  <span className="text-muted-foreground">Price Impact:</span> {swapQuote.priceImpact}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Debug Logs</CardTitle>
            <CardDescription>Real-time operation logs</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={clearLogs}>
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-y-auto bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet. Load a pool to begin.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={getLogColor(log.type)}>
                  <span className="text-muted-foreground">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
          <CardDescription>Sample pool addresses for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Mainnet - USDC/USDT Pool:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 break-all">
                ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq
              </code>
            </div>
            <div>
              <p className="font-medium">Devnet Pools:</p>
              <p className="text-xs text-muted-foreground">
                Visit{' '}
                <a href="https://devnet.meteora.ag" target="_blank" rel="noopener noreferrer" className="underline">
                  devnet.meteora.ag
                </a>{' '}
                to find available devnet pools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
