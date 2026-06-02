import { Button } from '@/components/ui/button'
import { DatePickerForm } from '@/components/ui/date-time-picker'
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuRadioGroup,
DropdownMenuRadioItem,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
DATE_PRESET_LABELS,
DATE_PRESETS,
detectActivePreset,
getDateRangeSummary,
getPresetDates,
inferRangeMode,
validateDateRange,
type DatePreset,
type DateRangeMode,
} from '@/lib/date-range'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { Calendar,Check,ChevronDown } from 'lucide-react'
import { useCallback,useEffect,useState } from 'react'

export interface DateRangeFilterProps {
  desde: string
  hasta: string
  onChange: (next: { desde: string; hasta: string }) => void
  defaultRangeMode?: DateRangeMode
  showModeToggles?: boolean
  compact?: boolean
  ariaLabelDesde?: string
  ariaLabelHasta?: string
  className?: string
  /** @deprecated Usar defaultRangeMode="fromOnly" */
  desdeOnly?: boolean
  /** @deprecated Usar defaultRangeMode="toOnly" */
  hastaOnly?: boolean
}

const COMPACT_PRESETS: DatePreset[] = ['hoy', 'ayer', 'esta-semana', 'este-mes']

const MODE_OPTIONS: { value: DateRangeMode; label: string }[] = [
  { value: 'closed', label: 'Rango (desde y hasta)' },
  { value: 'fromOnly', label: 'Solo desde' },
  { value: 'toOnly', label: 'Solo hasta' },
]

/**
 * Filtro de rango de fechas en una sola fila (h-9), alineado con SelectFilter.
 * Presets y modos van en el menú "Periodo".
 */
export function DateRangeFilter({
  desde,
  hasta,
  onChange,
  defaultRangeMode,
  showModeToggles = true,
  compact = false,
  ariaLabelDesde = 'Fecha desde',
  ariaLabelHasta = 'Fecha hasta',
  className,
  desdeOnly,
  hastaOnly,
}: DateRangeFilterProps) {
  const legacyMode: DateRangeMode | undefined = desdeOnly
    ? 'fromOnly'
    : hastaOnly
      ? 'toOnly'
      : undefined

  const [rangeMode, setRangeMode] = useState<DateRangeMode>(
    () => legacyMode ?? defaultRangeMode ?? inferRangeMode(desde, hasta)
  )

  useEffect(() => {
    if (legacyMode) {
      setRangeMode(legacyMode)
      return
    }
    if (!desde && !hasta) return
    const inferred = inferRangeMode(desde, hasta)
    setRangeMode((prev) => {
      if (prev === 'fromOnly' && !desde && hasta) return 'toOnly'
      if (prev === 'toOnly' && desde && !hasta) return 'fromOnly'
      if (prev === 'closed' || inferred !== 'closed') return inferred
      return prev
    })
  }, [desde, hasta, legacyMode])

  const activePreset = detectActivePreset(desde, hasta)
  const visiblePresets = compact ? COMPACT_PRESETS : DATE_PRESETS
  const pickerWidth = compact ? 'w-[108px]' : 'w-[118px]'
  const hasFilter = Boolean(desde || hasta)
  const periodLabel = getDateRangeSummary(desde, hasta)

  const applyChange = useCallback(
    (nextDesde: string, nextHasta: string, mode: DateRangeMode = rangeMode) => {
      let d = nextDesde
      let h = nextHasta

      if (mode === 'fromOnly') h = ''
      else if (mode === 'toOnly') d = ''

      if (d && h) {
        const validation = validateDateRange(d, h)
        if (!validation.valid && validation.correctedHasta) {
          notify.warning('La fecha hasta no puede ser anterior a la fecha desde.')
          h = validation.correctedHasta
        }
      }

      onChange({ desde: d, hasta: h })
    },
    [onChange, rangeMode]
  )

  const handlePreset = (preset: DatePreset) => {
    setRangeMode('closed')
    onChange(getPresetDates(preset))
  }

  const handleClear = () => {
    setRangeMode('closed')
    onChange({ desde: '', hasta: '' })
  }

  const handleDesdeChange = (nuevaFecha: string) => {
    if (rangeMode === 'toOnly') {
      setRangeMode('closed')
      applyChange(nuevaFecha, hasta, 'closed')
      return
    }
    applyChange(nuevaFecha, rangeMode === 'fromOnly' ? '' : hasta, rangeMode)
  }

  const handleHastaChange = (nuevaFecha: string) => {
    if (rangeMode === 'fromOnly') {
      setRangeMode('closed')
      applyChange(desde, nuevaFecha, 'closed')
      return
    }
    applyChange(rangeMode === 'toOnly' ? '' : desde, nuevaFecha, rangeMode)
  }

  const handleModeChange = (mode: string) => {
    const next = mode as DateRangeMode
    setRangeMode(next)
    if (next === 'fromOnly') {
      onChange({ desde, hasta: '' })
    } else if (next === 'toOnly') {
      onChange({ desde: '', hasta })
    }
  }

  const showDesde = rangeMode !== 'toOnly' && !hastaOnly
  const showHasta = rangeMode !== 'fromOnly' && !desdeOnly

  return (
    <div
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1',
        className
      )}
      role="group"
      aria-label="Filtro por fechas"
    >
      {showDesde && (
        <div className={cn('shrink-0', pickerWidth)}>
          <DatePickerForm
            value={desde}
            onChange={handleDesdeChange}
            placeholder="Desde"
            id="filter-fecha-desde"
            aria-label={ariaLabelDesde}
            className="h-9 w-full text-sm"
          />
        </div>
      )}

      {showDesde && showHasta && (
        <span className="shrink-0 text-xs text-muted-foreground" aria-hidden>
          →
        </span>
      )}

      {showHasta && (
        <div className={cn('shrink-0', pickerWidth)}>
          <DatePickerForm
            value={hasta}
            onChange={handleHastaChange}
            placeholder="Hasta"
            id="filter-fecha-hasta"
            aria-label={ariaLabelHasta}
            className="h-9 w-full text-sm"
          />
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-9 shrink-0 gap-1 border-border px-2 text-xs font-normal',
              hasFilter && 'border-primary/40 bg-primary/5 text-foreground'
            )}
            aria-label="Periodos y opciones de fecha"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="max-w-[88px] truncate sm:max-w-[120px]">{periodLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Periodo rápido</DropdownMenuLabel>
          {visiblePresets.map((preset) => (
            <DropdownMenuItem
              key={preset}
              onClick={() => handlePreset(preset)}
              className="justify-between"
            >
              {DATE_PRESET_LABELS[preset]}
              {activePreset === preset && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}

          {showModeToggles && !legacyMode && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Tipo de filtro</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={rangeMode} onValueChange={handleModeChange}>
                {MODE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleClear}
            className={cn(!hasFilter && 'bg-muted/60')}
          >
            Sin filtro de fecha
            {!hasFilter && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
