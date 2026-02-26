import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { ReactNode } from 'react'
import { StatusBadge, StatusVariant } from './StatusBadge'

interface DetailHeaderProps {
  title: string
  subtitle?: string
  backUrl: string
  status?: {
    label: string
    variant: StatusVariant
  }
  actions?: ReactNode
  className?: string
}

export function DetailHeader({
  title,
  subtitle,
  backUrl,
  status,
  actions,
  className,
}: DetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backUrl)}
            className="shrink-0"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {status && <StatusBadge label={status.label} variant={status.variant} />}
            </div>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-lg">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
