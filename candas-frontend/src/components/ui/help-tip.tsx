import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface HelpTipProps {
  /** Texto explicativo (la "leyenda") que aparece al pasar el cursor o enfocar. */
  children: ReactNode
  /** Lado preferido del tooltip. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  /** Etiqueta accesible (por defecto "Ayuda"). */
  label?: string
}

/**
 * Icono de ayuda (?) que muestra una leyenda explicativa al pasar el cursor
 * o al enfocarlo con teclado. Pensado para acompañar campos/acciones cuyo
 * propósito no es evidente.
 */
export function HelpTip({ children, side = 'top', className, label = 'Ayuda' }: HelpTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            className
          )}
          onClick={(e) => e.preventDefault()}
        >
          <HelpCircle className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{children}</TooltipContent>
    </Tooltip>
  )
}
