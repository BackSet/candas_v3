import type { AgenciaDistribucion, AgenciaDistribucionPage } from '@/types/agencia-distribucion'
import { openapiClient, handleResponse } from './openapi-client'

export const agenciaDistribucionService = {
  async findAll(page: number = 0, size: number = 20): Promise<AgenciaDistribucionPage> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/agencias-distribucion', {
        params: { query: { page, size } },
      })
    )
  },

  async findById(id: number): Promise<AgenciaDistribucion> {
    return handleResponse(
      (openapiClient as any).GET(`/api/v1/agencias-distribucion/${id}`)
    )
  },

  async create(agencia: AgenciaDistribucion): Promise<AgenciaDistribucion> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/agencias-distribucion', {
        body: agencia,
      })
    )
  },

  async update(id: number, agencia: AgenciaDistribucion): Promise<AgenciaDistribucion> {
    return handleResponse(
      (openapiClient as any).PUT(`/api/v1/agencias-distribucion/${id}`, {
        body: agencia,
      })
    )
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      (openapiClient as any).DELETE(`/api/v1/agencias-distribucion/${id}`)
    )
  },

  async buscarOCrear(nombre?: string, codigo?: string): Promise<AgenciaDistribucion> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/agencias-distribucion/buscar-o-crear', {
        params: {
          query: { nombre, codigo },
        },
      })
    )
  },
}
