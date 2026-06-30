import type { Despacho, DespachoPage } from '@/types/despacho'
import type { Saca } from '@/types/saca'
import { openapiClient, handleResponse } from './openapi-client'

export type TipoDestinoDespacho = 'all' | 'agencia' | 'directo'

export const despachoService = {
  async findAll(
    params: {
      page?: number
      size?: number
      tipoDestino?: TipoDestinoDespacho
      fechaDesde?: string
      fechaHasta?: string
      search?: string
    } = {}
  ): Promise<DespachoPage> {
    const { page = 0, size = 20, tipoDestino = 'all', fechaDesde, fechaHasta, search } = params
    return handleResponse(
      openapiClient.GET('/api/v1/despachos', {
        params: {
          query: {
            pageable: { page, size },
            tipoDestino: tipoDestino === 'all' ? undefined : (tipoDestino === 'agencia' ? 'AGENCIA' : 'DIRECTO'),
            fechaDesde,
            fechaHasta,
            search,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Despacho> {
    return handleResponse(
      openapiClient.GET('/api/v1/despachos/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Despacho): Promise<Despacho> {
    return handleResponse(
      openapiClient.POST('/api/v1/despachos', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Despacho): Promise<Despacho> {
    return handleResponse(
      openapiClient.PUT('/api/v1/despachos/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/despachos/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async agregarSacas(id: number, idSacas: number[]): Promise<void> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/despachos/{id}/sacas', {
        params: {
          path: { id },
        },
        body: { idSacas },
      })
    ) as any
  },

  async agregarCadenitaAlDespacho(idDespacho: number, numeroGuiaPadre: string): Promise<Saca> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/despachos/{id}/agregar-cadenita', {
        params: {
          path: { id: idDespacho },
        },
        body: { numeroGuiaPadre: numeroGuiaPadre.trim().toUpperCase() },
      })
    ) as any
  },

  async obtenerSacas(id: number): Promise<Saca[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/despachos/{id}/sacas', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<Despacho[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/despachos/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },

  async findByPeriodo(fechaDesde: string, fechaHasta: string): Promise<Despacho[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/despachos/por-periodo', {
        params: {
          query: { fechaDesde, fechaHasta },
        },
      })
    ) as any
  },

  async marcarComoDespachado(id: number): Promise<number> {
    const result = await handleResponse(
      (openapiClient as any).POST('/api/v1/despachos/{id}/marcar-despachado', {
        params: {
          path: { id },
        },
      })
    ) as any
    return result.paquetesMarcados
  },

  async marcarComoDespachadoBatch(ids: number[]): Promise<number> {
    const result = await handleResponse(
      (openapiClient as any).POST('/api/v1/despachos/acciones/marcar-despachado', {
        body: { ids },
      })
    ) as any
    return result.paquetesMarcados
  },
}
