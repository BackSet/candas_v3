import type { PageResponse } from './paquete'

export interface PuntoOrigen {
  idPuntoOrigen?: number
  nombrePuntoOrigen: string
  activo?: boolean
}

export type PuntoOrigenPage = PageResponse<PuntoOrigen>
