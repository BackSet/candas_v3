import type { DestinatarioDirecto, DestinatarioDirectoPage } from '@/types/destinatario-directo'
import { openapiClient, handleResponse } from './openapi-client'

export interface DestinatarioDirectoFindAllParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

export const destinatarioDirectoService = {
  async findAll(params: DestinatarioDirectoFindAllParams = {}): Promise<DestinatarioDirectoPage> {
    const { page = 0, size = 20, search, activo } = params
    return handleResponse(
      openapiClient.GET('/api/v1/destinatarios-directos', {
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

  async findAllNoPaginado(): Promise<DestinatarioDirecto[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/destinatarios-directos/no-paginado')
    ) as any
  },

  async findById(id: number): Promise<DestinatarioDirecto> {
    return handleResponse(
      openapiClient.GET('/api/v1/destinatarios-directos/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: DestinatarioDirecto): Promise<DestinatarioDirecto> {
    return handleResponse(
      openapiClient.POST('/api/v1/destinatarios-directos', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: DestinatarioDirecto): Promise<DestinatarioDirecto> {
    return handleResponse(
      openapiClient.PUT('/api/v1/destinatarios-directos/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/destinatarios-directos/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<DestinatarioDirecto[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/destinatarios-directos/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
