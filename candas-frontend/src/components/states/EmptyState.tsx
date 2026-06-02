import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  title = 'Sin resultados',
  description,
  icon,
  action,
  className,
}: {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/5 p-10 text-center animate-in fade-in zoom-in-95 duration-300',
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-muted/50 ring-1 ring-border/40 flex items-center justify-center text-muted-foreground/70 [&_svg]:h-6 [&_svg]:w-6">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div className="mt-4 text-sm font-semibold text-foreground">{title}</div>
      {description ? <div className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

