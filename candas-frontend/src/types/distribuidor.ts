import type { PageResponse } from './paquete'

export interface Distribuidor {
  idDistribuidor?: number
  nombre: string
  codigo?: string
  email?: string
  activa?: boolean
}

export type DistribuidorPage = PageResponse<Distribuidor>
