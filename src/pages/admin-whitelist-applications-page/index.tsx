import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, Plus, Trash2, Upload } from 'lucide-react'
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
import { AdminNav } from '../admin-shared/admin-nav'
import { CsvUploadDialog } from './components/csv-upload-dialog'
import { ManualAddDialog } from './components/manual-add-dialog'

type QualifiedVia =
  | 'snapshot_volume'
  | 'solana_mobile'
  | 'volume_twitter'
  | 'admin_manual'
  | 'admin_csv'

type ApplicationRow = {
  walletAddress: string
  qualifiedVia: QualifiedVia
  tradingVolumeUsd: number | null
  snapshotVolumeUsd: number | null
  solanaMobileEligible: boolean | null
  twitterHandle: string | null
  twitterConnected: boolean
  socialPostFound: boolean
  socialPostTweetUrl: string | null
  presale1Selected: boolean
  adminNote: string | null
  qualifiedAt: string
  selectedAt: string | null
}

type ListResponse = {
  rows: ApplicationRow[]
  totalCount: number
  presale1SelectedCount: number
}

const API = '/api/admin/whitelist-applications'

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
  if (value) params.set('secret', value)
  else params.delete('secret')
  const next = params.toString()
  const url = `${window.location.pathname}${window.location.search}${next ? `#${next}` : ''}`
  window.history.replaceState(null, '', url)
}

const VIA_LABEL: Record<QualifiedVia, string> = {
  snapshot_volume: 'Snapshot',
  solana_mobile: 'Solana Mobile',
  volume_twitter: 'Volume + X',
  admin_manual: 'Manual',
  admin_csv: 'CSV',
}

const VIA_STYLE: Record<QualifiedVia, string> = {
  snapshot_volume: 'bg-[#06a80015] text-[#06a800]',
  solana_mobile: 'bg-[#7a5cff15] text-[#7a5cff]',
  volume_twitter: 'bg-[#d4a01715] text-[#b8860b]',
  admin_manual: 'bg-[#66666615] text-[#666]',
  admin_csv: 'bg-[#66666615] text-[#666]',
}

export default function AdminWhitelistApplicationsPage() {
  const secretFromUrl = useMemo(readSecretFromHash, [])
  const [secret, setSecret] = useState(secretFromUrl)
  const [authed, setAuthed] = useState(false)
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [csvOpen, setCsvOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  const fetchRows = useCallback(async (secretValue: string) => {
    setLoading(true)
    try {
      const res = await fetch(API, { headers: { 'x-admin-secret': secretValue } })
      if (res.status === 401) {
        setAuthed(false)
        throw new Error('Invalid secret')
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error((detail as { error?: string }).error ?? `Request failed (${res.status})`)
      }
      const data = (await res.json()) as ListResponse
      setRows(data.rows)
      setTotalCount(data.totalCount)
      setSelectedCount(data.presale1SelectedCount)
      setAuthed(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const updateRow = useCallback(
    async (
      walletAddress: string,
      body: { presale1Selected?: boolean; adminNote?: string | null },
    ) => {
      setPending((p) => ({ ...p, [walletAddress]: true }))
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
          body: JSON.stringify({ walletAddress, ...body }),
        })
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
          throw new Error(detail.detail ?? detail.error ?? `Request failed (${res.status})`)
        }
        await fetchRows(secret)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update')
      } finally {
        setPending((p) => ({ ...p, [walletAddress]: false }))
      }
    },
    [secret, fetchRows],
  )

  const handleToggleSelected = useCallback(
    (row: ApplicationRow) => {
      void updateRow(row.walletAddress, { presale1Selected: !row.presale1Selected })
    },
    [updateRow],
  )

  const handleSaveNote = useCallback(
    (row: ApplicationRow) => {
      const draft = noteDraft[row.walletAddress]
      if (draft === undefined) return
      const next = draft.trim() ? draft.trim() : null
      if (next === (row.adminNote ?? null)) return
      void updateRow(row.walletAddress, { adminNote: next })
    },
    [noteDraft, updateRow],
  )

  const handleDelete = useCallback(
    async (row: ApplicationRow) => {
      setPending((p) => ({ ...p, [row.walletAddress]: true }))
      try {
        const res = await fetch(
          `${API}?wallet=${encodeURIComponent(row.walletAddress)}`,
          { method: 'DELETE', headers: { 'x-admin-secret': secret } },
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
        setPending((p) => ({ ...p, [row.walletAddress]: false }))
      }
    },
    [secret, fetchRows],
  )

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-md px-6 pt-16 pb-12">
        <AdminNav />
        <h1 className="text-2xl font-semibold mb-2">Whitelist applications</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the admin secret to review whitelist candidates and manage Pre-Sale 1 selection.
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
    <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-12 sm:px-10">
      <AdminNav />
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Whitelist applications</h1>
          <p className="text-sm text-muted-foreground">
            Records are created when a qualifying user clicks Check Eligibility, or via admin
            CSV / manual entry. Toggle the Pre-Sale 1 switch to select a wallet for the final
            whitelist.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-[#06a80015] text-[#06a800]">
            Pre-Sale 1 selected: {selectedCount} / {totalCount} qualified
          </span>
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload className="size-4 mr-2" /> CSV upload
          </Button>
          <Button variant="outline" size="sm" onClick={() => setManualOpen(true)}>
            <Plus className="size-4 mr-2" /> Add record
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Qualified via</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Snapshot</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>X handle</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Qualified</TableHead>
                <TableHead>Selected for P1</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-10 text-right">…</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    <Loader2 className="inline size-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const busy = !!pending[row.walletAddress]
                  const noteValue = noteDraft[row.walletAddress] ?? row.adminNote ?? ''
                  return (
                    <TableRow key={row.walletAddress}>
                      <TableCell className="font-mono text-xs">
                        {row.walletAddress.slice(0, 6)}…{row.walletAddress.slice(-4)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${VIA_STYLE[row.qualifiedVia]}`}
                        >
                          {VIA_LABEL[row.qualifiedVia]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {row.tradingVolumeUsd != null
                          ? row.tradingVolumeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {row.snapshotVolumeUsd != null
                          ? row.snapshotVolumeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.solanaMobileEligible == null ? '—' : row.solanaMobileEligible ? '✓' : '✗'}
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
                        {new Date(row.qualifiedAt.replace(' ', 'T') + 'Z').toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.presale1Selected}
                          onClick={() => handleToggleSelected(row)}
                          disabled={busy}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
                            row.presale1Selected ? 'bg-[#06a800]' : 'bg-[#d4d4d4] dark:bg-[#404040]'
                          }`}
                        >
                          <span
                            className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                              row.presale1Selected ? 'translate-x-[18px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={noteValue}
                          onChange={(e) =>
                            setNoteDraft((d) => ({ ...d, [row.walletAddress]: e.target.value }))
                          }
                          onBlur={() => handleSaveNote(row)}
                          placeholder="Add note"
                          className="h-8 text-xs min-w-[160px]"
                          disabled={busy}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => handleDelete(row)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CsvUploadDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        secret={secret}
        onComplete={() => void fetchRows(secret)}
      />
      <ManualAddDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        secret={secret}
        onComplete={() => void fetchRows(secret)}
      />
    </div>
  )
}
