import type { Distribuidor, DistribuidorPage } from '@/types/distribuidor'
import { openapiClient, handleResponse } from './openapi-client'

export interface DistribuidorFindAllParams {
  page?: number
  size?: number
  search?: string
  nombre?: string
  codigo?: string
  activa?: boolean
}

export const distribuidorService = {
  async findAll(params: DistribuidorFindAllParams = {}): Promise<DistribuidorPage> {
    const { page = 0, size = 20, search, nombre, codigo, activa } = params
    return handleResponse(
      openapiClient.GET('/api/v1/distribuidores', {
        params: {
          query: {
            pageable: { page, size },
            search,
            nombre,
            codigo,
            activa,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Distribuidor> {
    return handleResponse(
      openapiClient.GET('/api/v1/distribuidores/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Distribuidor): Promise<Distribuidor> {
    return handleResponse(
      openapiClient.POST('/api/v1/distribuidores', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Distribuidor): Promise<Distribuidor> {
    return handleResponse(
      openapiClient.PUT('/api/v1/distribuidores/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/distribuidores/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<Distribuidor[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/distribuidores/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },

  async buscarOCrear(nombre?: string, codigo?: string): Promise<Distribuidor> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/distribuidores/buscar-o-crear', {
        body: { nombre, codigo } as any,
      })
    ) as any
  },
}
