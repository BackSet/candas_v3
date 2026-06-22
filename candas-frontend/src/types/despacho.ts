import type { DespachoDirecto } from './despacho-directo'
import type { PageResponse } from './paquete'
import type { Saca } from './saca'

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
  /** Destinatario directo para crear/editar cuando el destino no es agencia. */
  idDestinatarioDirecto?: number
  /** Alternativa para generar destinatario desde datos del paquete; se ignora si se envía idDestinatarioDirecto. */
  idPaqueteOrigenDestinatario?: number
  despachoDirecto?: DespachoDirecto // Para lectura
  /** @deprecated Legacy. El presinto operativo vive en cada saca (Saca.codigoPresinto). El backend aún lo devuelve por compatibilidad histórica; la UI no lo usa. */
  codigoPresinto?: string
  sacas?: Saca[]
}

export type DespachoPage = PageResponse<Despacho>
