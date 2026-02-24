import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'

/**
 * Mobile-friendly info icon tooltip.
 *
 * Radix Tooltip fires `onOpenChange(false)` when the pointer leaves the
 * trigger, which on touch devices happens immediately when the finger lifts.
 * This component takes full control of the `open` state — Radix cannot
 * close it — so tap-to-toggle works reliably on both mobile and desktop.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      <Tooltip.Root open={open}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center touch-manipulation p-1 -m-1"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((prev) => !prev)
            }}
          >
            <Info className="w-3 h-3 text-[#71717a] cursor-help" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-[280px] px-3 py-2 bg-black text-white text-xs leading-[1.4] rounded-lg z-50 shadow-lg"
            sideOffset={4}
            side="bottom"
            collisionPadding={16}
            onPointerDownOutside={() => setOpen(false)}
            onEscapeKeyDown={() => setOpen(false)}
          >
            {text}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
