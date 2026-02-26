import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Agencia, AgenciaPage } from '@/types/agencia'

export type { Agencia, AgenciaPage } from '@/types/agencia'

export const agenciaService = {
  async findAll(
    page: number = 0,
    size: number = 20,
    params?: { search?: string; nombre?: string; codigo?: string; activa?: boolean }
  ): Promise<AgenciaPage> {
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (params?.search) queryParams.search = params.search
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.codigo) queryParams.codigo = params.codigo
    if (params?.activa !== undefined) queryParams.activa = params.activa
    const response = await apiClient.get<AgenciaPage>(
      API_ENDPOINTS.AGENCIAS.BASE,
      { params: queryParams }
    )
    return response.data
  },

  async findById(id: number): Promise<Agencia> {
    const response = await apiClient.get<Agencia>(
      API_ENDPOINTS.AGENCIAS.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Agencia): Promise<Agencia> {
    const response = await apiClient.post<Agencia>(
      API_ENDPOINTS.AGENCIAS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Agencia): Promise<Agencia> {
    const response = await apiClient.put<Agencia>(
      API_ENDPOINTS.AGENCIAS.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.AGENCIAS.BY_ID(id))
  },

  async search(query: string): Promise<Agencia[]> {
    const response = await apiClient.get<Agencia[]>(
      API_ENDPOINTS.AGENCIAS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
