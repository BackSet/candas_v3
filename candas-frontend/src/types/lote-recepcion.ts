import type { PageResponse,Paquete,PaqueteNoImportado } from './paquete'

/** Etiquetas en español para mostrar el tipo de lote en toda la UI. */
export const TIPO_LOTE_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  ESPECIAL: 'Especial',
  AUTOMATICO_DESPACHO: 'Automático (despacho)',
}

/**
 * Devuelve la etiqueta amigable para el tipo de lote.
 * Si el valor no está en el mapa (legacy o desconocido), devuelve "Normal".
 */
export function getTipoLoteLabel(tipoLote: string | undefined): string {
  if (!tipoLote) return 'Normal'
  return TIPO_LOTE_LABELS[tipoLote] ?? 'Normal'
}

export interface LoteRecepcion {
  idLoteRecepcion?: number
  /** NORMAL, ESPECIAL o AUTOMATICO_DESPACHO (creado automáticamente desde despachos rápidos/clásicos) */
  tipoLote?: string
  numeroRecepcion?: string
  idAgencia: number
  nombreAgencia?: string // Nombre de la agencia para mostrar en listas
  cantonAgencia?: string // Cantón de la agencia para mostrar en listas
  fechaRecepcion: string
  usuarioRegistro: string
  observaciones?: string
  // Campos calculados dinámicamente
  porcentajeCompletado?: number
  totalPaquetes?: number
  paquetesDespachados?: number
  paquetesPendientes?: number
}

export type LoteRecepcionPage = PageResponse<LoteRecepcion>

export interface LoteRecepcionImportResult {
  totalRegistros: number
  paquetesEncontrados: number
  paquetesNoEncontrados: number
  numerosGuiaNoEncontrados: string[]
  paquetesAsociados: Paquete[]
  paquetesNoImportados?: PaqueteNoImportado[]
  numerosGuiaDuplicados?: string[]
}

export interface LoteRecepcionEstadisticas {
  totalPaquetes: number
  paquetesDespachados: number
  paquetesPendientes: number
  porcentajeCompletado: number
}

export interface PaqueteNoEncontrado {
  idPaqueteNoEncontrado?: number
  idLoteRecepcion: number
  numeroGuia: string
  fechaRegistro: string
  usuarioRegistro: string
}
