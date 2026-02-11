import { useEffect } from 'react'

/**
 * Hook to ensure body scroll is restored when component unmounts.
 * This fixes an issue where modals sometimes leave the body in an unscrollable state.
 *
 * Usage: Call this hook in modal components that use Dialog/DialogContent.
 */
export function useScrollLockFix(isOpen: boolean) {
  useEffect(() => {
    // Cleanup function that runs when the modal closes or component unmounts
    return () => {
      // Small delay to allow Radix's cleanup to run first
      const timeoutId = setTimeout(() => {
        // Force remove any scroll lock styles that might have been left behind
        document.body.style.removeProperty('overflow')
        document.body.style.removeProperty('padding-right')
        document.body.style.removeProperty('pointer-events')

        // Also remove any data attributes that might be set
        document.body.removeAttribute('data-scroll-locked')
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen])
}
