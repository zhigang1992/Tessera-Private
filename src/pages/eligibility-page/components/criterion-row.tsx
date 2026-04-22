import { CheckCircle2, HelpCircle, Loader2, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CheckStatus } from '../hooks/use-eligibility-checks'

type Props = {
  title: string
  description: string
  status: CheckStatus
  additionalInfo?: ReactNode
  action?: ReactNode
}

export function CriterionRow({ title, description, status, additionalInfo, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[10px] border border-[rgba(17,17,17,0.1)] dark:border-[rgba(210,210,210,0.1)] bg-[#fafafa] dark:bg-[#1a1a1b] p-5">
      <div className="flex gap-4 items-start flex-1">
        <div className="shrink-0 mt-1">
          <StatusIcon status={status} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h5 className="font-semibold text-[15px] text-black dark:text-[#d2d2d2]">{title}</h5>
          <p className="text-[14px] text-[#666] dark:text-[#999]">{description}</p>
          {additionalInfo ? (
            <div className="text-[14px] text-[#666] dark:text-[#999]">{additionalInfo}</div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  const common = 'size-6'
  switch (status) {
    case 'checking':
      return <Loader2 className={`${common} animate-spin text-[#999]`} />
    case 'pass':
      return <CheckCircle2 className={`${common} text-[#06a800]`} />
    case 'fail':
      return <XCircle className={`${common} text-[#d4183d]`} />
    case 'error':
      return <XCircle className={`${common} text-[#d4183d]`} />
    case 'idle':
    default:
      return <HelpCircle className={`${common} text-[#999]`} />
  }
}
