import type { OrigenUsa, OrigenUsaPage } from '@/types/origen-usa'
import { openapiClient, handleResponse } from './openapi-client'

export const origenUsaService = {
  async findAll(page: number = 0, size: number = 20): Promise<OrigenUsaPage> {
    return handleResponse(
      openapiClient.GET('/api/v1/puntos-origen', {
        params: {
          query: {
            pageable: { page, size },
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<OrigenUsa> {
    return handleResponse(
      openapiClient.GET('/api/v1/puntos-origen/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: OrigenUsa): Promise<OrigenUsa> {
    return handleResponse(
      openapiClient.POST('/api/v1/puntos-origen', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: OrigenUsa): Promise<OrigenUsa> {
    return handleResponse(
      openapiClient.PUT('/api/v1/puntos-origen/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/puntos-origen/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },
}
