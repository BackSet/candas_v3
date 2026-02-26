import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { OrigenUsa, OrigenUsaPage } from '@/types/origen-usa'

export const origenUsaService = {
  async findAll(page: number = 0, size: number = 20): Promise<OrigenUsaPage> {
    const response = await apiClient.get<OrigenUsaPage>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<OrigenUsa> {
    const response = await apiClient.get<OrigenUsa>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BY_ID(id)
    )
    return response.data
  },

  async create(dto: OrigenUsa): Promise<OrigenUsa> {
    const response = await apiClient.post<OrigenUsa>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: OrigenUsa): Promise<OrigenUsa> {
    const response = await apiClient.put<OrigenUsa>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PUNTOS_ORIGEN.BY_ID(id))
  },
}
