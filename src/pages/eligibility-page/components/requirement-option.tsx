import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react'

export type OptionStatus = 'met' | 'unmet' | 'pending'

export function RequirementOption({
  label,
  description,
  additionalInfo,
  status,
  extraActionLabel,
  onExtraAction,
  children,
}: {
  label: string
  description?: string
  additionalInfo?: ReactNode
  status: OptionStatus
  extraActionLabel?: string
  onExtraAction?: () => void
  children?: ReactNode
}) {
  const style =
    status === 'met'
      ? {
          Icon: CheckCircle2,
          color: '#06a800',
          container:
            'bg-[#06a80008] dark:bg-[#06a80010] border-[#06a80020] dark:border-[#06a80030]',
        }
      : status === 'unmet'
        ? {
            Icon: XCircle,
            color: '#d4183d',
            container:
              'bg-[#d4183d08] dark:bg-[#d4183d10] border-[#d4183d20] dark:border-[#d4183d30]',
          }
        : {
            Icon: HelpCircle,
            color: '#999',
            container:
              'bg-[#f5f5f5] dark:bg-[#ffffff05] border-[rgba(17,17,17,0.15)] dark:border-[rgba(210,210,210,0.1)]',
          }
  const { Icon, color, container } = style
  return (
    <div className={clsx('flex flex-col rounded-[10px] border transition-all', container)}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Icon className="size-6 shrink-0 mt-1" style={{ color }} />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h4 className="font-semibold text-[16px] text-black dark:text-[#d2d2d2]">{label}</h4>
            {description ? (
              <p className="text-[14px] text-[#666] dark:text-[#999]">{description}</p>
            ) : null}
            {additionalInfo ? (
              <div className="text-[14px] text-[#666] dark:text-[#999]">{additionalInfo}</div>
            ) : null}
          </div>
        </div>
        {extraActionLabel && status === 'unmet' ? (
          <button
            type="button"
            onClick={onExtraAction}
            className="self-start px-4 py-2 rounded-md font-medium text-[14px] bg-[#111] text-white hover:bg-[#333] dark:bg-[#D2FB95] dark:text-black dark:hover:bg-[#AAD36D] transition-colors"
          >
            {extraActionLabel}
          </button>
        ) : null}
      </div>
      {children ? <div className="px-5 pb-5 flex flex-col gap-3">{children}</div> : null}
    </div>
  )
}
