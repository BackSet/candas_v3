import type {
  CrearManifiestoPagoDTO,
  ManifiestoPagoDetalle,
  ManifiestoPagoPage,
  ManifiestoPagoResumen,
} from '@/types/manifiesto-pago'
import { openapiClient, handleResponse } from './openapi-client'

export const manifiestoPagoService = {
  async crearManifiestoPago(dto: CrearManifiestoPagoDTO): Promise<ManifiestoPagoResumen> {
    return handleResponse(
      openapiClient.POST('/api/v1/manifiestos-consolidados', {
        body: dto as any,
      })
    ) as Promise<any>
  },

  async findAll(page: number = 0, size: number = 20): Promise<ManifiestoPagoPage> {
    return handleResponse(
      openapiClient.GET('/api/v1/manifiestos-consolidados', {
        params: {
          query: {
            pageable: { page, size },
          },
        },
      })
    ) as Promise<any>
  },

  async findById(id: number): Promise<ManifiestoPagoDetalle> {
    return handleResponse(
      openapiClient.GET('/api/v1/manifiestos-consolidados/{id}', {
        params: {
          path: { id },
        },
      })
    ) as Promise<any>
  },

  async findByAgencia(idAgencia: number, page: number = 0, size: number = 20): Promise<ManifiestoPagoPage> {
    return handleResponse(
      (openapiClient as any).GET(`/api/v1/manifiestos-consolidados/agencia/${idAgencia}`, {
        params: {
          query: { page, size },
        },
      })
    )
  },
}
