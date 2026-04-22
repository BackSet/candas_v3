import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { PuntoOrigen, PuntoOrigenPage } from '@/types/punto-origen'

export type { PuntoOrigen, PuntoOrigenPage } from '@/types/punto-origen'

export interface PuntoOrigenFindAllParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

export const puntoOrigenService = {
  async findAll(params: PuntoOrigenFindAllParams = {}): Promise<PuntoOrigenPage> {
    const { page = 0, size = 20, search, activo } = params
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (search && search.trim()) queryParams.search = search.trim()
    if (activo !== undefined) queryParams.activo = activo
    const response = await apiClient.get<PuntoOrigenPage>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BASE,
      {
        params: queryParams,
      }
    )
    return response.data
  },

  async findById(id: number): Promise<PuntoOrigen> {
    const response = await apiClient.get<PuntoOrigen>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BY_ID(id)
    )
    return response.data
  },

  async create(dto: PuntoOrigen): Promise<PuntoOrigen> {
    const response = await apiClient.post<PuntoOrigen>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: PuntoOrigen): Promise<PuntoOrigen> {
    const response = await apiClient.put<PuntoOrigen>(
      API_ENDPOINTS.PUNTOS_ORIGEN.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PUNTOS_ORIGEN.BY_ID(id))
  },

  async search(query: string): Promise<PuntoOrigen[]> {
    const response = await apiClient.get<PuntoOrigen[]>(
      API_ENDPOINTS.PUNTOS_ORIGEN.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
