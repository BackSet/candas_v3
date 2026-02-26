import { apiClient } from './client'
import type { AgenciaDistribucion, AgenciaDistribucionPage } from '@/types/agencia-distribucion'

export const agenciaDistribucionService = {
  async findAll(page: number = 0, size: number = 20): Promise<AgenciaDistribucionPage> {
    const response = await apiClient.get(`/api/v1/agencias-distribucion`, {
      params: { page, size },
    })
    return response.data
  },

  async findById(id: number): Promise<AgenciaDistribucion> {
    const response = await apiClient.get(`/api/v1/agencias-distribucion/${id}`)
    return response.data
  },

  async create(agencia: AgenciaDistribucion): Promise<AgenciaDistribucion> {
    const response = await apiClient.post('/api/v1/agencias-distribucion', agencia)
    return response.data
  },

  async update(id: number, agencia: AgenciaDistribucion): Promise<AgenciaDistribucion> {
    const response = await apiClient.put(`/api/v1/agencias-distribucion/${id}`, agencia)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/agencias-distribucion/${id}`)
  },

  async buscarOCrear(nombre?: string, codigo?: string): Promise<AgenciaDistribucion> {
    const params = new URLSearchParams()
    if (nombre) params.append('nombre', nombre)
    if (codigo) params.append('codigo', codigo)
    const response = await apiClient.post(`/api/v1/agencias-distribucion/buscar-o-crear?${params.toString()}`)
    return response.data
  },
}
