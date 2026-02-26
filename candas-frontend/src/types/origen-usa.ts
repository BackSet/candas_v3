import type { PageResponse } from './paquete'

export interface OrigenUsa {
  idOrigen?: number
  nombreAgenciaUsa: string
  activo?: boolean
}

export type OrigenUsaPage = PageResponse<OrigenUsa>
