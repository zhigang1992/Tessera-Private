import { useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'

/**
 * Info icon tooltip that works on both desktop (hover) and mobile (tap).
 *
 * Desktop: standard hover open/close via onMouseEnter/onMouseLeave.
 * Mobile:  tap to toggle, tap outside to dismiss.
 *
 * A `isTouch` ref tracks whether the current interaction originated from
 * a touch event so that the simulated mouse events fired by mobile browsers
 * after a tap don't conflict with the touch handling.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const isTouchRef = useRef(false)

  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      <Tooltip.Root open={open}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center touch-manipulation p-1 -m-1"
            onTouchStart={() => {
              isTouchRef.current = true
            }}
            onClick={(e) => {
              if (!isTouchRef.current) return
              e.stopPropagation()
              setOpen((prev) => !prev)
            }}
            onMouseEnter={() => {
              if (!isTouchRef.current) setOpen(true)
            }}
            onMouseLeave={() => {
              if (!isTouchRef.current) setOpen(false)
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
