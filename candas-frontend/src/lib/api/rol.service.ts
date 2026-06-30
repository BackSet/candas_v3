import type { Rol, RolPage } from '@/types/rol'
import { openapiClient, handleResponse } from './openapi-client'

export interface RolListParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

export const rolService = {
  async findAll(params: RolListParams = {}): Promise<RolPage> {
    const { page = 0, size = 20, search, activo } = params
    return handleResponse(
      openapiClient.GET('/api/v1/roles', {
        params: {
          query: {
            pageable: { page, size },
            search,
            activo,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Rol> {
    return handleResponse(
      openapiClient.GET('/api/v1/roles/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Rol): Promise<Rol> {
    return handleResponse(
      openapiClient.POST('/api/v1/roles', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Rol): Promise<Rol> {
    return handleResponse(
      openapiClient.PUT('/api/v1/roles/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/roles/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async obtenerPermisos(id: number): Promise<number[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/roles/{id}/permisos', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async asignarPermisos(id: number, permisos: number[]): Promise<void> {
    return handleResponse(
      openapiClient.PUT('/api/v1/roles/{id}/permisos', {
        params: {
          path: { id },
        },
        body: { permisos } as any,
      })
    ) as any
  },

  async search(query: string): Promise<Rol[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/roles/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
