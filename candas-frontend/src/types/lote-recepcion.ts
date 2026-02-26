import type { PageResponse, PaqueteNoImportado } from './paquete'
import type { Paquete } from './paquete'

export interface LoteRecepcion {
  idLoteRecepcion?: number
  /** NORMAL o ESPECIAL */
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
