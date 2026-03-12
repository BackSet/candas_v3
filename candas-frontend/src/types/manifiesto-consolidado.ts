export interface ManifiestoConsolidado {
  idManifiestoConsolidado: number
  idAgencia?: number
  nombreAgencia: string
  codigoAgencia?: string
  direccionAgencia?: string
  cantonAgencia?: string
  fechaInicio?: string
  fechaFin?: string
  mes?: number
  anio?: number
  fechaGeneracion: string
  usuarioGenerador: string
  totalDespachos: number
  totalSacas: number
  totalPaquetes: number
  pesoTotal?: number
}

export interface ManifiestoConsolidadoResumen {
  idManifiestoConsolidado: number
  numeroManifiesto?: string
  idAgencia?: number
  nombreAgencia: string
  codigoAgencia?: string
  cantonAgencia?: string
  periodo: string
  fechaGeneracion: string
  usuarioGenerador: string
  totalDespachos: number
  totalSacas: number
  totalPaquetes: number
}

export interface ManifiestoConsolidadoPage {
  content: ManifiestoConsolidadoResumen[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ManifiestoConsolidadoDetalle {
  idManifiestoConsolidado: number
  numeroManifiesto?: string
  idAgencia?: number
  nombreAgencia: string
  codigoAgencia?: string
  direccionAgencia?: string
  cantonAgencia?: string
  fechaInicio?: string
  fechaFin?: string
  mes?: number
  anio?: number
  fechaGeneracion?: string
  usuarioGenerador: string
  despachos: DespachoDetalle[]
  totales: TotalesManifiesto
}

export interface DespachoDetalle {
  idDespacho: number
  numeroManifiesto: string
  fechaDespacho: string
  numeroGuiaAgenciaDistribucion?: string
  nombreDistribuidor?: string
  nombreAgencia?: string
  codigoAgencia?: string
  cantonAgencia?: string
  esDestinatarioDirecto?: boolean
  nombreDestinatarioDirecto?: string
  telefonoDestinatarioDirecto?: string
  direccionDestinatarioDirecto?: string
  cantonDestinatarioDirecto?: string
  sacas: SacaDetalle[]
  totalSacas: number
  totalPaquetes: number
}

export interface SacaDetalle {
  idSaca: number
  numeroOrden: number
  tamano: string
  codigoQr?: string
  cantidadPaquetes: number
  paquetes: PaqueteDetalle[]
}

export interface PaqueteDetalle {
  idPaquete: number
  numeroGuia: string
  ref?: string
  nombreClienteDestinatario?: string
  direccionDestinatarioCompleta?: string
  provinciaDestinatario?: string
  paisDestinatario?: string
  cantonDestinatario?: string
  telefonoDestinatario?: string
  observaciones?: string
}

export interface TotalesManifiesto {
  totalDespachos: number
  totalSacas: number
  totalPaquetes: number
  pesoTotal?: number
}

export interface CrearManifiestoConsolidadoDTO {
  idAgencia?: number // null o undefined = todas las agencias
  idDistribuidor?: number // null o undefined = todos los distribuidores
  idDestinatarioDirecto?: number // null o undefined = todos los destinatarios directos
  fechaInicio?: string
  fechaFin?: string
  mes?: number
  anio?: number
}
