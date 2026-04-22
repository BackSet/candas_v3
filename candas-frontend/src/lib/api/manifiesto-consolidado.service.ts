import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ManifiestoConsolidadoPage,
  ManifiestoConsolidadoDetalle,
  ManifiestoConsolidadoResumen,
  CrearManifiestoConsolidadoDTO,
} from '@/types/manifiesto-consolidado'

export interface ManifiestoConsolidadoFindAllParams {
  page?: number
  size?: number
  search?: string
  idAgencia?: number
  mes?: number
  anio?: number
}

export const manifiestoConsolidadoService = {
  async crearManifiestoConsolidado(dto: CrearManifiestoConsolidadoDTO): Promise<ManifiestoConsolidadoResumen> {
    const response = await apiClient.post<ManifiestoConsolidadoResumen>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BASE,
      dto
    )
    return response.data
  },

  async findAll(params: ManifiestoConsolidadoFindAllParams = {}): Promise<ManifiestoConsolidadoPage> {
    const { page = 0, size = 20, search, idAgencia, mes, anio } = params
    const query: Record<string, string | number> = { page, size }
    if (search?.trim()) query.search = search.trim()
    if (idAgencia != null) query.idAgencia = idAgencia
    if (mes != null) query.mes = mes
    if (anio != null) query.anio = anio
    const response = await apiClient.get<ManifiestoConsolidadoPage>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BASE,
      {
        params: query,
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
