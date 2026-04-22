import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, Plus, Trash2 } from 'lucide-react'
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

type MockRow = {
  walletAddress: string
  eligible: boolean
  note: string | null
  createdAt: string
}

const API = '/api/admin/mock-solana-mobile'

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

export default function AdminMockSolanaMobilePage() {
  const secretFromUrl = useMemo(readSecretFromHash, [])
  const [secret, setSecret] = useState(secretFromUrl)
  const [authed, setAuthed] = useState(false)
  const [rows, setRows] = useState<MockRow[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ walletAddress: '', eligible: true, note: '' })

  const fetchRows = useCallback(
    async (secretValue: string) => {
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
        const data = (await res.json()) as { rows: MockRow[] }
        setRows(data.rows)
        setAuthed(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load mocks')
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!form.walletAddress.trim()) {
        toast.error('Wallet address is required')
        return
      }
      setSubmitting(true)
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': secret,
          },
          body: JSON.stringify({
            walletAddress: form.walletAddress.trim(),
            eligible: form.eligible,
            note: form.note.trim() || null,
          }),
        })
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
          throw new Error(detail.detail ?? detail.error ?? `Request failed (${res.status})`)
        }
        toast.success('Mock saved')
        setForm({ walletAddress: '', eligible: true, note: '' })
        await fetchRows(secret)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      } finally {
        setSubmitting(false)
      }
    },
    [form, secret, fetchRows],
  )

  const handleDelete = useCallback(
    async (walletAddress: string) => {
      try {
        const res = await fetch(`${API}?wallet=${encodeURIComponent(walletAddress)}`, {
          method: 'DELETE',
          headers: { 'x-admin-secret': secret },
        })
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(detail.error ?? `Request failed (${res.status})`)
        }
        toast.success('Removed')
        await fetchRows(secret)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      }
    },
    [secret, fetchRows],
  )

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rows],
  )

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-md px-6 pt-16 pb-12">
        <AdminNav />
        <h1 className="text-2xl font-semibold mb-2">Mock Solana Mobile</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the admin secret to manage mock Solana Mobile eligibility.
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
    <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-12 sm:px-10">
      <AdminNav />
      <h1 className="text-2xl font-semibold mb-2">Mock Solana Mobile eligibility</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Seeded rows short-circuit the on-chain Saga / Chapter 2 Preorder / Seeker Genesis Token
        check for Pre-Sale 2 Option 2. Use this to simulate Solana Mobile ownership
        without holding a real device NFT.
      </p>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="wallet">Wallet address</Label>
              <Input
                id="wallet"
                autoComplete="off"
                value={form.walletAddress}
                onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
                placeholder="Solana base58"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="eligible">Eligible</Label>
              <select
                id="eligible"
                value={form.eligible ? 'yes' : 'no'}
                onChange={(e) => setForm((f) => ({ ...f, eligible: e.target.value === 'yes' }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="QA, partner demo, etc."
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              <span className="ml-2">Save</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Eligible</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Loader2 className="inline size-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No Solana Mobile mocks seeded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row) => (
                  <TableRow key={row.walletAddress}>
                    <TableCell className="font-mono text-xs">{row.walletAddress}</TableCell>
                    <TableCell>{row.eligible ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-muted-foreground">{row.note ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(row.createdAt.replace(' ', 'T') + 'Z').toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.walletAddress)}
                        aria-label="Remove mock"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
