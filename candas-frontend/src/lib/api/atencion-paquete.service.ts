import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { AtencionPaquete, AtencionPaquetePage } from '@/types/atencion-paquete'

export const atencionPaqueteService = {
  async findAll(
    page: number = 0,
    size: number = 20,
    estado?: string,
    search?: string
  ): Promise<AtencionPaquetePage> {
    const params: Record<string, string | number> = { page, size }
    if (estado && estado !== 'all') params.estado = estado
    if (search?.trim()) params.search = search.trim()
    const response = await apiClient.get<AtencionPaquetePage>(
      API_ENDPOINTS.ATENCION_PAQUETES.BASE,
      { params }
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
