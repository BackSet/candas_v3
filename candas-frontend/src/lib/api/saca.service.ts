import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Saca, SacaPage } from '@/types/saca'
import type { Paquete } from '@/types/paquete'

export interface SacaFindAllParams {
  page?: number
  size?: number
  search?: string
  idDespacho?: number
  tamano?: string
}

export const sacaService = {
  async findAll(params: SacaFindAllParams = {}): Promise<SacaPage> {
    const { page = 0, size = 20, search, idDespacho, tamano } = params
    const query: Record<string, string | number> = { page, size }
    if (search?.trim()) query.search = search.trim()
    if (idDespacho != null) query.idDespacho = idDespacho
    if (tamano && tamano !== 'all') query.tamano = tamano
    const response = await apiClient.get<SacaPage>(
      API_ENDPOINTS.SACAS.BASE,
      { params: query }
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
