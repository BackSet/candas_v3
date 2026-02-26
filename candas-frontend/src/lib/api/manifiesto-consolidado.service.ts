import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ManifiestoConsolidadoPage,
  ManifiestoConsolidadoDetalle,
  ManifiestoConsolidadoResumen,
  CrearManifiestoConsolidadoDTO,
} from '@/types/manifiesto-consolidado'

export const manifiestoConsolidadoService = {
  async crearManifiestoConsolidado(dto: CrearManifiestoConsolidadoDTO): Promise<ManifiestoConsolidadoResumen> {
    const response = await apiClient.post<ManifiestoConsolidadoResumen>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BASE,
      dto
    )
    return response.data
  },

  async findAll(page: number = 0, size: number = 20): Promise<ManifiestoConsolidadoPage> {
    const response = await apiClient.get<ManifiestoConsolidadoPage>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<ManifiestoConsolidadoDetalle> {
    const response = await apiClient.get<ManifiestoConsolidadoDetalle>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BY_ID(id)
    )
    return response.data
  },



  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BY_ID(id))
  },

  async search(query: string): Promise<ManifiestoConsolidadoResumen[]> {
    const response = await apiClient.get<ManifiestoConsolidadoResumen[]>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
