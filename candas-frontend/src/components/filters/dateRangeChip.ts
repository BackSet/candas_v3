import type { ListFilterChip } from '@/hooks/useListFilters'
import { formatDateRangeLabel,inferRangeMode } from '@/lib/date-range'

/**
 * Construye el chip de filtro de rango de fechas para `FilterBar`.
 * Devuelve `null` si no hay filtro activo.
 */
export function buildDateRangeChip(
  desde: string,
  hasta: string,
  onRemove: () => void
): ListFilterChip | null {
  if (!desde && !hasta) return null

  const mode = inferRangeMode(desde, hasta)
  const label = formatDateRangeLabel(desde, hasta, mode)

  return {
    key: 'fechaRango',
    label: `Fecha: ${label}`,
    onRemove,
  }
}
