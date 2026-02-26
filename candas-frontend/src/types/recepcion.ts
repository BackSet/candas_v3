import type { PageResponse } from './paquete'
import type { Paquete } from './paquete'

export interface Recepcion {
  idRecepcion?: number
  numeroRecepcion?: string
  idAgencia: number
  fechaRecepcion: string
  usuarioRegistro: string
  observaciones?: string
  // Campos calculados dinámicamente
  porcentajeCompletado?: number
  totalPaquetes?: number
  paquetesDespachados?: number
  paquetesPendientes?: number
}

export type RecepcionPage = PageResponse<Recepcion>

export interface RecepcionImportResult {
  totalRegistros: number
  paquetesEncontrados: number
  paquetesNoEncontrados: number
  numerosGuiaNoEncontrados: string[]
  paquetesAsociados: Paquete[]
}

export interface RecepcionEstadisticas {
  totalPaquetes: number
  paquetesDespachados: number
  paquetesPendientes: number
  porcentajeCompletado: number
}
