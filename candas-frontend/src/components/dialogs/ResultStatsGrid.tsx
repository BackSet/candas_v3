import { cn } from '@/lib/utils'

interface ResultStatsGridProps {
  total: number
  exitosos: number
  fallidos: number
  className?: string
}

export function ResultStatsGrid({ total, exitosos, fallidos, className }: ResultStatsGridProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      <div className="border rounded-lg p-3 text-center bg-muted/20">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</div>
        <div className="text-2xl font-bold">{total}</div>
      </div>
      <div className="border border-success/20 bg-success/5 rounded-lg p-3 text-center">
        <div className="text-xs text-success uppercase tracking-wider mb-1">Exitosos</div>
        <div className="text-2xl font-bold text-success">{exitosos}</div>
      </div>
      <div className="border border-error/20 bg-error/5 rounded-lg p-3 text-center">
        <div className="text-xs text-error uppercase tracking-wider mb-1">Fallidos</div>
        <div className="text-2xl font-bold text-error">{fallidos}</div>
      </div>
    </div>
  )
}
