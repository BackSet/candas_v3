import { type ReactNode, useEffect, useState } from 'react'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ListToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  /** Panel colapsable de filtros avanzados (campos por criterio + Buscar/Limpiar) */
  advancedFilters?: ReactNode
  /** Muestra borde inferior bajo el toolbar (default true) */
  withBottomBorder?: boolean
  actions?: ReactNode
  className?: string
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  advancedFilters,
  withBottomBorder = true,
  actions,
  className,
}: ListToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search ?? '')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (search === undefined) return
    setLocalSearch(search)
  }, [search])

  const handleClearSearch = () => {
    setLocalSearch('')
    onSearchChange?.('')
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        withBottomBorder && 'border-b',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {onSearchChange && (
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => {
                const value = e.target.value
                setLocalSearch(value)
                onSearchChange?.(value)
              }}
              className="pl-9 pr-8 h-9"
            />
            {localSearch && (
              <Button
                type="button"
                aria-label="Cerrar búsqueda"
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {filters && (
            <div className="flex items-center gap-2">
              {filters}
            </div>
          )}
          {advancedFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setAdvancedOpen((o) => !o)}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filtros avanzados
              {advancedOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
            </Button>
          )}
          {actions}
        </div>
      </div>
      {advancedFilters && advancedOpen && (
        <div className="pt-2 border-t flex flex-col gap-3">
          {advancedFilters}
        </div>
      )}
    </div>
  )
}
