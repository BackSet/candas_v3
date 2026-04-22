import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-2">
        <div className="flex gap-3">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-skeleton-${index}`} className="h-3 w-24" />
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-skeleton-${rowIndex}`} className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-3 h-4" />
            <Skeleton className="col-span-3 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

