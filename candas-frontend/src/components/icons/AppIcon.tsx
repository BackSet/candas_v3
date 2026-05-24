import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tamaños en px enteros para evitar iconos borrosos (subpíxeles). */
const SIZE_CLASS = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-10',
} as const

export type AppIconSize = keyof typeof SIZE_CLASS

export interface AppIconProps {
  icon: LucideIcon
  size?: AppIconSize
  className?: string
  strokeWidth?: number
}

/**
 * Envoltorio de iconos Lucide con trazo y tamaño consistentes (render nítido).
 */
export function AppIcon({ icon: Icon, size = 'sm', className, strokeWidth }: AppIconProps) {
  const resolvedStroke = strokeWidth ?? (size === 'xs' ? 2 : 1.75)

  return (
    <Icon
      className={cn('shrink-0', SIZE_CLASS[size], className)}
      strokeWidth={resolvedStroke}
      absoluteStrokeWidth
      aria-hidden
    />
  )
}
