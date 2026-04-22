import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BooleanFilterProps {
  /** Valor actual: undefined = "Todos", true = activos, false = inactivos. */
  value: boolean | undefined
  onChange: (next: boolean | undefined) => void
  /** Etiquetas para cada estado. */
  labelTodos?: string
  labelActivo?: string
  labelInactivo?: string
  className?: string
  ariaLabel?: string
}

/**
 * Filtro tri-estado tipo toggle group: Todos | Activos | Inactivos.
 * Útil para filtrar por flags booleanos como "activo", "activa", etc.
 */
export function BooleanFilter({
  value,
  onChange,
  labelTodos = 'Todos',
  labelActivo = 'Activos',
  labelInactivo = 'Inactivos',
  className,
  ariaLabel,
}: BooleanFilterProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-9 items-center rounded-md border border-border bg-background p-0.5 text-sm',
        className
      )}
    >
      <ToggleButton selected={value === undefined} onClick={() => onChange(undefined)}>
        {labelTodos}
      </ToggleButton>
      <ToggleButton selected={value === true} onClick={() => onChange(true)}>
        <Check className="h-3.5 w-3.5" />
        {labelActivo}
      </ToggleButton>
      <ToggleButton selected={value === false} onClick={() => onChange(false)}>
        <X className="h-3.5 w-3.5" />
        {labelInactivo}
      </ToggleButton>
    </div>
  )
}

interface ToggleButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToggleButton({ selected, onClick, children }: ToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'h-8 gap-1.5 rounded px-2.5 text-xs font-medium',
        selected
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted'
      )}
    >
      {children}
    </Button>
  )
}
