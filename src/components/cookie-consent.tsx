import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'tessera_cookie_consent'

interface CookieConsentState {
  accepted?: boolean
  dismissed?: boolean
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const storedConsent = localStorage.getItem(STORAGE_KEY)
    if (!storedConsent) {
      // Show dialog after a small delay for smooth animation
      setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(true)
      }, 500)
    }
  }, [])

  const handleAccept = () => {
    const consent: CookieConsentState = { accepted: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    closeDialog()
  }

  const handleReject = () => {
    const consent: CookieConsentState = { accepted: false }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    closeDialog()
  }

  const handleDismiss = () => {
    const consent: CookieConsentState = { dismissed: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    closeDialog()
  }

  const closeDialog = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
    }, 300) // Match animation duration
  }

  if (!isVisible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className={cn(
        'fixed bottom-4 right-4 max-w-[500px] w-[calc(100vw-2rem)] md:w-auto z-50 transition-all duration-300',
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className="bg-white dark:bg-[#1c1c1e] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Close cookie consent dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="pr-8">
          <p
            id="cookie-consent-title"
            className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed mb-4"
          >
            This site uses cookies to deliver its service and to analyze traffic. By browsing this site, you accept the{' '}
            <a
              href="https://terms.tessera.pe/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-500 hover:underline font-medium"
            >
              privacy policy
            </a>
            .
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-full px-6"
              size="default"
            >
              Accept
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="font-medium rounded-full px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              size="default"
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
