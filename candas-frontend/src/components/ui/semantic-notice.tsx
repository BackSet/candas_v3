import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/components/icons'

const noticeVariants = cva('rounded-lg border p-3', {
  variants: {
    variant: {
      warning:
        'border-warning/40 bg-warning/15 text-warning-foreground [&_.semantic-notice-icon]:text-warning',
      error:
        'border-error/40 bg-error/10 text-foreground [&_.semantic-notice-icon]:text-error',
      info: 'border-info/40 bg-info/10 text-foreground [&_.semantic-notice-icon]:text-info',
      success:
        'border-success/40 bg-success/10 text-foreground [&_.semantic-notice-icon]:text-success',
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
