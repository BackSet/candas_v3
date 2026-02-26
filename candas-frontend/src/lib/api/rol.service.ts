import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Rol, RolPage } from '@/types/rol'

export const rolService = {
  async findAll(page: number = 0, size: number = 20): Promise<RolPage> {
    const response = await apiClient.get<RolPage>(
      API_ENDPOINTS.ROLES.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<Rol> {
    const response = await apiClient.get<Rol>(
      API_ENDPOINTS.ROLES.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Rol): Promise<Rol> {
    const response = await apiClient.post<Rol>(
      API_ENDPOINTS.ROLES.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Rol): Promise<Rol> {
    const response = await apiClient.put<Rol>(
      API_ENDPOINTS.ROLES.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ROLES.BY_ID(id))
  },

  async obtenerPermisos(id: number): Promise<number[]> {
    const response = await apiClient.get<number[]>(
      `${API_ENDPOINTS.ROLES.BY_ID(id)}/permisos`
    )
    return response.data
  },

  async asignarPermisos(id: number, permisos: number[]): Promise<void> {
    await apiClient.put(
      `${API_ENDPOINTS.ROLES.BY_ID(id)}/permisos`,
      { permisos }
    )
  },

  async search(query: string): Promise<Rol[]> {
    const response = await apiClient.get<Rol[]>(
      API_ENDPOINTS.ROLES.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
