import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Agencia, AgenciaPage } from '@/types/agencia'

export type { Agencia, AgenciaPage } from '@/types/agencia'

export interface AgenciaFindAllParams {
  page?: number
  size?: number
  search?: string
  nombre?: string
  codigo?: string
  activa?: boolean
}

export const agenciaService = {
  async findAll(params: AgenciaFindAllParams = {}): Promise<AgenciaPage> {
    const { page = 0, size = 20, search, nombre, codigo, activa } = params
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (search && search.trim()) queryParams.search = search.trim()
    if (nombre && nombre.trim()) queryParams.nombre = nombre.trim()
    if (codigo && codigo.trim()) queryParams.codigo = codigo.trim()
    if (activa !== undefined) queryParams.activa = activa
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
