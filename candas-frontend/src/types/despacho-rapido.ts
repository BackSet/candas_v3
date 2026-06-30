import type { TamanoSaca } from './saca'

/** Estados del ciclo de vida de un despacho rápido (espejo de `EstadoDespacho` backend). */
export type EstadoDespachoRapido = 'BORRADOR' | 'EN_ENSACADO' | 'LISTO_PARA_GUIA' | 'FINALIZADO'

export interface DespachoRapidoPaquete {
  idPaquete: number
  numeroGuia: string
  estado: string
  ordenEnSaca?: number
}

export interface DespachoRapidoSaca {
  idSaca: number
  numeroOrden: number
  codigoQr?: string
  tamano?: TamanoSaca
  codigoPresinto?: string
  paquetes: DespachoRapidoPaquete[]
}

export interface DespachoRapido {
  idDespacho: number
  numeroManifiesto?: string
  estado: EstadoDespachoRapido
  fechaDespacho?: string
  usuarioRegistro?: string
  observaciones?: string

  idAgencia?: number
  nombreAgencia?: string
  idDestinatarioDirecto?: number
  nombreDestinatarioDirecto?: string

  idAgenciaPropietaria?: number
  nombreAgenciaPropietaria?: string

  idDistribuidor?: number
  nombreDistribuidor?: string
  numeroGuiaAgenciaDistribucion?: string

  totalSacas: number
  totalPaquetes: number
  sacas: DespachoRapidoSaca[]
}

// ---- Payloads de request ----

export interface CrearDespachoRapidoPayload {
  idAgencia?: number
  idDestinatarioDirecto?: number
  idPaqueteOrigenDestinatario?: number
  idDistribuidor?: number
  observaciones?: string
}

export interface AgregarPaqueteRapidoPayload {
  numeroGuia: string
  idSaca?: number
  tamanoSaca?: TamanoSaca
}

export interface MoverPaqueteRapidoPayload {
  idPaquete?: number
  numeroGuia?: string
  idSacaDestino: number
}

export interface CrearSacaRapidaPayload {
  tamanoSaca?: TamanoSaca
  codigoPresinto?: string
}

export interface ActualizarPresintoSacaPayload {
  codigoPresinto: string
}

export interface ActualizarDestinoDespachoRapidoPayload {
  idAgencia?: number
  idDestinatarioDirecto?: number
  idPaqueteOrigenDestinatario?: number
  idDistribuidor?: number
}

export interface FinalizarDespachoRapidoPayload {
  numeroGuiaAgenciaDistribucion: string
  idDistribuidor?: number
}

/** Etiquetas legibles de estado para UI. */
export const ESTADO_DESPACHO_RAPIDO_LABEL: Record<EstadoDespachoRapido, string> = {
  BORRADOR: 'Borrador',
  EN_ENSACADO: 'En ensacado',
  LISTO_PARA_GUIA: 'Listo para guía',
  FINALIZADO: 'Finalizado',
}
