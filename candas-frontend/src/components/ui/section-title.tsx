import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionTitleProps {
  title: string
  variant?: 'form' | 'detail'
  icon?: React.ReactNode
  className?: string
  as?: 'h2' | 'h3'
}

export function SectionTitle({
  title,
  variant = 'form',
  icon,
  className,
  as: Component = 'h2',
}: SectionTitleProps) {
  return (
    <Component
      className={cn(
        variant === 'form' && 'text-lg font-medium border-b border-border pb-2',
        variant === 'detail' &&
          'text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2',
        className
      )}
    >
      {icon}
      {title}
    </Component>
  )
}
