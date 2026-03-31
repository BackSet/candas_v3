import type { PageResponse } from './paquete'
import type { Saca } from './saca'
import type { DespachoDirecto } from './despacho-directo'

export interface Despacho {
  idDespacho?: number
  numeroManifiesto?: string // Se genera automáticamente
  fechaDespacho: string
  usuarioRegistro: string
  observaciones?: string
  idAgencia?: number
  nombreAgencia?: string // Nombre de la agencia para mostrar en listas
  cantonAgencia?: string // Cantón de la agencia para mostrar en listas
  idAgenciaPropietaria?: number
  nombreAgenciaPropietaria?: string
  idDistribuidor?: number
  nombreDistribuidor?: string // Nombre del distribuidor para mostrar en listas
  numeroGuiaAgenciaDistribucion?: string
  idDestinatarioDirecto?: number // Para crear/editar
  /** Crear destinatario desde el cliente del paquete; se ignora si se envía idDestinatarioDirecto */
  idPaqueteOrigenDestinatario?: number
  despachoDirecto?: DespachoDirecto // Para lectura
  codigoPresinto?: string // Código del presinto (etiqueta Zebra/normal); opcional, puede enviarse al crear/editar o generarse en backend
  sacas?: Saca[]
}

export type DespachoPage = PageResponse<Despacho>
