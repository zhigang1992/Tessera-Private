import { Card } from '@/components/ui/card'

export function AssetCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-700">
      {/* Header Skeleton */}
      <div className="p-5 pt-5 pb-0 h-[118px] bg-zinc-200 dark:bg-zinc-700 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-16 bg-zinc-300 dark:bg-zinc-600 rounded" />
          <div className="h-6 w-24 bg-zinc-300 dark:bg-zinc-600 rounded" />
          <div className="h-4 w-12 bg-zinc-300 dark:bg-zinc-600 rounded" />
        </div>
      </div>

      {/* Body Skeleton */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-5 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
    </Card>
  )
}
