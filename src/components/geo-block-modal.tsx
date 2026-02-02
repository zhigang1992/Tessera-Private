import { useEffect, useState } from 'react'
import { isBlockedCountry } from '@/lib/geo-blocking'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * GeoBlockModal - Undismissable modal that blocks access for restricted jurisdictions
 *
 * This component:
 * - Checks user's location on mount using Cloudflare headers
 * - Shows an undismissable modal if user is from a blocked country
 * - Prevents closing via ESC key, overlay click, or close button
 */
export function GeoBlockModal() {
  const [isBlocked, setIsBlocked] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkGeoLocation() {
      try {
        const result = await isBlockedCountry()
        setIsBlocked(result.blocked)
      } catch (error) {
        console.error('Failed to perform geo-blocking check:', error)
        // Fail open - don't block if check fails
        setIsBlocked(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkGeoLocation()
  }, [])

  // Don't render anything while checking
  if (isChecking) {
    return null
  }

  // Don't render if not blocked
  if (!isBlocked) {
    return null
  }

  return (
    <DialogPrimitive.Root open={isBlocked} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-md',
          )}
          // Prevent closing via ESC key or overlay click
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* No close button - modal is undismissable */}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <DialogPrimitive.Title className="text-lg leading-none font-semibold text-center">
              Access Restricted
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground text-sm text-center space-y-4 pt-4">
              <p className="text-base">
                We're sorry, but Tessera is not available in your location.
              </p>
              <p className="text-sm text-muted-foreground">
                Due to regulatory requirements, we cannot provide services to users located in certain jurisdictions
                including the United States, China, and other restricted territories as outlined in our Terms of
                Service.
              </p>
              <p className="text-sm text-muted-foreground">
                For the complete list of restricted jurisdictions and more information, please review our{' '}
                <a
                  href="https://terms.tessera.pe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Terms of Service
                </a>
                .
              </p>
            </DialogPrimitive.Description>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
