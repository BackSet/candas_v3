import type { TamanoSaca } from './saca'

/** Modos de clasificación cuyos paquetes tipiados se persisten en sesión (recarga). */
export type ModoClasificacionSession = 'DOMICILIO' | 'CLEMENTINA' | 'SEPARAR' | 'CADENITA'

/**
 * Payload del formulario Crear Despacho Masivo que se sincroniza con la sesión
 * para la vista "Ver despacho en curso". Coincide con los campos que envían
 * LoteRecepcionOperador y LoteEspecialOperador.
 */
export interface DespachoMasivoSessionPayload {
  packageCount?: number
  pesoTotalBulk?: number
  bulkTipoDestino?: 'AGENCIA' | 'DIRECTO'
  bulkDestinatarioOrigen?: 'EXISTENTE' | 'DESDE_PAQUETE'
  bulkIdDestino?: string
  bulkIdPaqueteOrigenDestinatario?: string
  bulkDesdePaqueteNombre?: string
  bulkDesdePaqueteTelefono?: string
  bulkDesdePaqueteDireccion?: string
  bulkDesdePaqueteCanton?: string
  codigoDestinoBulk?: string | null
  destinoResumen?: string
  sacaDistribution?: string
  tamanosSacasBulk?: TamanoSaca[]
  bulkIdDistribuidor?: string
  nombreDistribuidor?: string
  bulkNumeroGuia?: string
  bulkObservaciones?: string
  bulkCodigoPresinto?: string
  bulkFechaDespacho?: string
  idLote?: number
  tipoLote?: 'NORMAL' | 'ESPECIAL'
  /** Lista de paquetes tipiados para mostrar en Ver despacho en curso */
  paquetes?: DespachoMasivoSessionPaqueteItem[]
  /** Paquetes tipiados por modo de clasificación (persisten al recargar). Solo Domicilio, Clementina, Separar, Cadenita. */
  paquetesByMode?: Record<ModoClasificacionSession, DespachoMasivoSessionPaqueteItem[]>
}

export interface DespachoMasivoSessionPaqueteItem {
  numeroGuia?: string
  nombreClienteDestinatario?: string
  ref?: string
  direccionDestinatarioCompleta?: string
  ciudadDestinatario?: string
  cantonDestinatario?: string
  paisDestinatario?: string
  observaciones?: string
  pesoKilos?: number
}

export interface DespachoMasivoSessionResponse {
  payload: DespachoMasivoSessionPayload | null
  lastUpdated: string | null
}
