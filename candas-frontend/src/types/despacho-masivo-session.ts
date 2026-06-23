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

  // --- Lote de despacho masivo (módulo /despachos/masivo) ---
  /** Cola global de guías capturadas, pendientes de resolver/asignar a un despacho del lote. */
  colaGlobalGuias?: string[]
  /** Paquetes resueltos a partir de la cola global de guías. */
  paquetesCola?: DespachoMasivoColaItem[]
  /** Despachos del lote en construcción, con su estado individual. */
  despachosLote?: DespachoMasivoDespachoLote[]
  /** Id temporal (cliente) del despacho actualmente en construcción dentro del lote. */
  despachoActualId?: string
  /** Resumen agregado de la sesión / lote masivo. */
  resumen?: DespachoMasivoResumen
}

/** Estado de cada despacho dentro de un lote masivo. */
export type DespachoMasivoEstado = 'en_edicion' | 'creando' | 'creado' | 'error'

/**
 * Estado de resolución de una guía dentro de la cola global:
 * - `pendiente`: capturada, aún sin resolver contra backend.
 * - `resuelto`: paquete encontrado y disponible para asignar a un despacho.
 * - `no_encontrado`: la guía no existe en backend.
 * - `no_disponible`: el paquete existe pero ya está despachado / no se puede despachar.
 * - `asignado`: ya se usó en un despacho creado dentro de este lote (bloqueada).
 */
export type DespachoMasivoColaEstado =
  | 'pendiente'
  | 'resuelto'
  | 'no_encontrado'
  | 'no_disponible'
  | 'asignado'

/** Guía capturada en la cola global y su paquete resuelto (si existe). */
export interface DespachoMasivoColaItem {
  numeroGuia: string
  estado: DespachoMasivoColaEstado
  /** Id real del paquete resuelto (necesario para construir las sacas del despacho). */
  idPaquete?: number
  /** Paquete resuelto para la guía (cuando `estado === 'resuelto' | 'asignado'`). */
  paquete?: DespachoMasivoSessionPaqueteItem
  /** Id temporal del despacho del lote al que se asignó (cuando `estado === 'asignado'`). */
  despachoLoteId?: string
  /** Mensaje informativo o de error de la resolución. */
  mensaje?: string
}

/** Un despacho individual dentro del lote masivo y su estado de creación. */
export interface DespachoMasivoDespachoLote {
  /** Id temporal generado en cliente para identificar el despacho antes de crearse. */
  id: string
  estado: DespachoMasivoEstado
  /** Id real del despacho en backend, una vez creado. */
  idDespacho?: number
  /** Número de manifiesto generado por backend, para mostrar/enlazar en la lista del lote. */
  numeroManifiesto?: string
  /** Resumen de destino para mostrar en la lista del lote. */
  destinoResumen?: string
  /** Guías incluidas en este despacho (para trazabilidad en el lote). */
  numerosGuia?: string[]
  /** Marca de tiempo (ISO) de creación, para ordenar la lista del lote. */
  creadoEn?: string
  totalPaquetes?: number
  totalSacas?: number
  /** Mensaje de error cuando `estado === 'error'`. */
  error?: string
  /** Payload del despacho en construcción (reutiliza el formato del formulario). */
  payload?: DespachoMasivoSessionPayload
}

/** Resumen agregado del lote masivo para la UI shell. */
export interface DespachoMasivoResumen {
  totalGuiasCola: number
  totalGuiasResueltas: number
  totalDespachos: number
  despachosCreados: number
  despachosConError: number
}

export interface DespachoMasivoSessionPaqueteItem {
  numeroGuia?: string
  nombreClienteDestinatario?: string
  ref?: string
  direccionDestinatarioCompleta?: string
  provinciaDestinatario?: string
  cantonDestinatario?: string
  paisDestinatario?: string
  observaciones?: string
  pesoKilos?: number
}

export interface DespachoMasivoSessionResponse {
  payload: DespachoMasivoSessionPayload | null
  lastUpdated: string | null
}
