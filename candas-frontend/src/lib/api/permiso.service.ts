import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Permiso, PermisoPage } from '@/types/permiso'

export const permisoService = {
  async findAll(page: number = 0, size: number = 20): Promise<PermisoPage> {
    const response = await apiClient.get<PermisoPage>(
      API_ENDPOINTS.PERMISOS.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<Permiso> {
    const response = await apiClient.get<Permiso>(
      API_ENDPOINTS.PERMISOS.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Permiso): Promise<Permiso> {
    const response = await apiClient.post<Permiso>(
      API_ENDPOINTS.PERMISOS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Permiso): Promise<Permiso> {
    const response = await apiClient.put<Permiso>(
      API_ENDPOINTS.PERMISOS.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PERMISOS.BY_ID(id))
  },

  async search(query: string): Promise<Permiso[]> {
    const response = await apiClient.get<Permiso[]>(
      API_ENDPOINTS.PERMISOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
