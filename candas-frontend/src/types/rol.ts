import type { PageResponse } from './paquete'

export interface Rol {
  idRol?: number
  nombre: string
  descripcion?: string
  activo?: boolean
  fechaCreacion?: string
  permisos?: number[]
}

export type RolPage = PageResponse<Rol>
