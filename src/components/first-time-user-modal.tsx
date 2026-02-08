import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getCrossDomainStorage, setCrossDomainStorage } from '@/lib/cross-domain-storage'

const STORAGE_KEY = 'tessera_terms_accepted'

export function FirstTimeUserModal() {
  const [open, setOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    // Check if user has already accepted terms (checks both cookie and localStorage)
    const hasAccepted = getCrossDomainStorage(STORAGE_KEY)
    if (!hasAccepted) {
      setOpen(true)
    }
  }, [])

  const handleAcceptChange = (checked: boolean) => {
    setAccepted(checked)
  }

  const handleContinue = () => {
    if (accepted) {
      setCrossDomainStorage({
        key: STORAGE_KEY,
        value: 'true',
        expiryDays: 365,
      })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[520px] gap-6 p-6 sm:p-10">
        <DialogHeader className="gap-0">
          <DialogTitle className="text-lg font-bold text-center">
            Terms and Conditions
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-center opacity-50">
            Tessera
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm leading-[1.5] space-y-4">
          <p>Before proceeding, please review and accept our Terms and Conditions.</p>
          <p>
            By accessing and using Tessera's platform, you acknowledge that you have read,
            understood, and agree to be bound by our{' '}
            <a
              href="https://terms.tessera.pe"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-solid"
            >
              Terms and Conditions
            </a>
            .
          </p>
          <p>
            These terms govern your use of our tokenization platform and outline important
            information about risks, limitations, and your rights and obligations as a user.
          </p>
        </div>

        <div className="h-px bg-[#e4e4e7] w-full" />

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={accepted}
                onChange={(e) => handleAcceptChange(e.target.checked)}
                className="size-[18px] rounded-[2px] border border-[#c8c8c8] cursor-pointer accent-[#06a800]"
              />
            </div>
            <label htmlFor="terms-checkbox" className="text-sm leading-[1.5] cursor-pointer">
              I accept and agree to the{' '}
              <a
                href="https://terms.tessera.pe"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#06a800] hover:underline"
              >
                Terms and Conditions
              </a>
              .
            </label>
          </div>

          <button
            onClick={handleContinue}
            disabled={!accepted}
            className={`w-full px-[126px] py-[10px] rounded-lg text-[13px] font-medium text-center text-white tracking-[-0.0762px] transition-colors ${
              accepted
                ? 'bg-[#06a800] hover:bg-[#059700] cursor-pointer'
                : 'bg-[#b1b1b1] opacity-50 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
