import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'

export const destinatarioDirectoService = {
  async getAll(): Promise<DestinatarioDirecto[]> {
    const response = await apiClient.get<DestinatarioDirecto[]>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BASE
    )
    return response.data
  },

  async findById(id: number): Promise<DestinatarioDirecto> {
    const response = await apiClient.get<DestinatarioDirecto>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BY_ID(id)
    )
    return response.data
  },

  async search(query: string): Promise<DestinatarioDirecto[]> {
    const response = await apiClient.get<DestinatarioDirecto[]>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },

  async create(dto: DestinatarioDirecto): Promise<DestinatarioDirecto> {
    const response = await apiClient.post<DestinatarioDirecto>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: DestinatarioDirecto): Promise<DestinatarioDirecto> {
    const response = await apiClient.put<DestinatarioDirecto>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BY_ID(id))
  },
}
