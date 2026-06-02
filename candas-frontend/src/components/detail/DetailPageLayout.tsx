import { DetailHeader } from '@/components/detail/DetailHeader'
import type { StatusVariant } from '@/components/detail/StatusBadge'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type MaxWidth = 'md' | 'lg' | 'xl' | '2xl' | 'full'

const maxWidthClass: Record<MaxWidth, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-none',
}

export function DetailPageLayout({
  title,
  subtitle,
  backUrl,
  onBack,
  status,
  actions,
  maxWidth = 'xl',
  children,
  className,
  headerContainerClassName,
  contentClassName,
}: {
  title: string
  subtitle?: string
  backUrl: string
  onBack?: () => void
  status?: { label: string; variant: StatusVariant }
  actions?: ReactNode
  maxWidth?: MaxWidth
  children: ReactNode
  className?: string
  headerContainerClassName?: string
  contentClassName?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-1 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20',
        className
      )}
    >
      <div
        className={cn(
          'px-4 sm:px-6 py-4 border-b border-border/40 bg-background/95 backdrop-blur z-10 shrink-0',
          headerContainerClassName
        )}
      >
        <DetailHeader
          title={title}
          subtitle={subtitle}
          backUrl={backUrl}
          onBack={onBack}
          status={status}
          actions={actions}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className={cn('w-full mx-auto space-y-6 stagger-children', maxWidthClass[maxWidth], contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  )
}

