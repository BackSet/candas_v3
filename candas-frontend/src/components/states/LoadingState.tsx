import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

type LoadingStateVariant = 'page' | 'inline'

export function LoadingState({
  label = 'Cargando...',
  description,
  icon,
  variant = 'page',
  className,
}: {
  label?: string
  description?: string
  icon?: ReactNode
  variant?: LoadingStateVariant
  className?: string
}) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        {icon ?? <Loader2 className="h-4 w-4 animate-spin" />}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/5 p-10 text-center animate-in fade-in duration-200',
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center text-primary">
        {icon ?? <Loader2 className="h-6 w-6 animate-spin" />}
      </div>
      <div className="mt-4 text-sm font-semibold text-foreground">{label}</div>
      {description ? <div className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</div> : null}
    </div>
  )
}

