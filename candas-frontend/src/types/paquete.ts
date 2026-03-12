export enum EstadoPaquete {
  REGISTRADO = 'REGISTRADO',
  RECIBIDO = 'RECIBIDO',
  ASIGNADO_SACA = 'ASIGNADO_SACA',
  ENSACADO = 'ENSACADO',
  DESPACHADO = 'DESPACHADO',
  RETENER = 'RETENER',
}

export enum TipoPaquete {
  CLEMENTINA = 'CLEMENTINA',
  SEPARAR = 'SEPARAR',
  CADENITA = 'CADENITA',
  PENDIENTE_REVISION = 'PENDIENTE_REVISION',
}

export enum TipoDestino {
  AGENCIA = 'AGENCIA',
  DOMICILIO = 'DOMICILIO',
}

export interface Paquete {
  idPaquete?: number
  numeroGuia?: string
  numeroMaster?: string
  pesoKilos?: number
  estado: EstadoPaquete
  tipoPaquete?: TipoPaquete // Puede ser null al inicio
  tipoDestino?: TipoDestino // Puede ser null si no tiene destino asignado
  idPuntoOrigen?: number
  nombrePuntoOrigen?: string
  idClienteRemitente: number
  clienteRemitente?: { nombre: string }
  nombreClienteRemitente?: string
  // Dirección del remitente
  direccionRemitenteCompleta?: string
  paisRemitente?: string
  provinciaRemitente?: string
  cantonRemitente?: string
  direccionRemitente?: string
  idClienteDestinatario?: number
  nombreClienteDestinatario?: string
  telefonoDestinatario?: string // String para compatibilidad
  documentoDestinatario?: string
  // Dirección del destinatario
  direccionDestinatarioCompleta?: string
  paisDestinatario?: string
  provinciaDestinatario?: string
  cantonDestinatario?: string
  direccionDestinatario?: string
  idAgenciaDestino?: number
  nombreAgenciaDestino?: string
  cantonAgenciaDestino?: string
  idDestinatarioDirecto?: number
  idLoteRecepcion?: number
  numeroRecepcion?: string
  idSaca?: number
  numeroSaca?: string
  idDespacho?: number
  numeroManifiesto?: string
  /** Agencia del despacho (cuando el paquete está en un despacho a agencia) */
  nombreAgenciaDespacho?: string
  cantonAgenciaDespacho?: string
  /** Destinatario directo del despacho (cuando el despacho es directo) */
  nombreDestinatarioDirectoDespacho?: string
  direccionDestinatarioDirectoDespacho?: string
  idPaquetePadre?: number
  numeroGuiaPaquetePadre?: string
  etiquetaDestinatario?: string
  fechaRegistro?: string
  fechaRecepcion?: string
  fechaEnsacado?: string
  observaciones?: string
  sed?: string
  medidas?: string
  pesoLibras?: number
  descripcion?: string
  valor?: number
  tarifaPosition?: string
  ref?: string
  // Campos para operaciones especiales
  etiquetaCambiada?: boolean // Para CLEMENTINA
  separado?: boolean // Para SEPARAR
  unidoEnCaja?: boolean // Para CADENITA
  fechaEtiquetaCambiada?: string
  fechaSeparado?: string
  fechaUnidoEnCaja?: string
}

// Tipo para la respuesta paginada del backend (Spring Data Page)
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export type PaquetePage = PageResponse<Paquete>

export interface PaqueteNoImportado {
  numeroGuia: string
  motivo: string
  numeroFila?: number
}

export interface ImportResult {
  totalRegistros: number
  registrosExitosos: number
  registrosFallidos: number
  errores: string[]
  paquetesCreados: Paquete[]
  paquetesNoImportados?: PaqueteNoImportado[]
  numerosGuiaDuplicados?: string[]
}

export interface PaqueteSimplificado {
  numeroGuia: string
  observaciones?: string
  idClienteRemitente?: number
}

export interface AsociarClementinaLoteRequest {
  asociaciones: Array<{
    numeroGuiaPadre: string
    numeroGuiaHijo: string
  }>
}

export interface ResultadoAsociacion {
  numeroGuiaPadre: string
  numeroGuiaHijo: string
  exito: boolean
  mensaje: string
}

export interface AsociarClementinaLoteResult {
  totalAsociaciones: number
  exitosas: number
  fallidas: number
  resultados: ResultadoAsociacion[]
}

export interface ResultadoCadenita {
  numeroGuiaHijo: string
  exito: boolean
  mensaje: string
}

export interface AsociarCadenitaLoteResult {
  numeroGuiaPadre: string
  totalAsociaciones: number
  exitosas: number
  fallidas: number
  resultados: ResultadoCadenita[]
}
