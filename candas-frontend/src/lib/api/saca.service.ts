import type { Paquete } from '@/types/paquete'
import type { Saca, SacaPage } from '@/types/saca'
import { openapiClient, handleResponse } from './openapi-client'

export interface SacaFindAllParams {
  page?: number
  size?: number
  search?: string
  idDespacho?: number
  tamano?: string
}

export const sacaService = {
  async findAll(params: SacaFindAllParams = {}): Promise<SacaPage> {
    const { page = 0, size = 20, search, idDespacho, tamano } = params
    return handleResponse(
      openapiClient.GET('/api/v1/sacas', {
        params: {
          query: {
            pageable: { page, size },
            search,
            idDespacho,
            tamano: tamano === 'all' ? undefined : tamano,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Saca> {
    return handleResponse(
      openapiClient.GET('/api/v1/sacas/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Saca): Promise<Saca> {
    return handleResponse(
      openapiClient.POST('/api/v1/sacas', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Saca): Promise<Saca> {
    return handleResponse(
      openapiClient.PUT('/api/v1/sacas/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/sacas/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async agregarPaquetes(id: number, idPaquetes: number[]): Promise<void> {
    return handleResponse(
      openapiClient.POST('/api/v1/sacas/{id}/paquetes', {
        params: {
          path: { id },
        },
        body: { idPaquetes } as any,
      })
    ) as any
  },

  async obtenerPaquetes(id: number): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/sacas/{id}/paquetes', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async calcularPeso(id: number): Promise<Saca> {
    return handleResponse(
      openapiClient.PUT('/api/v1/sacas/{id}/calcular-peso', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<Saca[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/sacas/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
