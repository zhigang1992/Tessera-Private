import { useCallback, useMemo, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const API = '/api/admin/whitelist-applications-bulk'
const MAX_WALLETS = 100

type Preview = { wallet: string; issue: string | null }

function normalize(raw: string): Preview[] {
  const seen = new Set<string>()
  const out: Preview[] = []
  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim().replace(/^,+|,+$/g, '')
    if (!trimmed) continue
    // Tolerate a header line or multi-column CSV by taking only the first column.
    const first = trimmed.split(',')[0].trim()
    if (!first) continue
    if (first.toLowerCase() === 'wallet_address' || first.toLowerCase() === 'wallet') continue
    const issue =
      first.length < 32 || first.length > 48 ? 'Invalid address format' : seen.has(first) ? 'Duplicate' : null
    if (!issue) seen.add(first)
    out.push({ wallet: first, issue })
  }
  return out
}

export function CsvUploadDialog({
  open,
  onOpenChange,
  secret,
  onComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  secret: string
  onComplete: () => void
}) {
  const [fileName, setFileName] = useState('')
  const [rawText, setRawText] = useState('')
  const [markSelected, setMarkSelected] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const preview = useMemo(() => normalize(rawText), [rawText])
  const valid = preview.filter((p) => !p.issue)
  const overLimit = valid.length > MAX_WALLETS

  const reset = () => {
    setFileName('')
    setRawText('')
    setMarkSelected(false)
  }

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    setRawText(text)
  }, [])

  const handleSubmit = async () => {
    if (valid.length === 0) {
      toast.error('No valid wallet addresses in the file.')
      return
    }
    if (overLimit) {
      toast.error(`Max ${MAX_WALLETS} wallets per upload — split the file and try again.`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          markSelected,
          walletAddresses: valid.map((p) => p.wallet),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        inserted?: number
        updated?: number
        skipped?: { walletAddress: string; reason: string; detail?: string }[]
        error?: string
        detail?: string
      }
      if (!res.ok) {
        throw new Error(data.detail ?? data.error ?? `Upload failed (${res.status})`)
      }
      const skippedCount = data.skipped?.length ?? 0
      toast.success(
        `Imported ${data.inserted ?? 0} new, updated ${data.updated ?? 0}. Skipped ${skippedCount}.`,
      )
      if (data.skipped && data.skipped.length > 0) {
        console.warn('CSV import skipped rows:', data.skipped)
      }
      reset()
      onOpenChange(false)
      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import whitelist applications</DialogTitle>
          <DialogDescription>
            Upload a CSV or plain-text file with one wallet address per line. Eligibility
            snapshot fields are fetched automatically on import. Max {MAX_WALLETS} wallets per
            upload.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="csv-file">CSV file</Label>
            <div className="flex items-center gap-2">
              <input
                id="csv-file"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFile(f)
                }}
                className="text-sm"
              />
              {fileName ? <span className="text-xs text-muted-foreground">{fileName}</span> : null}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={markSelected}
              onChange={(e) => setMarkSelected(e.target.checked)}
              className="size-4"
            />
            Mark this batch as selected for Pre-Sale 1
          </label>

          {preview.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">
                Preview: {valid.length} valid, {preview.length - valid.length} issues
                {overLimit ? (
                  <span className="text-red-600 ml-2">
                    Over limit — only the first {MAX_WALLETS} valid addresses can be submitted.
                  </span>
                ) : null}
              </div>
              <div className="max-h-60 overflow-auto border rounded-md text-xs font-mono">
                {preview.map((p, i) => (
                  <div
                    key={`${p.wallet}:${i}`}
                    className={`flex items-center justify-between px-3 py-1 border-b last:border-b-0 ${
                      p.issue ? 'bg-red-500/5 text-red-600' : ''
                    }`}
                  >
                    <span className="truncate">{p.wallet}</span>
                    {p.issue ? <span className="shrink-0 ml-2">{p.issue}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || valid.length === 0 || overLimit}>
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
            Import {valid.length ? `${valid.length} wallets` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
