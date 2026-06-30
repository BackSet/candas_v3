import type { ClienteEnvioDirecto } from '@/types/cliente-envio-directo'
import { openapiClient, handleResponse } from './openapi-client'

export const clienteEnvioDirectoService = {
  async getAll(): Promise<ClienteEnvioDirecto[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/clientes-envio-directo')
    ) as any
  },

  async findById(id: number): Promise<ClienteEnvioDirecto> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/clientes-envio-directo/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async findByCodigo(codigo: string): Promise<ClienteEnvioDirecto[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/clientes-envio-directo/buscar-codigo', {
        params: {
          query: { codigo },
        },
      })
    ) as any
  },

  async create(dto: ClienteEnvioDirecto): Promise<ClienteEnvioDirecto> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/clientes-envio-directo', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: ClienteEnvioDirecto): Promise<ClienteEnvioDirecto> {
    return handleResponse(
      (openapiClient as any).PUT('/api/v1/clientes-envio-directo/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      (openapiClient as any).DELETE('/api/v1/clientes-envio-directo/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<ClienteEnvioDirecto[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/clientes-envio-directo/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
