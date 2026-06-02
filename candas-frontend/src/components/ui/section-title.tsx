import { cn } from '@/lib/utils'
import * as React from 'react'

export interface SectionTitleProps {
  title: string
  variant?: 'form' | 'detail'
  icon?: React.ReactNode
  /** Leyenda explicativa que aparece bajo el título. */
  description?: React.ReactNode
  /** Acciones rápidas alineadas a la derecha del título. */
  actions?: React.ReactNode
  className?: string
  as?: 'h2' | 'h3'
}

export function SectionTitle({
  title,
  variant = 'form',
  icon,
  description,
  actions,
  className,
  as: Component = 'h2',
}: SectionTitleProps) {
  // Variante detalle: cabecera compacta en mayúsculas (sin descripción/acciones por defecto)
  if (variant === 'detail') {
    return (
      <Component
        className={cn(
          'text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2',
          className
        )}
      >
        {icon}
        {title}
      </Component>
    )
  }

  // Variante form: título + descripción opcional + acciones, con separador inferior
  const hasExtras = !!description || !!actions
  if (!hasExtras) {
    // Compatibilidad: mismo markup que antes cuando no hay extras
    return (
      <Component className={cn('text-lg font-medium border-b border-border pb-2 flex items-center gap-2', className)}>
        {icon}
        {title}
      </Component>
    )
  }

  return (
    <div className={cn('border-b border-border pb-2', className)}>
      <div className="flex items-start justify-between gap-3">
        <Component className="text-lg font-medium flex items-center gap-2">
          {icon}
          {title}
        </Component>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
