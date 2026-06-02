import { Button } from '@/components/ui/button'
import type { ListFilterChip } from '@/hooks/useListFilters'
import { cn } from '@/lib/utils'
import { SlidersHorizontal, X } from 'lucide-react'

export interface FilterChipsProps {
  chips: ListFilterChip[]
  onClearAll?: () => void
  className?: string
  compact?: boolean
}

/**
 * Render visual de los filtros activos. Cada chip permite quitar ese filtro
 * individual y opcionalmente muestra "Limpiar todo".
 */
export function FilterChips({ chips, onClearAll, className, compact = false }: FilterChipsProps) {
  if (chips.length === 0) return null
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        compact ? 'max-w-full overflow-x-auto py-0.5' : 'flex-wrap',
        className
      )}
      aria-label="Filtros activos"
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Filtros</span>
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className={cn(
            'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-background',
            'px-2.5 text-xs font-medium text-foreground/90 shadow-sm',
            'transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
          title={`Quitar filtro ${chip.label}`}
        >
          <span className="max-w-[180px] truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          <span className="sr-only">Quitar filtro {chip.label}</span>
        </button>
      ))}
      {onClearAll && chips.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpiar todo
        </Button>
      )}
    </div>
  )
}
