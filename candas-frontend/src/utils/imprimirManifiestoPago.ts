import type { ManifiestoConsolidadoDetalle } from '@/types/manifiesto-consolidado'
import type { ManifiestoPagoDetalle } from '@/types/manifiesto-pago'
import {
  imprimirManifiestoConsolidado as imprimirConsolidadoBase,
  generarPDFManifiestoConsolidado as generarPdfConsolidadoBase,
} from '@/utils/imprimirManifiestoConsolidado'

/**
 * Mantiene compatibilidad del manifiesto de pago reutilizando
 * el mismo sistema visual/estructural del manifiesto consolidado.
 */
export function imprimirManifiestoConsolidado(
  manifiesto: ManifiestoConsolidadoDetalle,
  nombreAgenciaOrigen?: string
) {
  imprimirConsolidadoBase(manifiesto, 'todos', nombreAgenciaOrigen)
}

/**
 * Alias retrocompatible utilizado por hooks/páginas de manifiesto de pago.
 */
export function imprimirManifiestoPago(
  manifiesto: ManifiestoPagoDetalle,
  nombreAgenciaOrigen?: string
) {
  imprimirConsolidadoBase(
    manifiesto as unknown as ManifiestoConsolidadoDetalle,
    'todos',
    nombreAgenciaOrigen
  )
}

/**
 * Descarga PDF de manifiesto de pago con el layout consolidado.
 */
export async function generarPDFManifiestoPago(
  manifiesto: ManifiestoPagoDetalle,
  nombreAgenciaOrigen?: string
) {
  await generarPdfConsolidadoBase(
    manifiesto as unknown as ManifiestoConsolidadoDetalle,
    'todos',
    nombreAgenciaOrigen
  )
}
