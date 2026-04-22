import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { DestinatarioDirecto, DestinatarioDirectoPage } from '@/types/destinatario-directo'

export interface DestinatarioDirectoFindAllParams {
  page?: number
  size?: number
  search?: string
  activo?: boolean
}

export const destinatarioDirectoService = {
  /**
   * Endpoint paginado con filtros server-side. Es el `findAll` por defecto, alineado con el
   * resto de servicios de catálogos (objeto de parámetros).
   */
  async findAll(
    params: DestinatarioDirectoFindAllParams = {}
  ): Promise<DestinatarioDirectoPage> {
    const { page = 0, size = 20, search, activo } = params
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (search && search.trim()) queryParams.search = search.trim()
    if (activo !== undefined) queryParams.activo = activo
    const response = await apiClient.get<DestinatarioDirectoPage>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BASE,
      { params: queryParams }
    )
    return response.data
  },

  /**
   * Devuelve TODOS los destinatarios sin paginar. Solo para selects/listas reducidas.
   * Usa el endpoint `/all` que se mantiene para conservar el comportamiento histórico
   * que devolvía un array plano.
   */
  async findAllNoPaginado(): Promise<DestinatarioDirecto[]> {
    const response = await apiClient.get<DestinatarioDirecto[]>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.ALL
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
