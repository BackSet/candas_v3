import type { PaqueteEnsacadoInfo } from '@/types/ensacado'
import { TamanoSaca } from '@/types/saca'

/**
 * Obtiene el destino de un paquete (agencia, destinatario directo o destino genérico)
 * @param info - Información del paquete ensacado
 * @returns El nombre del destino o null si no existe
 */
export function obtenerDestino(info: PaqueteEnsacadoInfo): string | null {
  return info.nombreAgencia || info.nombreDestinatarioDirecto || info.destino || null
}

/**
 * Obtiene el label apropiado para el destino de un paquete
 * @param info - Información del paquete ensacado
 * @returns El label del destino (Agencia de Destino, Destinatario Directo, o Destino)
 */
export function obtenerLabelDestino(info: PaqueteEnsacadoInfo): string {
  if (info.nombreAgencia) {
    return 'Agencia de Destino'
  } else if (info.nombreDestinatarioDirecto) {
    return 'Destinatario Directo'
  } else {
    return 'Destino'
  }
}

/**
 * Formatea el tamaño de la saca en español
 * @param tamano - Tamaño de la saca
 * @returns El tamaño formateado en español
 */
export function formatearTamanoSaca(tamano: TamanoSaca): string {
  const map: Record<TamanoSaca, string> = {
    [TamanoSaca.INDIVIDUAL]: 'Individual',
    [TamanoSaca.PEQUENO]: 'Pequeño',
    [TamanoSaca.MEDIANO]: 'Mediano',
    [TamanoSaca.GRANDE]: 'Grande',
  }
  return map[tamano] || tamano
}
