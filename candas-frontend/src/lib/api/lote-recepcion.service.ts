import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { LoteRecepcion, LoteRecepcionPage, LoteRecepcionImportResult, LoteRecepcionEstadisticas } from '@/types/lote-recepcion'
import type { Paquete } from '@/types/paquete'

export const loteRecepcionService = {
  async findAll(page: number = 0, size: number = 20, tipoLote?: string): Promise<LoteRecepcionPage> {
    const params: Record<string, string | number> = { page, size }
    if (tipoLote && tipoLote !== 'all') params.tipoLote = tipoLote
    const response = await apiClient.get<LoteRecepcionPage>(
      API_ENDPOINTS.LOTES_RECEPCION.BASE,
      { params }
    )
    return response.data
  },

  async findById(id: number): Promise<LoteRecepcion> {
    const response = await apiClient.get<LoteRecepcion>(
      API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)
    )
    return response.data
  },

  async create(dto: LoteRecepcion): Promise<LoteRecepcion> {
    const response = await apiClient.post<LoteRecepcion>(
      API_ENDPOINTS.LOTES_RECEPCION.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: LoteRecepcion): Promise<LoteRecepcion> {
    const response = await apiClient.put<LoteRecepcion>(
      API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id))
  },

  async agregarPaquetes(id: number, idPaquetes: number[]): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/paquetes`,
      { idPaquetes }
    )
  },

  async obtenerPaquetes(id: number): Promise<Paquete[]> {
    const response = await apiClient.get<Paquete[]>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/paquetes`
    )
    return response.data
  },

  async importarPaquetesDesdeExcel(id: number, file: File): Promise<LoteRecepcionImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<LoteRecepcionImportResult>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/importar-excel`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async agregarPaquetesPorNumeroGuia(id: number, numerosGuia: string[]): Promise<LoteRecepcionImportResult> {
    const response = await apiClient.post<LoteRecepcionImportResult>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/agregar-paquetes`,
      { numerosGuia }
    )
    return response.data
  },

  async obtenerEstadisticas(id: number): Promise<LoteRecepcionEstadisticas> {
    const response = await apiClient.get<LoteRecepcionEstadisticas>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/estadisticas`
    )
    return response.data
  },

  async search(query: string): Promise<LoteRecepcion[]> {
    const response = await apiClient.get<LoteRecepcion[]>(
      API_ENDPOINTS.LOTES_RECEPCION.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },

  async findAllEspeciales(page: number = 0, size: number = 20): Promise<LoteRecepcionPage> {
    const response = await apiClient.get<LoteRecepcionPage>(
      API_ENDPOINTS.LOTES_RECEPCION.ESPECIALES,
      { params: { page, size } }
    )
    return response.data
  },

  async searchEspeciales(query: string): Promise<LoteRecepcion[]> {
    const response = await apiClient.get<LoteRecepcion[]>(
      API_ENDPOINTS.LOTES_RECEPCION.ESPECIALES_SEARCH,
      { params: { query } }
    )
    return response.data
  },

  async agregarListasEspeciales(
    id: number,
    body: { etiqueta: string; numerosGuia: string[]; instruccion?: string }
  ): Promise<import('@/types/listas-etiquetadas').ListasEtiquetadasBatchResult> {
    const response = await apiClient.post(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/listas-especiales`,
      body
    )
    return response.data
  },

  async obtenerPaquetesNoEncontrados(id: number): Promise<import('@/types/lote-recepcion').PaqueteNoEncontrado[]> {
    const response = await apiClient.get<import('@/types/lote-recepcion').PaqueteNoEncontrado[]>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/paquetes-no-encontrados`
    )
    return response.data
  },

  async agregarHijosClementina(idLoteRecepcion: number, idPaquetePadre: number, idPaquetesHijos: number[]): Promise<LoteRecepcionImportResult> {
    const response = await apiClient.post<LoteRecepcionImportResult>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(idLoteRecepcion)}/agregar-hijos-clementina`,
      { idPaquetePadre, idPaquetesHijos }
    )
    return response.data
  },

  async agregarHijoClementinaPorGuia(idLoteRecepcion: number, idPaquetePadre: number, numeroGuia: string): Promise<LoteRecepcionImportResult> {
    const response = await apiClient.post<LoteRecepcionImportResult>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(idLoteRecepcion)}/agregar-hijo-clementina-por-guia`,
      { idPaquetePadre, numeroGuia }
    )
    return response.data
  },
}
