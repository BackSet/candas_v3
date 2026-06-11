import { AppIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { cva,type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const noticeVariants = cva('rounded-lg border p-3', {
  variants: {
    variant: {
      warning:
        'border-warning-border bg-warning-surface text-warning-content [&_.semantic-notice-icon]:text-warning-content',
      error:
        'border-error-border bg-error-surface text-error-content [&_.semantic-notice-icon]:text-error-content',
      info:
        'border-info-border bg-info-surface text-info-content [&_.semantic-notice-icon]:text-info-content',
      success:
        'border-success-border bg-success-surface text-success-content [&_.semantic-notice-icon]:text-success-content',
      muted: 'border-border bg-muted/50 text-foreground [&_.semantic-notice-icon]:text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'warning',
  },
})

export interface SemanticNoticeProps extends VariantProps<typeof noticeVariants> {
  icon: LucideIcon
  title: string
  children?: ReactNode
  className?: string
}

/**
 * Aviso inline con contraste correcto en claro y oscuro (usa tokens semánticos, no paleta amber-*).
 */
export function SemanticNotice({ icon, title, children, variant = 'warning', className }: SemanticNoticeProps) {
  return (
    <div role="alert" className={cn(noticeVariants({ variant }), className)}>
      <div className="flex items-start gap-2.5">
        <AppIcon icon={icon} size="sm" className="semantic-notice-icon mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
          {children ? <div className="text-sm leading-relaxed opacity-90">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}
