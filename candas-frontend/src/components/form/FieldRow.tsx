import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FieldRowProps {
  /** Etiqueta visible del campo. */
  label?: ReactNode
  /** Texto de ayuda secundario debajo del control. */
  hint?: ReactNode
  /** Mensaje de error inline (acepta string o `FieldError`). */
  error?: { message?: string } | string | null | undefined | false
  /** Marca el campo como requerido (asterisco rojo). */
  required?: boolean
  /** ID del control asociado (para `htmlFor`). */
  htmlFor?: string
  /** Cuántas columnas de la grilla padre ocupa (1, 2, "full"). */
  span?: 1 | 2 | 3 | 4 | 'full'
  /** Acción opcional al lado del label (ej. "Generar"). */
  action?: ReactNode
  /** Control. */
  children: ReactNode
  className?: string
}

const SPAN_CLASS: Record<NonNullable<FieldRowProps['span']>, string> = {
  1: '',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  full: 'md:col-span-full',
}

function resolveErrorMessage(error: FieldRowProps['error']): string | undefined {
  if (!error) return undefined
  if (typeof error === 'string') return error
  return error.message
}

export function FieldRow({
  label,
  hint,
  error,
  required,
  htmlFor,
  span = 1,
  action,
  children,
  className,
}: FieldRowProps) {
  const message = resolveErrorMessage(error)
  return (
    <div className={cn('space-y-1.5 min-w-0', SPAN_CLASS[span], className)}>
      {(label || action) && (
        <div className="flex items-baseline justify-between gap-2">
          {label ? (
            <Label
              htmlFor={htmlFor}
              className="text-xs font-medium text-foreground/90"
            >
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
      {message ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span aria-hidden>⚠</span>
          <span>{message}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
