import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SelectionActionBarProps {
  /** Número de elementos seleccionados. Si es 0, la barra no se muestra. */
  count: number
  /** Limpia la selección. */
  onClear: () => void
  /** Botones de acción masiva (a la derecha). */
  children?: ReactNode
  /** Etiqueta singular/plural del elemento (ej. "despacho"). */
  itemLabel?: string
  className?: string
}

/**
 * Barra flotante de acciones masivas. Aparece anclada en la parte inferior
 * central cuando hay elementos seleccionados en una tabla/lista, manteniendo
 * las acciones cerca del contenido y visibles sin desplazarse al header.
 */
export function SelectionActionBar({
  count,
  onClear,
  children,
  itemLabel = 'elemento',
  className,
}: SelectionActionBarProps) {
  if (count <= 0 || typeof document === 'undefined') return null

  const plural = count === 1 ? itemLabel : `${itemLabel}s`

  // Se renderiza en un portal a <body> para que `position: fixed` quede
  // siempre anclado al viewport, sin verse afectado por ancestros con
  // transform/filter/backdrop-filter (que crean un containing block y harían
  // que la barra aparezca al final del contenido en vez de fija en pantalla).
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 sm:bottom-5 z-50 flex justify-center px-3 sm:px-4">
      <div
        className={cn(
          'pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar rounded-full border border-border/60 bg-popover/95 px-3 py-2 shadow-lg backdrop-blur-xl',
          'animate-in fade-in slide-in-from-bottom-4 duration-200',
          className
        )}
        role="region"
        aria-label="Acciones de selección"
      >
        <div className="flex shrink-0 items-center gap-2 pl-1">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold tabular-nums text-primary-foreground">
            {count}
          </span>
          <span className="whitespace-nowrap text-sm font-medium text-foreground">
            {plural} seleccionado{count === 1 ? '' : 's'}
          </span>
        </div>

        <div className="h-5 w-px shrink-0 bg-border/60" />

        <div className="flex shrink-0 items-center gap-1.5">{children}</div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 shrink-0 gap-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Deseleccionar</span>
        </Button>
      </div>
    </div>,
    document.body
  )
}
