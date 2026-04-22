import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { AtencionPaquete, AtencionPaquetePage } from '@/types/atencion-paquete'

export interface AtencionPaqueteFindAllParams {
  page?: number
  size?: number
  estado?: string
  search?: string
  tipoProblema?: string
  fechaDesde?: string
  fechaHasta?: string
  idAgencia?: number
}

export const atencionPaqueteService = {
  async findAll(params: AtencionPaqueteFindAllParams = {}): Promise<AtencionPaquetePage> {
    const {
      page = 0,
      size = 20,
      estado,
      search,
      tipoProblema,
      fechaDesde,
      fechaHasta,
      idAgencia,
    } = params
    const query: Record<string, string | number> = { page, size }
    if (estado && estado !== 'all') query.estado = estado
    if (search?.trim()) query.search = search.trim()
    if (tipoProblema && tipoProblema !== 'all') query.tipoProblema = tipoProblema
    if (fechaDesde) query.fechaDesde = fechaDesde
    if (fechaHasta) query.fechaHasta = fechaHasta
    if (idAgencia != null) query.idAgencia = idAgencia
    const response = await apiClient.get<AtencionPaquetePage>(
      API_ENDPOINTS.ATENCION_PAQUETES.BASE,
      { params: query }
    )
    return response.data
  },

  async findById(id: number): Promise<AtencionPaquete> {
    const response = await apiClient.get<AtencionPaquete>(
      API_ENDPOINTS.ATENCION_PAQUETES.BY_ID(id)
    )
    return response.data
  },


  async findPendientes(): Promise<AtencionPaquete[]> {
    const response = await apiClient.get<AtencionPaquete[]>(
      `${API_ENDPOINTS.ATENCION_PAQUETES.BASE}/pendientes`
    )
    return response.data
  },

  async create(dto: AtencionPaquete): Promise<AtencionPaquete> {
    const response = await apiClient.post<AtencionPaquete>(
      API_ENDPOINTS.ATENCION_PAQUETES.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: AtencionPaquete): Promise<AtencionPaquete> {
    const response = await apiClient.put<AtencionPaquete>(
      API_ENDPOINTS.ATENCION_PAQUETES.BY_ID(id),
      dto
    )
    return response.data
  },

  async resolver(id: number, observacionesResolucion: string): Promise<AtencionPaquete> {
    const response = await apiClient.put<AtencionPaquete>(
      `${API_ENDPOINTS.ATENCION_PAQUETES.BY_ID(id)}/resolver`,
      { observacionesResolucion }
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ATENCION_PAQUETES.BY_ID(id))
  },
}
