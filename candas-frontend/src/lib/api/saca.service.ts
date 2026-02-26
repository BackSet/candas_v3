import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Saca, SacaPage } from '@/types/saca'
import type { Paquete } from '@/types/paquete'

export const sacaService = {
  async findAll(page: number = 0, size: number = 20): Promise<SacaPage> {
    const response = await apiClient.get<SacaPage>(
      API_ENDPOINTS.SACAS.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<Saca> {
    const response = await apiClient.get<Saca>(
      API_ENDPOINTS.SACAS.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Saca): Promise<Saca> {
    const response = await apiClient.post<Saca>(
      API_ENDPOINTS.SACAS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Saca): Promise<Saca> {
    const response = await apiClient.put<Saca>(
      API_ENDPOINTS.SACAS.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SACAS.BY_ID(id))
  },

  async agregarPaquetes(id: number, idPaquetes: number[]): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.SACAS.BY_ID(id)}/paquetes`,
      { idPaquetes }
    )
  },

  async obtenerPaquetes(id: number): Promise<Paquete[]> {
    const response = await apiClient.get<Paquete[]>(
      `${API_ENDPOINTS.SACAS.BY_ID(id)}/paquetes`
    )
    return response.data
  },

  async calcularPeso(id: number): Promise<Saca> {
    const response = await apiClient.put<Saca>(
      `${API_ENDPOINTS.SACAS.BY_ID(id)}/calcular-peso`
    )
    return response.data
  },

  async search(query: string): Promise<Saca[]> {
    const response = await apiClient.get<Saca[]>(
      API_ENDPOINTS.SACAS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
