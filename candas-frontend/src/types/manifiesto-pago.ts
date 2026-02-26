export interface ManifiestoPago {
  idManifiestoPago: number
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

export interface ManifiestoPagoResumen {
  idManifiestoPago: number
  idAgencia?: number
  nombreAgencia: string
  codigoAgencia?: string
  periodo: string
  fechaGeneracion: string
  usuarioGenerador: string
  totalDespachos: number
  totalSacas: number
  totalPaquetes: number
}

export interface ManifiestoPagoPage {
  content: ManifiestoPagoResumen[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ManifiestoPagoDetalle {
  idManifiestoPago: number
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
  nombreAgenciaDistribucion?: string
  nombreAgencia?: string
  codigoAgencia?: string
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
  nombreClienteDestinatario?: string
  direccionDestinatarioCompleta?: string
  ciudadDestinatario?: string
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

export interface CrearManifiestoPagoDTO {
  idAgencia?: number // null o undefined = todas las agencias
  idAgenciaDistribucion?: number // null o undefined = todas las agencias de distribución
  fechaInicio?: string
  fechaFin?: string
  mes?: number
  anio?: number
}
