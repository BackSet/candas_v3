import type { TamanoSaca } from './saca'

export interface PaqueteEnsacadoInfo {
  idPaquete: number
  numeroGuia: string
  
  // Información de la saca asignada
  idSacaAsignada: number
  codigoQrSaca: string
  numeroOrdenSaca: number
  tamanoSaca?: TamanoSaca
  destino: string // Agencia destino o dirección completa del destinatario
  
  // Información de llenado de la saca
  porcentajeLlenadoSaca: number
  paquetesEnSaca: number
  paquetesFaltantesSaca: number
  pesoActualSaca: number
  capacidadMaximaSaca: number
  
  // Información del despacho completo
  idDespacho: number
  numeroManifiesto: string
  fechaDespacho?: string // ISO date string
  totalSacas?: number
  porcentajeLlenadoDespacho: number
  paquetesEnDespacho: number
  paquetesFaltantesDespacho: number
  despachoLleno: boolean
  
  // Mensajes y alertas
  mensajeAlerta?: string // "Saca llena", "Despacho completo", etc.
  sacaLlena: boolean // Si la saca está al 100% de capacidad
  yaEnsacado?: boolean // Si el paquete ya está ensacado físicamente
  
  // Información de agencia (si el despacho es para una agencia)
  idAgencia?: number
  nombreAgencia?: string
  direccionAgencia?: string
  cantonAgencia?: string
  telefonoAgencia?: string
  
  // Información de destinatario directo (si el despacho es directo)
  idDestinatarioDirecto?: number
  nombreDestinatarioDirecto?: string
  telefonoDestinatarioDirecto?: string
  direccionDestinatarioDirecto?: string
  
  // Información del paquete (dirección y observaciones)
  direccionDestinatarioCompleta?: string // Dirección completa del destinatario del paquete
  observaciones?: string // Observaciones del paquete
  enSaca?: boolean // Si el paquete está asignado a una saca
}

export interface SacaEnsacadoInfo {
  idSaca: number
  codigoQr: string
  numeroOrden: number
  tamano: TamanoSaca
  pesoActual: number
  capacidadMaxima: number
  paquetesActuales: number
  paquetesEsperados: number
  porcentajeLlenado: number
  completada: boolean
  destino: string // Destino común de los paquetes en esta saca
  paquetesPendientes: string[] // Números de guía de paquetes pendientes
  paquetesEnsacados?: string[] // Números de guía ya ensacados en esta saca
}

export interface DespachoEnsacadoInfo {
  idDespacho: number
  numeroManifiesto: string
  fechaDespacho?: string // ISO date string
  fechaUltimoEnsacado?: string // ISO date string
  sacas: SacaEnsacadoInfo[]
  porcentajeCompletado: number
  totalPaquetes: number
  paquetesEnsacados: number
  paquetesPendientes: number
  completado: boolean
  destino: string // Agencia, distribuidor o destinatario directo
}

export interface EnsacadoSessionResponse {
  lastPaqueteInfo: PaqueteEnsacadoInfo | null
  lastUpdated: string | null
}
