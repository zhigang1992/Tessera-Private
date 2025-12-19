import { useState, useCallback, useMemo, FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useCreateReferralCode } from '@/features/referral/hooks/use-referral-queries'
import { useReferralAuth } from '@/features/referral/hooks/use-referral-auth'
import { UrlKeyAlertDialog } from '@/features/referral/ui/url-key-alert-dialog'
import { getUrlKeyAlertHandlers } from '@/features/referral/lib/url-key-alert'

interface CreateReferralCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateReferralCodeModal({ open, onOpenChange }: CreateReferralCodeModalProps) {
  const [customCode, setCustomCode] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const createCodeMutation = useCreateReferralCode()
  const { isAuthenticated, isAuthenticating, authenticate, showUrlKeyAlert, setShowUrlKeyAlert } = useReferralAuth()

  const trimmedCustomCode = useMemo(() => customCode.trim(), [customCode])
  const normalizedCustomCode = useMemo(() => trimmedCustomCode.toUpperCase(), [trimmedCustomCode])
  const isCustomCodeProvided = trimmedCustomCode.length > 0
  const isCustomCodeLengthValid =
    !isCustomCodeProvided || (trimmedCustomCode.length >= 6 && trimmedCustomCode.length <= 12)
  const isCreatePending = createCodeMutation.isPending || isAuthenticating
  const isCreateDisabled = isCreatePending || (isCustomCodeProvided && !isCustomCodeLengthValid)

  const handleUrlKeyConfirm = async () => {
    const handlers = getUrlKeyAlertHandlers()
    if (handlers?.handleConfirm) {
      await handlers.handleConfirm()
    }
  }

  const handleUrlKeyCancel = () => {
    const handlers = getUrlKeyAlertHandlers()
    if (handlers?.handleCancel) {
      handlers.handleCancel()
    }
  }

  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (isCreateDisabled) {
      return
    }

    // If not authenticated, require sign message first
    if (!isAuthenticated) {
      const signedIn = await authenticate()
      if (!signedIn) {
        return
      }
    }

    if (isCustomCodeProvided && !isCustomCodeLengthValid) {
      const validationMessage = 'Custom codes must be between 6 and 12 characters'
      setFormError(validationMessage)
      return
    }

    const payload = isCustomCodeProvided ? { codeSlug: normalizedCustomCode } : {}

    setFormError(null)

    try {
      await createCodeMutation.mutateAsync(payload)
      setCustomCode('')
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create referral code'
      setFormError(message)
      console.error('Failed to create referral code', error)
    }
  }, [isCreateDisabled, isAuthenticated, authenticate, isCustomCodeProvided, isCustomCodeLengthValid, normalizedCustomCode, createCodeMutation, onOpenChange])

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
                  'w-full rounded-lg bg-gray-100 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground',
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
              <Button type="submit" disabled={isCreateDisabled}>
                {isCreatePending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isCreatePending ? 'Creating...' : 'Create code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UrlKeyAlertDialog
        open={showUrlKeyAlert}
        onOpenChange={setShowUrlKeyAlert}
        onConfirm={handleUrlKeyConfirm}
        onCancel={handleUrlKeyCancel}
      />
    </>
  )
}
