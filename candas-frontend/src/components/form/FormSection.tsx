import type { ComponentType, ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormSectionProps {
  title: string
  description?: ReactNode
  icon?: ComponentType<LucideProps>
  /** Número de columnas de la grilla interna. */
  cols?: 1 | 2 | 3 | 4
  /** Acciones opcionales en la cabecera. */
  actions?: ReactNode
  /** Contenido (normalmente `<FieldRow>`). */
  children: ReactNode
  className?: string
  /** Si true, no envuelve en card (útil para anidar). */
  bare?: boolean
  /** Si true, oculta la sección entera. */
  hidden?: boolean
}

const COLS_CLASS: Record<NonNullable<FormSectionProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export function FormSection({
  title,
  description,
  icon: Icon,
  cols = 2,
  actions,
  children,
  className,
  bare,
  hidden,
}: FormSectionProps) {
  if (hidden) return null

  const content = (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
            <span>{title}</span>
          </h2>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('grid gap-4', COLS_CLASS[cols])}>{children}</div>
    </>
  )

  if (bare) {
    return <section className={cn('space-y-4', className)}>{content}</section>
  }

  return (
    <section
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4',
        className
      )}
    >
      {content}
    </section>
  )
}
