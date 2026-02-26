import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Despacho, DespachoPage } from '@/types/despacho'
import type { Saca } from '@/types/saca'

export type TipoDestinoDespacho = 'all' | 'agencia' | 'directo'

export const despachoService = {
  async findAll(
    page: number = 0,
    size: number = 20,
    tipoDestino: TipoDestinoDespacho = 'all',
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<DespachoPage> {
    const params: Record<string, string | number> = { page, size }
    if (tipoDestino && tipoDestino !== 'all') {
      params.tipoDestino = tipoDestino === 'agencia' ? 'AGENCIA' : 'DIRECTO'
    }
    if (fechaDesde) params.fechaDesde = fechaDesde
    if (fechaHasta) params.fechaHasta = fechaHasta
    const response = await apiClient.get<DespachoPage>(
      API_ENDPOINTS.DESPACHOS.BASE,
      { params }
    )
    return response.data
  },

  async findById(id: number): Promise<Despacho> {
    const response = await apiClient.get<Despacho>(
      API_ENDPOINTS.DESPACHOS.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Despacho): Promise<Despacho> {
    const response = await apiClient.post<Despacho>(
      API_ENDPOINTS.DESPACHOS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Despacho): Promise<Despacho> {
    const response = await apiClient.put<Despacho>(
      API_ENDPOINTS.DESPACHOS.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DESPACHOS.BY_ID(id))
  },

  async agregarSacas(id: number, idSacas: number[]): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.DESPACHOS.BY_ID(id)}/sacas`,
      { idSacas }
    )
  },

  async agregarCadenitaAlDespacho(idDespacho: number, numeroGuiaPadre: string): Promise<Saca> {
    const response = await apiClient.post<Saca>(
      `${API_ENDPOINTS.DESPACHOS.BY_ID(idDespacho)}/agregar-cadenita`,
      { numeroGuiaPadre: numeroGuiaPadre.trim().toUpperCase() }
    )
    return response.data
  },

  async obtenerSacas(id: number): Promise<Saca[]> {
    const response = await apiClient.get<Saca[]>(
      `${API_ENDPOINTS.DESPACHOS.BY_ID(id)}/sacas`
    )
    return response.data
  },

  async search(query: string): Promise<Despacho[]> {
    const response = await apiClient.get<Despacho[]>(
      API_ENDPOINTS.DESPACHOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },

  async findByPeriodo(fechaDesde: string, fechaHasta: string): Promise<Despacho[]> {
    const response = await apiClient.get<Despacho[]>(
      API_ENDPOINTS.DESPACHOS.POR_PERIODO,
      {
        params: { fechaDesde, fechaHasta },
      }
    )
    return response.data
  },

  async marcarComoDespachado(id: number): Promise<number> {
    const response = await apiClient.post<{ paquetesMarcados: number }>(
      `${API_ENDPOINTS.DESPACHOS.BY_ID(id)}/marcar-despachado`
    )
    return response.data.paquetesMarcados
  },

  async marcarComoDespachadoBatch(ids: number[]): Promise<number> {
    const response = await apiClient.post<{ paquetesMarcados: number }>(
      API_ENDPOINTS.DESPACHOS.MARCAR_DESPACHADO_BATCH,
      { ids }
    )
    return response.data.paquetesMarcados
  },
}
