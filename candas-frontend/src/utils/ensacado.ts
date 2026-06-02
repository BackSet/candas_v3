import type { PaqueteEnsacadoInfo,SacaEnsacadoInfo } from '@/types/ensacado'
import { TamanoSaca } from '@/types/saca'

export interface MetricasLlenadoSaca {
  /** Porcentaje de paquetes asignados ya ensacados (0–100) */
  pctPorPaquetes: number
  ensacados: number
  totalAsignados: number
  pendientes: number
  /** Porcentaje de capacidad por peso (0–100) */
  pctPorPeso: number
}

/**
 * Métricas de llenado: el progreso operativo es por paquetes; el peso es capacidad física.
 */
export function calcularMetricasLlenadoSaca(
  info: PaqueteEnsacadoInfo,
  saca?: SacaEnsacadoInfo | null
): MetricasLlenadoSaca {
  const ensacados = saca?.paquetesActuales ?? info.paquetesEnSaca ?? 0
  const totalAsignados =
    saca?.paquetesEsperados ?? Math.max(ensacados + (info.paquetesFaltantesSaca ?? 0), ensacados)
  const pendientes = saca?.paquetesPendientes?.length ?? info.paquetesFaltantesSaca ?? 0

  const pctPorPaquetes =
    totalAsignados > 0 ? Math.min(100, Math.round((ensacados / totalAsignados) * 100)) : 0

  const pctDesdeApi = Number(info.porcentajeLlenadoSaca ?? 0)
  const pctDesdeSaca = saca != null ? Number(saca.porcentajeLlenado ?? 0) : pctDesdeApi
  const pctPorPeso = Math.min(100, Math.max(0, saca != null ? pctDesdeSaca : pctDesdeApi))

  // Despacho/saca marcados completos pero peso en 0 → reflejar avance real por paquetes
  const pctFinal =
    (info.sacaLlena || info.despachoLleno) && pctPorPaquetes >= 100
      ? 100
      : pctPorPaquetes

  return {
    pctPorPaquetes: pctFinal,
    ensacados,
    totalAsignados,
    pendientes,
    pctPorPeso,
  }
}

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
