import type { PageResponse } from './paquete'

export interface AgenciaDistribucion {
  idAgenciaDistribucion?: number
  nombre: string
  codigo?: string
  email?: string
  activa?: boolean
}

export type AgenciaDistribucionPage = PageResponse<AgenciaDistribucion>
