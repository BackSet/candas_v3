import type {
  CrearManifiestoConsolidadoDTO,
  ManifiestoConsolidadoDetalle,
  ManifiestoConsolidadoPage,
  ManifiestoConsolidadoResumen,
} from '@/types/manifiesto-consolidado'
import { openapiClient, handleResponse } from './openapi-client'

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
    return handleResponse(
      openapiClient.POST('/api/v1/manifiestos-consolidados', {
        body: dto as any,
      })
    ) as any
  },

  async findAll(params: ManifiestoConsolidadoFindAllParams = {}): Promise<ManifiestoConsolidadoPage> {
    const { page = 0, size = 20, search, idAgencia, mes, anio } = params
    return handleResponse(
      openapiClient.GET('/api/v1/manifiestos-consolidados', {
        params: {
          query: {
            pageable: { page, size },
            search,
            idAgencia,
            mes,
            anio,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<ManifiestoConsolidadoDetalle> {
    return handleResponse(
      openapiClient.GET('/api/v1/manifiestos-consolidados/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/manifiestos-consolidados/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<ManifiestoConsolidadoResumen[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/manifiestos-consolidados/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
