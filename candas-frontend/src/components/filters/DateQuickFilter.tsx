import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DatePreset = 'hoy' | 'ayer' | 'esta-semana' | 'semana-pasada' | 'este-mes' | 'mes-pasado' | 'personalizado'

export interface DateQuickFilterProps {
  desde: string
  hasta: string
  onChange: (next: { desde: string; hasta: string }) => void
  onPresetSelect?: (preset: DatePreset) => void
  className?: string
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getPresetDates(preset: DatePreset): { desde: string; hasta: string } {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  switch (preset) {
    case 'hoy': {
      const f = formatDate(inicioHoy)
      return { desde: f, hasta: f }
    }
    case 'ayer': {
      const ayer = new Date(inicioHoy)
      ayer.setDate(ayer.getDate() - 1)
      const f = formatDate(ayer)
      return { desde: f, hasta: f }
    }
    case 'esta-semana': {
      const inicioSemana = new Date(inicioHoy)
      const diaSemana = inicioSemana.getDay()
      const diff = diaSemana === 0 ? 6 : diaSemana - 1
      inicioSemana.setDate(inicioSemana.getDate() - diff)
      return { desde: formatDate(inicioSemana), hasta: formatDate(hoy) }
    }
    case 'semana-pasada': {
      const inicioSemanaPasada = new Date(inicioHoy)
      const diaSemana = inicioSemanaPasada.getDay()
      const diff = diaSemana === 0 ? 6 : diaSemana - 1
      inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - diff - 7)
      const finSemanaPasada = new Date(inicioSemanaPasada)
      finSemanaPasada.setDate(finSemanaPasada.getDate() + 6)
      return { desde: formatDate(inicioSemanaPasada), hasta: formatDate(finSemanaPasada) }
    }
    case 'este-mes': {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return { desde: formatDate(inicioMes), hasta: formatDate(hoy) }
    }
    case 'mes-pasado': {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const finMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
      return { desde: formatDate(mes), hasta: formatDate(finMes) }
    }
    case 'personalizado':
    default:
      return { desde: '', hasta: '' }
  }
}

const presetLabels: Record<DatePreset, string> = {
  'hoy': 'Hoy',
  'ayer': 'Ayer',
  'esta-semana': 'Esta semana',
  'semana-pasada': 'Semana pasada',
  'este-mes': 'Este mes',
  'mes-pasado': 'Mes pasado',
  'personalizado': 'Fechas',
}

function getCurrentPreset(desde: string, hasta: string): DatePreset | null {
  if (!desde && !hasta) return null
  const presets: DatePreset[] = ['hoy', 'ayer', 'esta-semana', 'semana-pasada', 'este-mes', 'mes-pasado']
  for (const preset of presets) {
    const dates = getPresetDates(preset)
    if (dates.desde === desde && dates.hasta === hasta) {
      return preset
    }
  }
  return null
}

function getPresetFromSearchParams(): DatePreset | null {
  const params = new URLSearchParams(window.location.search)
  const preset = params.get('preset')
  if (preset && preset in presetLabels) {
    return preset as DatePreset
  }
  return null
}

export function DateQuickFilter({
  desde,
  hasta,
  onChange,
  onPresetSelect,
  className,
}: DateQuickFilterProps) {
  const currentPreset = getCurrentPreset(desde, hasta)

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === 'personalizado') {
      onChange({ desde: '', hasta: '' })
    } else {
      const dates = getPresetDates(preset)
      onChange(dates)
    }
    onPresetSelect?.(preset)
  }

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {(['hoy', 'ayer', 'esta-semana', 'semana-pasada', 'este-mes', 'mes-pasado'] as DatePreset[]).map((preset) => (
        <Button
          key={preset}
          type="button"
          variant={currentPreset === preset ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePresetClick(preset)}
          className={cn(
            'h-8 px-2 text-xs font-normal',
            currentPreset === preset && 'bg-primary text-primary-foreground'
          )}
        >
          {presetLabels[preset]}
        </Button>
      ))}
    </div>
  )
}

export { getPresetDates, getCurrentPreset, formatDate }