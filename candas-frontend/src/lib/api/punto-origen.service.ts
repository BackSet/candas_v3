import type { PuntoOrigen, PuntoOrigenPage } from '@/types/punto-origen'
import { openapiClient, handleResponse } from './openapi-client'

export type { PuntoOrigen, PuntoOrigenPage } from '@/types/punto-origen'

export interface PuntoOrigenFindAllParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

export const puntoOrigenService = {
  async findAll(params: PuntoOrigenFindAllParams = {}): Promise<PuntoOrigenPage> {
    const { page = 0, size = 20, search, activo } = params
    return handleResponse(
      openapiClient.GET('/api/v1/puntos-origen', {
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

  async findById(id: number): Promise<PuntoOrigen> {
    return handleResponse(
      openapiClient.GET('/api/v1/puntos-origen/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: PuntoOrigen): Promise<PuntoOrigen> {
    return handleResponse(
      openapiClient.POST('/api/v1/puntos-origen', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: PuntoOrigen): Promise<PuntoOrigen> {
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

  async search(query: string): Promise<PuntoOrigen[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/puntos-origen/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
