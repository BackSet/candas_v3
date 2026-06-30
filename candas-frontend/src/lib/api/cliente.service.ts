import type { Cliente, ClientePage } from '@/types/cliente'
import { openapiClient, handleResponse } from './openapi-client'

export interface ClienteFindAllParams {
  page?: number
  size?: number
  search?: string
  nombre?: string
  codigo?: string
  documento?: string
  email?: string
  activo?: boolean
}

export const clienteService = {
  async findAll(params: ClienteFindAllParams = {}): Promise<ClientePage> {
    const { page = 0, size = 20, search, nombre, codigo, documento, email, activo } = params
    return handleResponse(
      openapiClient.GET('/api/v1/clientes', {
        params: {
          query: {
            pageable: { page, size },
            search,
            nombre,
            codigo,
            documento,
            email,
            activo,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Cliente> {
    return handleResponse(
      openapiClient.GET('/api/v1/clientes/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Cliente): Promise<Cliente> {
    return handleResponse(
      openapiClient.POST('/api/v1/clientes', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Cliente): Promise<Cliente> {
    return handleResponse(
      openapiClient.PUT('/api/v1/clientes/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/clientes/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<Cliente[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/clientes/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
