import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { createReferralCode } from '@/services'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CreateReferralCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateReferralCodeModal({ open, onOpenChange }: CreateReferralCodeModalProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (customCode: string) => createReferralCode(customCode),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['referralCodes'] })
        handleClose()
      } else {
        setError(data.error || 'Failed to create code')
      }
    },
    onError: () => {
      setError('Failed to create code')
    },
  })

  const handleClose = useCallback(() => {
    setCode('')
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(() => {
    if (!code.trim()) {
      setError('Please enter a code')
      return
    }
    setError(null)
    mutation.mutate(code.trim())
  }, [code, mutation])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCode(e.target.value)
      if (error) {
        setError(null)
      }
    },
    [error],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] gap-0 rounded-2xl border-0 p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium">Create Referral Code</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter a code"
            disabled={mutation.isPending}
            className={cn(
              'w-full rounded-lg bg-gray-100 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className={cn(
              'w-full rounded-full bg-black py-3 text-sm font-medium text-white',
              'hover:bg-black/80 transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {mutation.isPending ? 'Creating...' : 'Enter a code'}
          </button>

          {error && <p className="text-center text-sm text-[#C20E4D]">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
