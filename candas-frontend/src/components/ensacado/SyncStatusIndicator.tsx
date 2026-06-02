import { useSessionEnsacado } from '@/hooks/useEnsacado'
import { cn } from '@/lib/utils'
import { formatearFechaRelativa } from '@/utils/fechas'
import { Loader2,Radio,WifiOff } from 'lucide-react'

interface SyncStatusIndicatorProps {
  className?: string
}

export function SyncStatusIndicator({ className }: SyncStatusIndicatorProps) {
  const { data, isFetching, isError, dataUpdatedAt } = useSessionEnsacado()

  const hasSession = Boolean(data?.lastPaqueteInfo)
  const lastLabel = data?.lastUpdated
    ? formatearFechaRelativa(data.lastUpdated)
    : dataUpdatedAt
      ? formatearFechaRelativa(new Date(dataUpdatedAt).toISOString())
      : null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        isError
          ? 'border-error/30 bg-error/10 text-error'
          : hasSession
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-border/50 bg-muted/40 text-muted-foreground',
        className
      )}
      title="Estado de sincronización con la vista «Ver en curso»"
    >
      {isError ? (
        <WifiOff className="size-3.5 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
      ) : isFetching ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" strokeWidth={1.75} aria-hidden />
      ) : (
        <span className="relative flex size-2 shrink-0">
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full opacity-75',
              hasSession ? 'animate-ping bg-success' : 'bg-muted-foreground/40'
            )}
          />
          <span
            className={cn(
              'relative inline-flex size-2 rounded-full',
              hasSession ? 'bg-success' : 'bg-muted-foreground/50'
            )}
          />
        </span>
      )}
      <span className="hidden sm:inline">
        {isError ? 'Sin sincronizar' : hasSession ? 'Vista móvil activa' : 'Esperando escaneo'}
      </span>
      {lastLabel && !isError ? (
        <span className="hidden text-muted-foreground md:inline">· {lastLabel}</span>
      ) : null}
      <Radio className="size-3 shrink-0 opacity-40 sm:hidden" aria-hidden />
    </div>
  )
}
