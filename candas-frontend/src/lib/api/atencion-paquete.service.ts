import type { AtencionPaquete, AtencionPaquetePage } from '@/types/atencion-paquete'
import { openapiClient, handleResponse } from './openapi-client'

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
    return handleResponse(
      openapiClient.GET('/api/v1/atenciones', {
        params: {
          query: {
            pageable: { page, size },
            estado: estado === 'all' ? undefined : estado,
            search,
            tipoProblema: tipoProblema === 'all' ? undefined : tipoProblema,
            fechaDesde,
            fechaHasta,
            idAgencia,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<AtencionPaquete> {
    return handleResponse(
      openapiClient.GET('/api/v1/atenciones/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async findPendientes(): Promise<AtencionPaquete[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/atenciones/pendientes')
    ) as any
  },

  async create(dto: AtencionPaquete): Promise<AtencionPaquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/atenciones', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: AtencionPaquete): Promise<AtencionPaquete> {
    return handleResponse(
      openapiClient.PUT('/api/v1/atenciones/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async resolver(id: number, observacionesResolucion: string): Promise<AtencionPaquete> {
    return handleResponse(
      openapiClient.PUT('/api/v1/atenciones/{id}/resolver', {
        params: {
          path: { id },
        },
        body: { observacionesResolucion } as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/atenciones/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },
}
