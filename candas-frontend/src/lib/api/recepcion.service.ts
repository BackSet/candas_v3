import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Recepcion, RecepcionPage, RecepcionImportResult, RecepcionEstadisticas } from '@/types/recepcion'
import type { Paquete } from '@/types/paquete'

export const recepcionService = {
  async findAll(page: number = 0, size: number = 20): Promise<RecepcionPage> {
    const response = await apiClient.get<RecepcionPage>(
      API_ENDPOINTS.LOTES_RECEPCION.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<Recepcion> {
    const response = await apiClient.get<Recepcion>(
      API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Recepcion): Promise<Recepcion> {
    const response = await apiClient.post<Recepcion>(
      API_ENDPOINTS.LOTES_RECEPCION.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Recepcion): Promise<Recepcion> {
    const response = await apiClient.put<Recepcion>(
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

  async importarPaquetesDesdeExcel(id: number, file: File): Promise<RecepcionImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<RecepcionImportResult>(
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

  async agregarPaquetesPorNumeroGuia(id: number, numerosGuia: string[]): Promise<RecepcionImportResult> {
    const response = await apiClient.post<RecepcionImportResult>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/agregar-paquetes`,
      { numerosGuia }
    )
    return response.data
  },

  async obtenerEstadisticas(id: number): Promise<RecepcionEstadisticas> {
    const response = await apiClient.get<RecepcionEstadisticas>(
      `${API_ENDPOINTS.LOTES_RECEPCION.BY_ID(id)}/estadisticas`
    )
    return response.data
  },
}
