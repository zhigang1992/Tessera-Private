import { CheckCircle2, Loader2, MinusCircle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CheckStatus } from '../hooks/use-eligibility-checks'

type Props = {
  title: string
  description: string
  status: CheckStatus
  detail?: ReactNode
  action?: ReactNode
}

export function CriterionRow({ title, description, status, detail, action }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#e4e4e7] dark:border-[#393b3d] bg-white dark:bg-[#1e1f20] px-4 py-3">
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-black dark:text-[#d2d2d2]">{title}</div>
        <div className="text-xs text-[#71717a] dark:text-[#999] leading-snug mt-0.5">{description}</div>
        {detail ? <div className="text-xs mt-1.5">{detail}</div> : null}
        {action ? <div className="mt-2.5">{action}</div> : null}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  const common = 'w-5 h-5 shrink-0 mt-0.5'
  switch (status) {
    case 'checking':
      return <Loader2 className={`${common} animate-spin text-[#71717a]`} />
    case 'pass':
      return <CheckCircle2 className={`${common} text-green-600`} />
    case 'fail':
      return <XCircle className={`${common} text-red-600`} />
    case 'error':
      return <XCircle className={`${common} text-amber-600`} />
    case 'idle':
    default:
      return <MinusCircle className={`${common} text-[#c7c7c7] dark:text-[#555]`} />
  }
}
