import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle,RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

export function ErrorState({
  title = 'Ocurrió un error',
  description,
  icon,
  action,
  onRetry,
  retryLabel = 'Reintentar',
  className,
}: {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  /** Si se provee, muestra botón de reintento (útil con `refetch` de React Query). */
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-error/30 bg-error/5 p-10 text-center animate-in fade-in zoom-in-95 duration-300',
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-error/10 ring-1 ring-error/20 flex items-center justify-center text-error [&_svg]:h-6 [&_svg]:w-6">
        {icon ?? <AlertTriangle className="h-6 w-6" />}
      </div>
      <div className="mt-4 text-sm font-semibold text-foreground">{title}</div>
      {description ? <div className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
      {!action && onRetry ? (
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5" />
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

