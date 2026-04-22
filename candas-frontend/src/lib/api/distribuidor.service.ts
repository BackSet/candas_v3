import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Distribuidor, DistribuidorPage } from '@/types/distribuidor'

export interface DistribuidorFindAllParams {
  page?: number
  size?: number
  search?: string
  activa?: boolean
}

export const distribuidorService = {
  async findAll(params: DistribuidorFindAllParams = {}): Promise<DistribuidorPage> {
    const { page = 0, size = 20, search, activa } = params
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (search && search.trim()) queryParams.search = search.trim()
    if (activa !== undefined) queryParams.activa = activa
    const response = await apiClient.get(API_ENDPOINTS.DISTRIBUIDORES.BASE, {
      params: queryParams,
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
