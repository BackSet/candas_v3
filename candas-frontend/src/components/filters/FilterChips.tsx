import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ListFilterChip } from '@/hooks/useListFilters'

export interface FilterChipsProps {
  chips: ListFilterChip[]
  onClearAll?: () => void
  className?: string
}

/**
 * Render visual de los filtros activos. Cada chip permite quitar ese filtro
 * individual y opcionalmente muestra "Limpiar todo".
 */
export function FilterChips({ chips, onClearAll, className }: FilterChipsProps) {
  if (chips.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-border bg-muted/40',
            'px-2.5 py-1 text-xs font-medium text-foreground/90',
            'transition-colors hover:bg-muted hover:text-foreground'
          )}
        >
          <span>{chip.label}</span>
          <X className="h-3 w-3 opacity-60" aria-hidden />
          <span className="sr-only">Quitar filtro {chip.label}</span>
        </button>
      ))}
      {onClearAll && chips.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpiar todo
        </Button>
      )}
    </div>
  )
}
