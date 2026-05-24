import type { ModuleId } from './module-icons'
import { MODULE_ICONS } from './module-icons'
import { AppIcon } from './AppIcon'
import { cn } from '@/lib/utils'

export interface ModulePageIconProps {
  module: ModuleId
  /** `header`: cabecera de lista/página; `empty`: estado vacío; `tile`: tarjeta/hub */
  variant?: 'header' | 'empty' | 'tile'
  className?: string
}

export function ModulePageIcon({ module, variant = 'header', className }: ModulePageIconProps) {
  const { icon } = MODULE_ICONS[module]

  if (variant === 'empty') {
    return (
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-xl bg-muted/30',
          className
        )}
        aria-hidden
      >
        <AppIcon icon={icon} size="xl" className="text-muted-foreground/45" />
      </div>
    )
  }

  if (variant === 'tile') {
    return (
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
          className
        )}
        aria-hidden
      >
        <AppIcon icon={icon} size="md" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
        className
      )}
      aria-hidden
    >
      <AppIcon icon={icon} size="sm" />
    </div>
  )
}
