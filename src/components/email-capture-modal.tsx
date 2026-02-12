import { useState } from 'react'

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
      <div className="bg-white dark:bg-[#323334] border border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)] rounded-2xl w-[480px] max-w-[90vw] px-6 sm:px-10 pt-6 pb-10 flex flex-col gap-6 items-center">
        {/* Title */}
        <h2 className="text-lg font-bold leading-[1.5] tracking-[0.1172px] text-black dark:text-[#d2d2d2] text-center w-full">
          Be the First to Know
        </h2>

        {/* Icon and Description */}
        <div className="flex gap-4 items-center w-full">
          {/* Mail Icon with decorative circle */}
          <svg width="81" height="81" viewBox="0 0 81 81" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40.5" cy="40.5" r="40.5" fill="#DDDDDD"/>
            <path d="M13.0146 24.3447H68.5576C68.7953 24.3447 68.9911 24.5407 68.9912 24.7783V57.6279C68.9912 57.8656 68.7955 58.0625 68.5576 58.0625H13.0146C12.777 58.0624 12.5811 57.8656 12.5811 57.6279V24.7783C12.5812 24.5407 12.7771 24.3448 13.0146 24.3447Z" fill="black" stroke="black" stroke-width="0.75"/>
            <path d="M13.7447 28.3512L38.7907 43.3624C39.8914 44.088 41.2569 44.0933 42.3622 43.3762L67.8072 28.3649C70.9304 26.3383 69.6437 21 66.0319 21H15.5409C11.942 20.9999 10.6451 26.3078 13.7447 28.3512Z" fill="#D2FB95"/>
            <path d="M67.2053 46.6501C66.1147 46.6037 65.1176 46.0939 64.3435 45.4041C63.4718 44.6273 62.8897 43.6212 62.4483 42.5892C62.1838 41.9708 61.9617 41.338 61.7406 40.7056C61.6432 40.4273 61.239 40.4357 61.1379 40.7056C60.7991 41.6093 60.383 42.4853 59.8905 43.3265C59.4818 44.0244 59.0258 44.7239 58.358 45.2376C58.33 45.2591 58.3014 45.28 58.2725 45.3004C57.5407 45.7207 56.6775 45.9291 55.8065 45.8879C55.4601 45.8715 55.3736 46.3974 55.7234 46.4555C58.1046 46.8506 60.1007 48.5737 60.8259 50.6926C61.0313 51.2929 61.1306 51.9131 61.1142 52.5428C61.1053 52.8859 61.6114 52.912 61.728 52.6197C62.4976 50.6919 63.3886 48.5437 65.5169 47.5829C66.0429 47.3454 66.6196 47.2192 67.2052 47.2281C67.609 47.2341 67.6057 46.6671 67.2053 46.6501Z" fill="white"/>
            <path d="M75.8149 35.1207C75.0402 35.0822 74.3318 34.6576 73.7821 34.0833C73.1628 33.4364 72.7494 32.5988 72.4358 31.7395C72.2479 31.2247 72.0901 30.6978 71.933 30.1712C71.8639 29.9394 71.5767 29.9465 71.5049 30.1712C71.2642 30.9236 70.9686 31.653 70.6187 32.3534C70.3284 32.9345 70.0045 33.517 69.5301 33.9447C69.5102 33.9628 69.4899 33.98 69.4694 33.9971C68.9496 34.347 68.3364 34.5204 67.7177 34.4861C67.4716 34.4724 67.4102 34.9104 67.6587 34.9587C69.3502 35.2877 70.7682 36.7224 71.2834 38.4866C71.4294 38.9865 71.4998 39.503 71.4882 40.0272C71.4819 40.3129 71.8414 40.3345 71.9243 40.0912C72.4709 38.4859 73.1039 36.6972 74.6156 35.8973C74.9893 35.6996 75.399 35.5945 75.8149 35.6018C76.1017 35.6071 76.0993 35.1349 75.8149 35.1207Z" fill="white"/>
            <circle cx="40.5" cy="40.5" r="9" fill="white"/>
            <path d="M42.946 44.3697L40.7713 45.6429L40.7654 43.8012L40.7639 43.4073L40.771 43.4114V43.1082L42.9375 41.8399L42.946 44.3697ZM40.2213 43.1127L40.2235 43.8012L40.2295 45.6391L38.0763 44.3686L38.0678 41.8422L40.2213 43.1127ZM40.2291 39.9172V42.4632L38.1969 41.2826L38.0641 41.2043V38.6598L40.2291 39.9172ZM42.936 41.2054L40.771 42.4632V39.9172L42.7159 38.7872L42.936 38.6598V41.2054ZM37.5222 38.345V40.8906L35.3572 39.6331V37.0872L37.5222 38.345ZM45.6429 39.6331L43.4779 40.8906V38.345L45.6429 37.0872V39.6331ZM42.6615 38.1853L42.39 38.3435L40.4998 39.4412L38.3382 38.1853L40.4998 36.9298L42.6615 38.1853ZM39.9546 36.6131L37.7929 37.869L36.3134 37.0092L35.6313 36.6131L37.7929 35.3572L39.9546 36.6131ZM45.3688 36.6131L44.8846 36.8942L43.2067 37.869L41.0451 36.6131L43.2067 35.3572L45.3688 36.6131Z" fill="#111111"/>
          </svg>
          {/* Description */}
          <p className="flex-1 text-sm leading-[1.5] tracking-[0.1172px] text-black dark:text-[#d2d2d2]">
            Leave your email to get instant notifications on new asset listings and exclusive updates.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 w-full">
          {/* Email Input */}
          <div className="relative mb-2">
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
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Join Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-lg py-[10px] text-[13px] font-medium tracking-[-0.0762px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Join'}
            </button>

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 border border-[#18181b] dark:border-white text-[#18181b] dark:text-white bg-transparent rounded-lg py-[10px] text-[13px] font-medium tracking-[-0.0762px] hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
