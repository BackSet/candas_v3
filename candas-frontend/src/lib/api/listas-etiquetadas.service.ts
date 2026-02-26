import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ListasEtiquetadasBatchRequest,
  ListasEtiquetadasBatchResult,
  GuiaListaEtiquetadaConsultaDTO,
  ConsultaListasEtiquetadasResponse,
} from '@/types/listas-etiquetadas'
import type { Paquete } from '@/types/paquete'

export const listasEtiquetadasService = {
  async createBatch(request: ListasEtiquetadasBatchRequest): Promise<ListasEtiquetadasBatchResult> {
    const response = await apiClient.post<ListasEtiquetadasBatchResult>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.BATCH,
      request
    )
    return response.data
  },

  async consultarGuia(numeroGuia: string): Promise<GuiaListaEtiquetadaConsultaDTO | null> {
    try {
      const response = await apiClient.get<GuiaListaEtiquetadaConsultaDTO>(
        API_ENDPOINTS.LISTAS_ETIQUETADAS.BY_NUMERO_GUIA(numeroGuia)
      )
      return response.data
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const ax = (err as { response?: { status?: number } }).response
        if (ax?.status === 404) return null
      }
      throw err
    }
  },

  async consultarGuias(numerosGuia: string[]): Promise<ConsultaListasEtiquetadasResponse> {
    const response = await apiClient.post<ConsultaListasEtiquetadasResponse>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.CONSULTA,
      numerosGuia
    )
    return response.data
  },

  async getGuiasEnVariasListas(): Promise<GuiaListaEtiquetadaConsultaDTO[]> {
    const response = await apiClient.get<GuiaListaEtiquetadaConsultaDTO[]>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.GUIA_EN_VARIAS_LISTAS
    )
    return response.data
  },

  async elegirEtiqueta(numeroGuia: string, etiqueta: string): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.ELEGIR_ETIQUETA,
      { numeroGuia, etiqueta }
    )
    return response.data
  },

  async marcarReceptado(numeroGuia: string, idLoteRecepcion?: number): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.MARCAR_RECEPTADO,
      { numeroGuia, idLoteRecepcion }
    )
    return response.data
  },

  async getHistorialReceptados(): Promise<Paquete[]> {
    const response = await apiClient.get<Paquete[]>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.HISTORIAL_RECEPTADOS
    )
    return response.data
  },

  async findByEtiqueta(etiqueta: string): Promise<Paquete[]> {
    const response = await apiClient.get<Paquete[]>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.BY_ETIQUETA(etiqueta)
    )
    return response.data
  },

  async getAllEtiquetas(): Promise<string[]> {
    const response = await apiClient.get<string[]>(
      API_ENDPOINTS.LISTAS_ETIQUETADAS.ETIQUETAS
    )
    return response.data
  },

  async exportExcel(etiqueta?: string): Promise<Blob> {
    const params = etiqueta != null && etiqueta.trim() !== '' ? { etiqueta: etiqueta.trim() } : {}
    const response = await apiClient.get(API_ENDPOINTS.LISTAS_ETIQUETADAS.EXPORT, {
      params,
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
