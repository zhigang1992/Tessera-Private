import { useState, useCallback, useMemo, FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useCreateReferralCode } from '@/features/referral/hooks/use-referral-onchain'
import { useConnection } from '@/hooks/use-wallet'
import { findReferralCodeByString } from '@/lib/solana/on-chain-client'

interface CreateReferralCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (code: string) => void
}

export function CreateReferralCodeModal({ open, onOpenChange, onSuccess }: CreateReferralCodeModalProps) {
  const [customCode, setCustomCode] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const createCodeMutation = useCreateReferralCode()
  const { connection } = useConnection()

  const trimmedCustomCode = useMemo(() => customCode.trim(), [customCode])
  const normalizedCustomCode = useMemo(() => trimmedCustomCode.toUpperCase(), [trimmedCustomCode])
  const isCustomCodeProvided = trimmedCustomCode.length > 0
  const isCustomCodeLengthValid =
    !isCustomCodeProvided || (trimmedCustomCode.length >= 6 && trimmedCustomCode.length <= 12)
  const isCreatePending = createCodeMutation.isPending
  const isCreateDisabled = isCreatePending || (isCustomCodeProvided && !isCustomCodeLengthValid)

  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (isCreateDisabled) {
      return
    }

    if (isCustomCodeProvided && !isCustomCodeLengthValid) {
      const validationMessage = 'Custom codes must be between 6 and 12 characters'
      setFormError(validationMessage)
      return
    }

    // Check if custom code already exists
    if (isCustomCodeProvided) {
      try {
        const existingCode = await findReferralCodeByString(connection, normalizedCustomCode)
        if (existingCode && existingCode.isActive) {
          const validationMessage = 'This referral code already exists'
          setFormError(validationMessage)
          return
        }
      } catch (error) {
        console.error('Failed to check existing referral code', error)
        // Continue with creation if check fails
      }
    }

    const payload = isCustomCodeProvided ? { codeSlug: normalizedCustomCode } : {}

    setFormError(null)

    try {
      const result = await createCodeMutation.mutateAsync(payload)
      const createdCode = normalizedCustomCode || result.code
      setCustomCode('')
      onOpenChange(false)
      // Call onSuccess with the created code after a small delay
      // to ensure React Query has updated the component state
      if (onSuccess && createdCode) {
        setTimeout(() => onSuccess(createdCode), 0)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create referral code'
      setFormError(message)
      console.error('Failed to create referral code', error)
    }
  }, [isCreateDisabled, isCustomCodeProvided, isCustomCodeLengthValid, normalizedCustomCode, createCodeMutation, onOpenChange, onSuccess, connection])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomCode(e.target.value)
      if (formError) {
        setFormError(null)
      }
    },
    [formError],
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] gap-0 rounded-2xl border-0 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-medium">Create Referral Code</DialogTitle>
            <DialogDescription>
              Enter a custom code between 6 and 12 characters or leave the field blank to generate one automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="custom-referral-code">Custom code</Label>
              <Input
                id="custom-referral-code"
                value={customCode}
                onChange={handleInputChange}
                placeholder="TESSERA1"
                maxLength={12}
                aria-invalid={isCustomCodeProvided && !isCustomCodeLengthValid}
                aria-describedby={
                  isCustomCodeProvided && !isCustomCodeLengthValid
                    ? 'custom-referral-code-error'
                    : 'custom-referral-code-helper'
                }
                disabled={isCreatePending}
                className={cn(
                  'w-full rounded-lg bg-gray-100 dark:bg-muted px-4 py-3 text-sm outline-none placeholder:text-muted-foreground',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              />
              <p id="custom-referral-code-helper" className="text-xs text-muted-foreground">
                Leave blank to generate a random code.
              </p>
              {isCustomCodeProvided && !isCustomCodeLengthValid && (
                <p id="custom-referral-code-error" className="text-xs font-medium text-destructive">
                  Custom codes must be between 6 and 12 characters.
                </p>
              )}
              {formError && !(isCustomCodeProvided && !isCustomCodeLengthValid) && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {formError}
                </p>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreatePending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreateDisabled} className="bg-black dark:bg-[#d2fb95] text-white dark:text-black hover:bg-black/90 dark:hover:bg-[#d2fb95]/80">
                {isCreatePending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isCreatePending ? 'Creating...' : 'Create code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
