import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Lock, RotateCcw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ApplicationRow = {
  walletAddress: string
  tokenId: string
  status: 'pending' | 'approved' | 'rejected'
  tradingVolumeUsd: number | null
  twitterHandle: string | null
  twitterConnected: boolean
  socialPostFound: boolean
  socialPostTweetUrl: string | null
  adminNote: string | null
  appliedAt: string
  reviewedAt: string | null
}

const API = '/api/admin/whitelist-applications'

// Match the mock-volumes admin page: the secret lives in the URL hash
// (#secret=…) rather than the query string, so it never reaches the server,
// CDN, or access logs.
function readSecretFromHash(): string {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(hash).get('secret') ?? ''
}

function writeSecretToHash(value: string) {
  const params = new URLSearchParams(
    window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash,
  )
  if (value) {
    params.set('secret', value)
  } else {
    params.delete('secret')
  }
  const next = params.toString()
  const url = `${window.location.pathname}${window.location.search}${next ? `#${next}` : ''}`
  window.history.replaceState(null, '', url)
}

const STATUS_STYLE: Record<ApplicationRow['status'], string> = {
  pending: 'text-[#d4a017]',
  approved: 'text-[#06a800]',
  rejected: 'text-[#d4183d]',
}

export default function AdminWhitelistApplicationsPage() {
  const secretFromUrl = useMemo(readSecretFromHash, [])
  const [secret, setSecret] = useState(secretFromUrl)
  const [authed, setAuthed] = useState(false)
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const rowKey = useCallback(
    (row: Pick<ApplicationRow, 'walletAddress' | 'tokenId'>) =>
      `${row.walletAddress}:${row.tokenId}`,
    [],
  )

  const fetchRows = useCallback(
    async (secretValue: string) => {
      setLoading(true)
      try {
        const res = await fetch(API, {
          headers: { 'x-admin-secret': secretValue },
        })
        if (res.status === 401) {
          setAuthed(false)
          throw new Error('Invalid secret')
        }
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}))
          throw new Error((detail as { error?: string }).error ?? `Request failed (${res.status})`)
        }
        const data = (await res.json()) as { rows: ApplicationRow[] }
        setRows(data.rows)
        setAuthed(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (secretFromUrl && !authed) {
      void fetchRows(secretFromUrl)
    }
  }, [secretFromUrl, authed, fetchRows])

  const handleUnlock = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!secret) {
        toast.error('Enter the admin secret')
        return
      }
      writeSecretToHash(secret)
      void fetchRows(secret)
    },
    [secret, fetchRows],
  )

  const updateStatus = useCallback(
    async (row: ApplicationRow, status: ApplicationRow['status']) => {
      const key = rowKey(row)
      setPending((p) => ({ ...p, [key]: true }))
      try {
        const note = noteDraft[key] !== undefined ? noteDraft[key] : row.adminNote ?? ''
        const res = await fetch(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': secret,
          },
          body: JSON.stringify({
            walletAddress: row.walletAddress,
            tokenId: row.tokenId,
            status,
            note: note.trim() || null,
          }),
        })
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
          throw new Error(detail.detail ?? detail.error ?? `Request failed (${res.status})`)
        }
        toast.success(`Set to ${status}`)
        await fetchRows(secret)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update')
      } finally {
        setPending((p) => ({ ...p, [key]: false }))
      }
    },
    [rowKey, noteDraft, secret, fetchRows],
  )

  const handleDelete = useCallback(
    async (row: ApplicationRow) => {
      const key = rowKey(row)
      setPending((p) => ({ ...p, [key]: true }))
      try {
        const res = await fetch(
          `${API}?wallet=${encodeURIComponent(row.walletAddress)}&tokenId=${encodeURIComponent(row.tokenId)}`,
          {
            method: 'DELETE',
            headers: { 'x-admin-secret': secret },
          },
        )
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(detail.error ?? `Request failed (${res.status})`)
        }
        toast.success('Removed')
        await fetchRows(secret)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      } finally {
        setPending((p) => ({ ...p, [key]: false }))
      }
    },
    [rowKey, secret, fetchRows],
  )

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const statusOrder: Record<ApplicationRow['status'], number> = {
          pending: 0,
          approved: 1,
          rejected: 2,
        }
        const diff = statusOrder[a.status] - statusOrder[b.status]
        if (diff !== 0) return diff
        return b.appliedAt.localeCompare(a.appliedAt)
      }),
    [rows],
  )

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-md px-6 pt-16 pb-12">
        <h1 className="text-2xl font-semibold mb-2">Pre-Sale 1 whitelist applications</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the admin secret to review whitelist applications.
        </p>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="secret">Admin secret</Label>
                <Input
                  id="secret"
                  type="password"
                  autoComplete="off"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Paste secret"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                <span className="ml-2">Unlock</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-12 sm:px-10">
      <h1 className="text-2xl font-semibold mb-2">Pre-Sale 1 whitelist applications</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Applications are created when a user who passes all eligibility checks clicks
        "Apply Whitelist" on the Pre-Sale 1 eligibility page. Pending applications wait
        on your review. Pre-Sale 2 has no manual application — it is automatic.
      </p>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Volume (USD)</TableHead>
                <TableHead>X handle</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-64 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    <Loader2 className="inline size-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row) => {
                  const key = rowKey(row)
                  const busy = !!pending[key]
                  const noteValue = noteDraft[key] ?? row.adminNote ?? ''
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">
                        {row.walletAddress.slice(0, 6)}…{row.walletAddress.slice(-4)}
                      </TableCell>
                      <TableCell>{row.tokenId}</TableCell>
                      <TableCell>
                        <span className={`font-semibold capitalize ${STATUS_STYLE[row.status]}`}>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.tradingVolumeUsd !== null
                          ? row.tradingVolumeUsd.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.twitterHandle ? `@${row.twitterHandle}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.socialPostTweetUrl ? (
                          <a
                            href={row.socialPostTweetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            view
                          </a>
                        ) : row.socialPostFound ? (
                          'yes'
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(row.appliedAt.replace(' ', 'T') + 'Z').toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={noteValue}
                          onChange={(e) =>
                            setNoteDraft((d) => ({ ...d, [key]: e.target.value }))
                          }
                          placeholder="Add note (optional)"
                          className="h-8 text-xs min-w-[160px]"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.status !== 'approved' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => updateStatus(row, 'approved')}
                              aria-label="Approve"
                            >
                              <Check className="size-4" />
                            </Button>
                          ) : null}
                          {row.status !== 'rejected' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => updateStatus(row, 'rejected')}
                              aria-label="Reject"
                            >
                              <X className="size-4" />
                            </Button>
                          ) : null}
                          {row.status !== 'pending' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => updateStatus(row, 'pending')}
                              aria-label="Reset to pending"
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => handleDelete(row)}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
