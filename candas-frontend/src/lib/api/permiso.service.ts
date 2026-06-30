import type { Permiso, PermisoPage } from '@/types/permiso'
import { openapiClient, handleResponse } from './openapi-client'

export interface PermisoListParams {
  page?: number
  size?: number
  search?: string
  recurso?: string
  accion?: string
}

export const permisoService = {
  async findAll(params: PermisoListParams = {}): Promise<PermisoPage> {
    const { page = 0, size = 20, search, recurso, accion } = params
    return handleResponse(
      openapiClient.GET('/api/v1/permisos', {
        params: {
          query: {
            pageable: { page, size },
            search,
            recurso,
            accion,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Permiso> {
    return handleResponse(
      openapiClient.GET('/api/v1/permisos/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /** Solo renombra el permiso; recurso/acción se gestionan en código backend. */
  async updateNombre(id: number, dto: Pick<Permiso, 'nombre'>): Promise<Permiso> {
    return handleResponse(
      openapiClient.PUT('/api/v1/permisos/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async search(query: string): Promise<Permiso[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/permisos/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
