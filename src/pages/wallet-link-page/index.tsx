import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { WalletName } from '@solana/wallet-adapter-base'
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { encodeBase64 } from './lib/encoding'

type NonceResponse = {
  nonce: string
  parentWallet: string
  childWallet: string
  issuedAt: string
  expiresAt: string
  ttlSeconds: number
  message: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'invalid-parent'; reason: string }
  | { kind: 'fetching-nonce' }
  | { kind: 'awaiting-signature'; nonce: NonceResponse }
  | { kind: 'submitting' }
  | { kind: 'linked' }
  | { kind: 'error'; message: string }

function isValidBase58PubkeyLength(s: string) {
  const trimmed = s.trim()
  return trimmed.length >= 32 && trimmed.length <= 44
}

export function WalletLinkPage() {
  const parentParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('parent')?.trim() ?? ''
  }, [])

  const parentInvalidReason = !parentParam
    ? 'Missing ?parent=<wallet> query parameter.'
    : !isValidBase58PubkeyLength(parentParam)
      ? 'Parent wallet address is not a valid Solana base58 public key.'
      : null

  const { wallets, wallet, select, connect, disconnect, connected, connecting, publicKey, signMessage } = useWallet()
  const childAddress = connected && publicKey ? publicKey.toBase58() : null

  const [status, setStatus] = useState<Status>(
    parentInvalidReason ? { kind: 'invalid-parent', reason: parentInvalidReason } : { kind: 'idle' },
  )

  // Auto-connect after the user selects a wallet. One-shot: ref prevents loops
  // if the adapter errors (e.g. user cancels the wallet extension prompt).
  const pendingConnectName = useRef<WalletName | null>(null)
  useEffect(() => {
    if (!wallet || connected || connecting) return
    if (pendingConnectName.current !== wallet.adapter.name) return
    pendingConnectName.current = null
    connect().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to connect wallet')
    })
  }, [wallet, connected, connecting, connect])

  const handleSelectWallet = useCallback(
    (name: WalletName) => {
      // If the wallet is already selected (e.g. persisted in localStorage from
      // a prior visit), select() is a no-op and the connect effect never fires.
      // Trigger connect() directly in that case.
      if (wallet?.adapter.name === name && !connected && !connecting) {
        connect().catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to connect wallet')
        })
        return
      }
      pendingConnectName.current = name
      select(name)
    },
    [wallet, connected, connecting, select, connect],
  )

  const handleFetchNonce = useCallback(async () => {
    if (!childAddress || !parentParam) return
    if (childAddress === parentParam) {
      setStatus({ kind: 'error', message: 'You connected the parent wallet. Connect a different wallet to link.' })
      return
    }
    setStatus({ kind: 'fetching-nonce' })
    try {
      const res = await fetch('/api/wallet-link/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentWallet: parentParam, childWallet: childAddress }),
      })
      const body = (await res.json()) as NonceResponse | { error: string; detail?: string }
      if (!res.ok) {
        const err = body as { error: string; detail?: string }
        setStatus({ kind: 'error', message: err.detail ? `${err.error}: ${err.detail}` : err.error })
        return
      }
      setStatus({ kind: 'awaiting-signature', nonce: body as NonceResponse })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to request nonce' })
    }
  }, [childAddress, parentParam])

  const handleSignAndSubmit = useCallback(async () => {
    if (status.kind !== 'awaiting-signature') return
    if (!signMessage) {
      setStatus({ kind: 'error', message: 'Connected wallet does not support message signing.' })
      return
    }
    const nonceData = status.nonce
    const messageBytes = new TextEncoder().encode(nonceData.message)
    let sig: Uint8Array
    try {
      sig = await signMessage(messageBytes)
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'User rejected signature' })
      return
    }

    setStatus({ kind: 'submitting' })
    try {
      const res = await fetch('/api/wallet-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentWallet: nonceData.parentWallet,
          childWallet: nonceData.childWallet,
          nonce: nonceData.nonce,
          signature: encodeBase64(sig),
          signatureEncoding: 'base64',
          timestamp: nonceData.issuedAt,
        }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!res.ok || !body.ok) {
        setStatus({
          kind: 'error',
          message: body.detail ? `${body.error}: ${body.detail}` : body.error ?? 'Verification failed',
        })
        return
      }
      setStatus({ kind: 'linked' })
      // Best-effort disconnect so the wallet isn't left linked to this tab.
      disconnect().catch(() => {})
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to verify signature' })
    }
  }, [status, signMessage, disconnect])

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-[#141516] text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1">Link Wallet</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Connect a wallet and sign to bind its trading volume to the parent wallet below.
          Linking is permanent.
        </p>

        {status.kind === 'invalid-parent' ? (
          <InvalidParent reason={status.reason} />
        ) : (
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-1 py-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Parent wallet</div>
                <div className="font-mono text-sm break-all">{parentParam}</div>
              </CardContent>
            </Card>

            {status.kind === 'linked' ? (
              <LinkedCard />
            ) : (
              <>
                {!connected ? (
                  <WalletPicker
                    wallets={wallets.map((w) => ({ name: w.adapter.name, icon: w.adapter.icon }))}
                    onSelect={handleSelectWallet}
                    connecting={connecting}
                  />
                ) : (
                  <ConnectedCard
                    address={childAddress ?? ''}
                    walletName={wallet?.adapter.name ?? ''}
                    onDisconnect={() => {
                      disconnect().catch(() => {})
                      setStatus({ kind: 'idle' })
                    }}
                  />
                )}

                {connected && childAddress && childAddress === parentParam && (
                  <ErrorBanner message="You connected the parent wallet. Connect a different wallet to link." />
                )}

                {connected && childAddress && childAddress !== parentParam && (
                  <ActionPanel
                    status={status}
                    onFetchNonce={handleFetchNonce}
                    onSignAndSubmit={handleSignAndSubmit}
                  />
                )}

                {status.kind === 'error' && <ErrorBanner message={status.message} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InvalidParent({ reason }: { reason: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-5">
        <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium mb-1">Unable to start linking</div>
          <div className="text-muted-foreground">{reason}</div>
          <div className="text-muted-foreground mt-2">
            Open this page via the "Link another wallet" button on the eligibility page.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WalletPicker({
  wallets,
  onSelect,
  connecting,
}: {
  wallets: Array<{ name: WalletName; icon: string }>
  onSelect: (name: WalletName) => void
  connecting: boolean
}) {
  if (wallets.length === 0) {
    return (
      <Card>
        <CardContent className="py-5 text-sm text-muted-foreground">
          No Solana wallets detected. Install Phantom, Solflare, or Backpack and reload this page.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Connect wallet</div>
        <div className="grid grid-cols-1 gap-2">
          {wallets.map((w) => (
            <button
              key={w.name}
              type="button"
              onClick={() => onSelect(w.name)}
              disabled={connecting}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {w.icon ? <img src={w.icon} alt="" className="size-6 rounded" /> : null}
              <span className="text-sm font-medium">{w.name}</span>
              {connecting ? <Loader2 className="size-4 animate-spin ml-auto" /> : null}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectedCard({
  address,
  walletName,
  onDisconnect,
}: {
  address: string
  walletName: string
  onDisconnect: () => void
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <CheckCircle2 className="size-5 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Child wallet ({walletName})</div>
          <div className="font-mono text-sm break-all">{address}</div>
        </div>
        <Button size="sm" variant="outline" onClick={onDisconnect}>
          Disconnect
        </Button>
      </CardContent>
    </Card>
  )
}

function ActionPanel({
  status,
  onFetchNonce,
  onSignAndSubmit,
}: {
  status: Status
  onFetchNonce: () => void
  onSignAndSubmit: () => void
}) {
  if (status.kind === 'awaiting-signature') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Message to sign</div>
          <pre className="text-xs whitespace-pre-wrap font-mono bg-neutral-100 dark:bg-neutral-900 rounded-md p-3">
            {status.nonce.message}
          </pre>
          <Button onClick={onSignAndSubmit} className="w-full h-11">
            Sign and link
          </Button>
        </CardContent>
      </Card>
    )
  }
  if (status.kind === 'submitting') {
    return (
      <Button disabled className="w-full h-11">
        <Loader2 className="size-4 animate-spin mr-2" /> Verifying signature…
      </Button>
    )
  }
  if (status.kind === 'fetching-nonce') {
    return (
      <Button disabled className="w-full h-11">
        <Loader2 className="size-4 animate-spin mr-2" /> Preparing…
      </Button>
    )
  }
  return (
    <Button onClick={onFetchNonce} className="w-full h-11">
      Continue
    </Button>
  )
}

function LinkedCard() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-5">
        <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium mb-1">Wallet linked</div>
          <div className="text-sm text-muted-foreground">
            You can close this tab. Trading volume from this wallet will now be counted toward the parent.
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => window.close()}
          >
            <ExternalLink className="size-4 mr-2" /> Close this tab
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      <XCircle className="size-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}
