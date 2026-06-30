import type { Agencia, AgenciaPage } from '@/types/agencia'
import { openapiClient, handleResponse } from './openapi-client'

export type { Agencia, AgenciaPage } from '@/types/agencia'

export interface AgenciaFindAllParams {
  page?: number
  size?: number
  search?: string
  nombre?: string
  codigo?: string
  activa?: boolean
}

export const agenciaService = {
  async findAll(params: AgenciaFindAllParams = {}): Promise<AgenciaPage> {
    const { page = 0, size = 20, search, nombre, codigo, activa } = params
    return handleResponse(
      openapiClient.GET('/api/v1/agencias', {
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

  async findById(id: number): Promise<Agencia> {
    return handleResponse(
      openapiClient.GET('/api/v1/agencias/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Agencia): Promise<Agencia> {
    return handleResponse(
      openapiClient.POST('/api/v1/agencias', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Agencia): Promise<Agencia> {
    return handleResponse(
      openapiClient.PUT('/api/v1/agencias/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/agencias/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<Agencia[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/agencias/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
