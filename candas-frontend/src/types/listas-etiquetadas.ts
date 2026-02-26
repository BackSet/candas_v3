import type { Paquete } from './paquete'

export interface ListasEtiquetadasBatchRequest {
  etiqueta: string
  numerosGuia: string[]
  instruccion?: string
}

export interface ListasEtiquetadasBatchResult {
  totalProcesados: number
  paquetes: Paquete[]
  guiasEnVariasListas: string[]
}

export interface GuiaListaEtiquetadaConsultaDTO {
  numeroGuia: string
  etiquetas: string[]
  variasListas: boolean
  fechaRecepcion?: string
  /** Instrucción si existe (ej. Retener), no se muestra en documento de despacho */
  instruccion?: string
}

export type ConsultaListasEtiquetadasResponse = Record<string, GuiaListaEtiquetadaConsultaDTO | undefined>
