import type { PageResponse } from './paquete'

export interface Permiso {
  idPermiso?: number
  nombre: string
  descripcion?: string
  recurso?: string
  accion?: string
}

export type PermisoPage = PageResponse<Permiso>
