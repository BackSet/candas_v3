import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Distribuidor, DistribuidorPage } from '@/types/distribuidor'

export const distribuidorService = {
  async findAll(page: number = 0, size: number = 20): Promise<DistribuidorPage> {
    const response = await apiClient.get(API_ENDPOINTS.DISTRIBUIDORES.BASE, {
      params: { page, size },
    })
    return response.data
  },

  async findById(id: number): Promise<Distribuidor> {
    const response = await apiClient.get(API_ENDPOINTS.DISTRIBUIDORES.BY_ID(id))
    return response.data
  },

  async create(distribuidor: Distribuidor): Promise<Distribuidor> {
    const response = await apiClient.post(API_ENDPOINTS.DISTRIBUIDORES.BASE, distribuidor)
    return response.data
  },

  async update(id: number, distribuidor: Distribuidor): Promise<Distribuidor> {
    const response = await apiClient.put(API_ENDPOINTS.DISTRIBUIDORES.BY_ID(id), distribuidor)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DISTRIBUIDORES.BY_ID(id))
  },

  async buscarOCrear(nombre?: string, codigo?: string): Promise<Distribuidor> {
    const params = new URLSearchParams()
    if (nombre) params.append('nombre', nombre)
    if (codigo) params.append('codigo', codigo)
    const response = await apiClient.post(`${API_ENDPOINTS.DISTRIBUIDORES.BASE}/buscar-o-crear?${params.toString()}`)
    return response.data
  },

  async search(query: string): Promise<Distribuidor[]> {
    const response = await apiClient.get<Distribuidor[]>(
      API_ENDPOINTS.DISTRIBUIDORES.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
