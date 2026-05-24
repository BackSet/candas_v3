import type { ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/5 p-8 text-center',
        className
      )}
    >
      <div className="h-11 w-11 rounded-full bg-error/10 flex items-center justify-center text-error">
        {icon ?? <AlertTriangle className="h-5 w-5" />}
      </div>
      <div className="mt-3 text-sm font-medium text-foreground">{title}</div>
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

