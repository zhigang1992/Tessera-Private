import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LockOpen } from 'lucide-react'
import { getClaimInfo } from '@/services'

export function ClaimTokensCard() {
  const { data: claimInfo } = useQuery({
    queryKey: ['claimInfo'],
    queryFn: getClaimInfo,
  })

  return (
    <Card className="bg-gradient-to-b from-[#eeffd4] to-[#d2fb95] dark:from-[#1a2c0d] dark:to-[#243a12] p-6">
      <div className="flex flex-col items-center gap-6 h-full justify-between">
        {/* Icon and Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-b from-[#aad36d] to-[#06a800] rounded-full flex items-center justify-center">
            <LockOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Claim Tokens</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You have{' '}
              <span className="font-mono font-semibold text-[#aad36d]">
                {claimInfo?.availableToClaim.toFixed(2) ?? '0.00'} {claimInfo?.tokenSymbol ?? 'TSX'}
              </span>{' '}
              available to claim.
            </p>
          </div>
        </div>

        {/* Claim Button */}
        <div className="w-full flex flex-col gap-4">
          <Button className="w-full h-14 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-lg font-semibold">
            Claim Available
          </Button>

          {/* Next Unlock */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Next unlock in</p>
            <p className="text-sm font-semibold font-mono text-foreground">{claimInfo?.nextUnlockIn ?? '-'}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
