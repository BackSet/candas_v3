import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ManifiestoPagoPage,
  ManifiestoPagoDetalle,
  ManifiestoPagoResumen,
  CrearManifiestoPagoDTO,
} from '@/types/manifiesto-pago'

export const manifiestoPagoService = {
  async crearManifiestoPago(dto: CrearManifiestoPagoDTO): Promise<ManifiestoPagoResumen> {
    const response = await apiClient.post<ManifiestoPagoResumen>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BASE,
      dto
    )
    return response.data
  },

  async findAll(page: number = 0, size: number = 20): Promise<ManifiestoPagoPage> {
    const response = await apiClient.get<ManifiestoPagoPage>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BASE,
      {
        params: { page, size },
      }
    )
    return response.data
  },

  async findById(id: number): Promise<ManifiestoPagoDetalle> {
    const response = await apiClient.get<ManifiestoPagoDetalle>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BY_ID(id)
    )
    return response.data
  },

  async findByAgencia(idAgencia: number, page: number = 0, size: number = 20): Promise<ManifiestoPagoPage> {
    const response = await apiClient.get<ManifiestoPagoPage>(
      API_ENDPOINTS.MANIFESTOS_CONSOLIDADOS.BY_AGENCIA(idAgencia),
      {
        params: { page, size },
      }
    )
    return response.data
  },
}
