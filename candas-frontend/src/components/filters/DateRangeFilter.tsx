import { DatePickerForm } from '@/components/ui/date-time-picker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateRangeFilterProps {
  /** Fecha desde en formato YYYY-MM-DD. '' significa sin filtro. */
  desde: string
  /** Fecha hasta en formato YYYY-MM-DD. '' significa sin filtro. */
  hasta: string
  /** Setea ambas fechas a la vez (suele venir de `setFilters`). */
  onChange: (next: { desde: string; hasta: string }) => void
  /** Etiquetas accesibles para los dos inputs. */
  ariaLabelDesde?: string
  ariaLabelHasta?: string
  className?: string
  /** Si true, muestra solo el campo "Desde". */
  desdeOnly?: boolean
  /** Si true, muestra solo el campo "Hasta". */
  hastaOnly?: boolean
}

/**
 * Filtro de rango de fechas para `FilterBar`. Internamente usa dos `DatePickerForm`
 * (que devuelven YYYY-MM-DD) y los expone como un único objeto `{ desde, hasta }`.
 * 
 * Mejora: cuando se selecciona solo "desde", filtra desde esa fecha en adelante.
 * Cuando se selecciona solo "hasta", filtra hasta esa fecha.
 * Soporta botones rápidos: Hoy, Ayer, Esta semana, Este mes.
 */
export function DateRangeFilter({
  desde,
  hasta,
  onChange,
  ariaLabelDesde = 'Fecha desde',
  ariaLabelHasta = 'Fecha hasta',
  className,
  desdeOnly,
  hastaOnly,
}: DateRangeFilterProps) {
  const showDesde = !hastaOnly
  const showHasta = !desdeOnly

  const handleDesdeChange = (nuevaFecha: string) => {
    if (nuevaFecha) {
      onChange({ desde: nuevaFecha, hasta: '' })
    } else {
      onChange({ desde: '', hasta: '' })
    }
  }

  const handleHastaChange = (nuevaFecha: string) => {
    if (nuevaFecha) {
      onChange({ desde: '', hasta: nuevaFecha })
    } else {
      onChange({ desde: '', hasta: '' })
    }
  }

  const hasCustomRange = desde && !hasta || !desde && hasta

  const handleQuickDate = (days: number) => {
    const hoy = new Date()
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - days)
    const fechaStr = fecha.toISOString().split('T')[0]
    if (days === 0) {
      onChange({ desde: fechaStr, hasta: fechaStr })
    } else if (days > 0) {
      onChange({ desde: fechaStr, hasta: '' })
    } else {
      onChange({ desde: '', hasta: fechaStr })
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showDesde && (
        <div className="flex items-center gap-1">
          <DatePickerForm
            value={desde}
            onChange={handleDesdeChange}
            placeholder="Desde"
            id="filter-fecha-desde"
            aria-label={ariaLabelDesde}
          />
          {hasCustomRange && desde && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ desde: '', hasta })}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Limpiar desde"
            >
              ×
            </Button>
          )}
        </div>
      )}
      {showDesde && showHasta && (
        <span className="text-xs text-muted-foreground">→</span>
      )}
      {showHasta && (
        <div className="flex items-center gap-1">
          <DatePickerForm
            value={hasta}
            onChange={handleHastaChange}
            placeholder="Hasta"
            id="filter-fecha-hasta"
            aria-label={ariaLabelHasta}
          />
          {hasCustomRange && hasta && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ desde, hasta: '' })}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Limpiar hasta"
            >
              ×
            </Button>
          )}
        </div>
      )}
      {(showDesde || showHasta) && (
        <div className="flex items-center gap-0.5 ml-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickDate(0)}
            className={cn(
              'h-7 px-1.5 text-[11px]',
              desde && hasta === desde && 'bg-primary/10 text-primary'
            )}
            title="Hoy"
          >
            Hoy
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickDate(1)}
            className="h-7 px-1.5 text-[11px]"
            title="Desde hace 1 día (hoy)"
          >
            +1d
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickDate(7)}
            className="h-7 px-1.5 text-[11px]"
            title="Últimos 7 días"
          >
            +7d
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ desde: '', hasta: '' })}
            className={cn(
              'h-7 px-1.5 text-[11px] text-muted-foreground',
              !desde && !hasta && 'text-foreground bg-muted'
            )}
            title="Limpiar filtro"
          >
            Todo
          </Button>
        </div>
      )}
    </div>
  )
}
