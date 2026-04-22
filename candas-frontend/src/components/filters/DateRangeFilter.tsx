import { DatePickerForm } from '@/components/ui/date-time-picker'
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

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showDesde && (
        <div className="w-[160px]">
          <DatePickerForm
            value={desde}
            onChange={(v) => onChange({ desde: v, hasta })}
            placeholder="Desde"
            id="filter-fecha-desde"
            aria-label={ariaLabelDesde}
          />
        </div>
      )}
      {showDesde && showHasta && (
        <span className="text-xs text-muted-foreground">→</span>
      )}
      {showHasta && (
        <div className="w-[160px]">
          <DatePickerForm
            value={hasta}
            onChange={(v) => onChange({ desde, hasta: v })}
            placeholder="Hasta"
            id="filter-fecha-hasta"
            aria-label={ariaLabelHasta}
          />
        </div>
      )}
    </div>
  )
}
