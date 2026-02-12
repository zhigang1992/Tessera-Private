import { useState } from 'react'
import { Mail } from 'lucide-react'

interface EmailCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => Promise<void>
  walletAddress?: string
}

export function EmailCaptureModal({ isOpen, onClose, onSubmit }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(email.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSkip()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={handleOverlayClick}
    >
      <div className="bg-white border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] rounded-2xl w-[480px] max-w-[90vw] px-10 pt-6 pb-10 flex flex-col gap-6 items-center">
        {/* Title */}
        <h2 className="text-lg font-bold leading-[1.5] tracking-[0.1172px] text-black dark:text-[#d2d2d2] text-center w-full">
          Be the First to Know
        </h2>

        {/* Icon and Description */}
        <div className="flex gap-4 items-center w-full">
          {/* Mail Icon */}
          <div className="shrink-0 w-[81px] h-[81px] rounded-full bg-gradient-to-br from-[#aad36d] to-[#06a800] flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" strokeWidth={1.5} />
            <div className="absolute w-6 h-6 rounded-full bg-white/20 -top-2 -right-2" />
          </div>

          {/* Description */}
          <p className="flex-1 text-sm leading-[1.5] tracking-[0.1172px] text-black dark:text-[#d2d2d2]">
            Leave your email to get instant notifications on new asset listings and exclusive updates.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 w-full">
          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="Your email address"
              disabled={isSubmitting}
              className="w-full h-12 px-[17px] py-px rounded-xl border border-[#a1a1aa] dark:border-[rgba(210,210,210,0.3)] bg-white dark:bg-[#323334] text-base text-black dark:text-[#d2d2d2] placeholder:text-[#999] tracking-[-0.625px] focus:outline-none focus:border-[#06a800] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {error && (
              <p className="absolute -bottom-5 left-0 text-xs text-red-500">{error}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 w-full">
            {/* Join Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-lg py-[10px] px-[126px] text-[13px] font-medium tracking-[-0.0762px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Join'}
            </button>

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 border border-[#18181b] dark:border-white text-[#18181b] dark:text-white rounded-lg py-[10px] px-[126px] text-[13px] font-medium tracking-[-0.0762px] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
