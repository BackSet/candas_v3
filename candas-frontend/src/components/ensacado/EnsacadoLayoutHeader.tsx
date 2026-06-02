import { AppIcon,ModulePageIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { ArrowLeft,ScanBarcode } from 'lucide-react'
import type { ReactNode } from 'react'

interface EnsacadoLayoutHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backTo?: string
  trailing?: ReactNode
  showScanIcon?: boolean
  className?: string
}

export function EnsacadoLayoutHeader({
  title,
  subtitle,
  onBack,
  backTo = '/dashboard',
  trailing,
  showScanIcon = false,
  className,
}: EnsacadoLayoutHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 border-b border-border/30 bg-background/80 backdrop-blur-xl',
        className
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="-ml-2 text-muted-foreground hover:text-foreground"
            title="Volver"
          >
            <ArrowLeft className="size-5" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
          </Button>
        ) : (
          <Link
            to={backTo}
            className="text-muted-foreground transition-colors hover:text-foreground"
            title="Volver"
          >
            <ArrowLeft className="size-5" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
          </Link>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {showScanIcon ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <AppIcon icon={ScanBarcode} size="sm" />
            </div>
          ) : (
            <ModulePageIcon module="ensacado" />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  )
}
