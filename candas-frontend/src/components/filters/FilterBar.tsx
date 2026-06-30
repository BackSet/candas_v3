import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ListFilterChip } from '@/hooks/useListFilters'
import { cn } from '@/lib/utils'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FilterChips } from './FilterChips'

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
  const [isOpen, setIsOpen] = useState(false)
  const isInternalUpdate = useRef(false)

  const activeFiltersCount = chips?.length ?? 0

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
        'w-full px-4 sm:px-6 py-3 border-b border-border/30',
        'bg-background/60 backdrop-blur-md shrink-0',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-2 rounded-lg border border-border/40 bg-card/70 p-2 shadow-sm md:flex-row md:items-center md:flex-wrap',
          filtersClassName
        )}
      >
        {/* Fila Principal: Buscador + Botón Filtros móvil + Trailing móvil */}
        <div className="flex w-full items-center gap-2 min-w-0 md:w-auto md:flex-1">
          {showSearch && onSearchChange && (
            <div className="relative min-w-[120px] flex-1 md:max-w-72 md:min-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 border-border/50 bg-background pl-8 pr-8 text-sm"
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

          {/* Botón Filtros (sólo visible en móvil si hay children) */}
          {children && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'h-9 gap-1.5 md:hidden shrink-0 text-xs font-normal',
                (isOpen || activeFiltersCount > 0) && 'border-primary/40 bg-primary/5 text-foreground'
              )}
              aria-label="Filtros adicionales"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}

          {/* Trailing en móvil (se alinea a la derecha en la fila principal) */}
          {trailing && (
            <div className="ml-auto flex md:hidden shrink-0 items-center gap-2">
              {trailing}
            </div>
          )}
        </div>

        {/* Sección de Filtros Adicionales (Children) */}
        {children && (
          <>
            {/* Escritorio: siempre en línea */}
            <div className="hidden md:flex min-w-0 flex-wrap items-center gap-2">
              {children}
            </div>

            {/* Móvil: panel colapsable */}
            <div
              className={cn(
                'w-full transition-all duration-300 md:hidden overflow-hidden',
                isOpen ? 'block border-t border-border/30 pt-3 mt-1' : 'hidden'
              )}
            >
              <div className="flex flex-col gap-3">
                {children}
              </div>
            </div>
          </>
        )}

        {/* Chips de Filtros Activos */}
        {chips && chips.length > 0 && (
          <>
            {/* Escritorio: en línea con borde izquierdo */}
            <div className="hidden md:flex min-w-0 max-w-full flex-1 items-center gap-2 border-border/40 md:border-l md:pl-2">
              <FilterChips chips={chips} onClearAll={onClearAll} compact />
            </div>

            {/* Móvil: siempre visible debajo del buscador para borrar filtros rápidamente */}
            <div className="flex md:hidden min-w-0 max-w-full items-center gap-2 border-t border-border/20 pt-2 mt-1 w-full">
              <FilterChips chips={chips} onClearAll={onClearAll} compact />
            </div>
          </>
        )}

        {/* Trailing en Escritorio */}
        {trailing && (
          <div className="hidden md:flex ml-auto shrink-0 items-center gap-2">
            {trailing}
          </div>
        )}

        {chips && chips.length > 0 && !onClearAll && (
          <span className="sr-only">{chips.length} filtros activos</span>
        )}
        {chips && chips.length === 0 && (
          <span className="sr-only">Sin filtros activos</span>
        )}
      </div>
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
