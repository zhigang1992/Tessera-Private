import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API = '/api/admin/whitelist-applications-manual'

export function ManualAddDialog({
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
  const [wallet, setWallet] = useState('')
  const [presale1Selected, setPresale1Selected] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setWallet('')
    setPresale1Selected(false)
    setAdminNote('')
  }

  const handleSubmit = async () => {
    const trimmed = wallet.trim()
    if (!trimmed) {
      toast.error('Enter a wallet address.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          walletAddress: trimmed,
          presale1Selected,
          adminNote: adminNote.trim() || null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        inserted?: boolean
        updated?: boolean
        error?: string
        detail?: string
      }
      if (!res.ok) {
        throw new Error(data.detail ?? data.error ?? `Request failed (${res.status})`)
      }
      toast.success(data.inserted ? 'Added' : 'Updated existing row')
      reset()
      onOpenChange(false)
      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add record')
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add manual record</DialogTitle>
          <DialogDescription>
            Insert or update a single whitelist application row. Eligibility snapshot fields are
            fetched automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wallet">Wallet address</Label>
            <Input
              id="wallet"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="e.g. 9xQe…abcd"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Admin note (optional)</Label>
            <Input
              id="note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Reason / context"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={presale1Selected}
              onChange={(e) => setPresale1Selected(e.target.checked)}
              className="size-4"
            />
            Mark as selected for Pre-Sale 1
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !wallet.trim()}>
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
            Add record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
