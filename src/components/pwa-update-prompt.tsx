import { useEffect } from 'react'
import { toast } from 'sonner'

type UpdateSW = (reloadPage?: boolean) => Promise<void>

interface PwaNeedRefreshEvent extends CustomEvent<{ updateSW: UpdateSW }> {}

declare global {
  interface WindowEventMap {
    'pwa:need-refresh': PwaNeedRefreshEvent
  }
}

export function PwaUpdatePrompt() {
  useEffect(() => {
    const handler = (event: PwaNeedRefreshEvent) => {
      const { updateSW } = event.detail
      toast('A new version is available', {
        duration: Infinity,
        action: {
          label: 'Reload',
          onClick: () => {
            void updateSW(true)
          },
        },
      })
    }
    window.addEventListener('pwa:need-refresh', handler)
    return () => window.removeEventListener('pwa:need-refresh', handler)
  }, [])
  return null
}
