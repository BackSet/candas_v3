import { toISODate } from '@/components/ui/date-time-picker'
import { formatearFechaCorta } from '@/utils/fechas'

export type DatePreset =
  | 'hoy'
  | 'ayer'
  | 'esta-semana'
  | 'semana-pasada'
  | 'este-mes'
  | 'mes-pasado'

export type DateRangeMode = 'closed' | 'fromOnly' | 'toOnly'

/** Fecha local en YYYY-MM-DD (sin desfase UTC). */
export function toLocalISODate(date: Date): string {
  return toISODate(date)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function todayStart(): Date {
  return startOfDay(new Date())
}

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  'esta-semana': 'Esta semana',
  'semana-pasada': 'Semana pasada',
  'este-mes': 'Este mes',
  'mes-pasado': 'Mes pasado',
}

export const DATE_PRESETS: DatePreset[] = [
  'hoy',
  'ayer',
  'esta-semana',
  'semana-pasada',
  'este-mes',
  'mes-pasado',
]

export function getPresetDates(preset: DatePreset): { desde: string; hasta: string } {
  const hoy = todayStart()

  switch (preset) {
    case 'hoy': {
      const f = toLocalISODate(hoy)
      return { desde: f, hasta: f }
    }
    case 'ayer': {
      const ayer = new Date(hoy)
      ayer.setDate(ayer.getDate() - 1)
      const f = toLocalISODate(ayer)
      return { desde: f, hasta: f }
    }
    case 'esta-semana': {
      const inicioSemana = new Date(hoy)
      const diaSemana = inicioSemana.getDay()
      const diff = diaSemana === 0 ? 6 : diaSemana - 1
      inicioSemana.setDate(inicioSemana.getDate() - diff)
      return { desde: toLocalISODate(inicioSemana), hasta: toLocalISODate(hoy) }
    }
    case 'semana-pasada': {
      const inicioSemanaPasada = new Date(hoy)
      const diaSemana = inicioSemanaPasada.getDay()
      const diff = diaSemana === 0 ? 6 : diaSemana - 1
      inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - diff - 7)
      const finSemanaPasada = new Date(inicioSemanaPasada)
      finSemanaPasada.setDate(finSemanaPasada.getDate() + 6)
      return {
        desde: toLocalISODate(inicioSemanaPasada),
        hasta: toLocalISODate(finSemanaPasada),
      }
    }
    case 'este-mes': {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return { desde: toLocalISODate(inicioMes), hasta: toLocalISODate(hoy) }
    }
    case 'mes-pasado': {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      return { desde: toLocalISODate(inicioMes), hasta: toLocalISODate(finMes) }
    }
  }
}

export function detectActivePreset(desde: string, hasta: string): DatePreset | null {
  if (!desde && !hasta) return null
  for (const preset of DATE_PRESETS) {
    const dates = getPresetDates(preset)
    if (dates.desde === desde && dates.hasta === hasta) {
      return preset
    }
  }
  return null
}

export function inferRangeMode(desde: string, hasta: string): DateRangeMode {
  if (desde && !hasta) return 'fromOnly'
  if (!desde && hasta) return 'toOnly'
  return 'closed'
}

export function formatDateRangeLabel(
  desde: string,
  hasta: string,
  mode?: DateRangeMode
): string {
  const preset = detectActivePreset(desde, hasta)
  if (preset) {
    return DATE_PRESET_LABELS[preset]
  }

  const resolvedMode = mode ?? inferRangeMode(desde, hasta)

  if (resolvedMode === 'fromOnly' && desde) {
    return `Desde ${formatearFechaCorta(desde)}`
  }
  if (resolvedMode === 'toOnly' && hasta) {
    return `Hasta ${formatearFechaCorta(hasta)}`
  }
  if (desde && hasta) {
    if (desde === hasta) {
      return formatearFechaCorta(desde)
    }
    return `${formatearFechaCorta(desde)} → ${formatearFechaCorta(hasta)}`
  }
  if (desde) {
    return `Desde ${formatearFechaCorta(desde)}`
  }
  if (hasta) {
    return `Hasta ${formatearFechaCorta(hasta)}`
  }
  return ''
}

export interface DateRangeValidation {
  valid: boolean
  /** Si hasta < desde, devuelve hasta corregido (= desde). */
  correctedHasta?: string
}

export function validateDateRange(desde: string, hasta: string): DateRangeValidation {
  if (!desde || !hasta) {
    return { valid: true }
  }
  if (hasta < desde) {
    return { valid: false, correctedHasta: desde }
  }
  return { valid: true }
}

export function compareISODates(a: string, b: string): number {
  return a.localeCompare(b)
}

/** Texto corto para el botón/trigger del filtro de fechas. */
export function getDateRangeSummary(desde: string, hasta: string): string {
  if (!desde && !hasta) return 'Periodo'
  return formatDateRangeLabel(desde, hasta)
}
