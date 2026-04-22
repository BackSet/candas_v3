import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FilterChips } from './FilterChips'
import type { ListFilterChip } from '@/hooks/useListFilters'

export interface FilterBarProps {
  /** Valor actual del campo de búsqueda. */
  searchValue?: string
  /** Setea el valor de búsqueda (debounceado por defecto a 300ms). */
  onSearchChange?: (value: string) => void
  /** Placeholder del input de búsqueda. */
  searchPlaceholder?: string
  /** ms de debounce para `onSearchChange`. Default 300. 0 desactiva debounce. */
  searchDebounceMs?: number
  /** Si false, no se muestra el campo de búsqueda. */
  showSearch?: boolean

  /** Filtros adicionales (selects, date range, etc.). */
  children?: ReactNode

  /** Acciones a la derecha (export, columnas, etc.). */
  trailing?: ReactNode

  /** Chips de filtros activos. */
  chips?: ListFilterChip[]
  /** Handler de "Limpiar todo". */
  onClearAll?: () => void

  className?: string
  /** Clase adicional para el wrapper de filtros. */
  filtersClassName?: string
}

/**
 * Barra unificada de filtros para listas. Ubicada justo debajo del header de la página.
 * Combina: búsqueda con debounce + filtros (selects, fechas, toggles) + acciones + chips activos.
 */
export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchDebounceMs = 300,
  showSearch = true,
  children,
  trailing,
  chips,
  onClearAll,
  className,
  filtersClassName,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue)
  const isInternalUpdate = useRef(false)

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    setLocalSearch(searchValue)
  }, [searchValue])

  useEffect(() => {
    if (!onSearchChange) return
    if (localSearch === searchValue) return
    if (searchDebounceMs <= 0) {
      isInternalUpdate.current = true
      onSearchChange(localSearch)
      return
    }
    const id = window.setTimeout(() => {
      isInternalUpdate.current = true
      onSearchChange(localSearch)
    }, searchDebounceMs)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, searchDebounceMs])

  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-4 sm:px-6 py-3 border-b border-border/30',
        'bg-background/60 backdrop-blur-md shrink-0',
        className
      )}
    >
      <div className={cn('flex flex-wrap items-center gap-2', filtersClassName)}>
        {showSearch && onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8 pr-8 text-sm"
              aria-label="Buscar"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">{children}</div>
        {trailing && <div className="flex items-center gap-2 ml-auto">{trailing}</div>}
      </div>

      {chips && chips.length > 0 && (
        <div className="flex items-center gap-2">
          <FilterChips chips={chips} onClearAll={onClearAll} />
        </div>
      )}
    </div>
  )
}

/**
 * Wrapper conveniente para envolver un bloque de filtros con un botón "Limpiar".
 * Útil cuando el componente padre no expone `chips`.
 */
export function FilterBarClearButton({
  onClick,
  className,
  children = 'Limpiar filtros',
}: {
  onClick: () => void
  className?: string
  children?: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('h-9 gap-1 text-xs text-muted-foreground hover:text-foreground', className)}
    >
      <X className="h-3.5 w-3.5" />
      {children}
    </Button>
  )
}
