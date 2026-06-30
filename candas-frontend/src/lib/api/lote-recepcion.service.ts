import type { LoteRecepcion, LoteRecepcionEstadisticas, LoteRecepcionImportResult, LoteRecepcionPage } from '@/types/lote-recepcion'
import type { Paquete } from '@/types/paquete'
import { openapiClient, handleResponse } from './openapi-client'

export interface LoteRecepcionFindAllParams {
  page?: number
  size?: number
  search?: string
  tipoLote?: string
  idAgencia?: number
  fechaDesde?: string
  fechaHasta?: string
}

export const loteRecepcionService = {
  async findAll(params: LoteRecepcionFindAllParams = {}): Promise<LoteRecepcionPage> {
    const { page = 0, size = 20, search, tipoLote, idAgencia, fechaDesde, fechaHasta } = params
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion', {
        params: {
          query: {
            pageable: { page, size },
            search,
            tipoLote: tipoLote === 'all' ? undefined : tipoLote,
            idAgencia,
            fechaDesde,
            fechaHasta,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<LoteRecepcion> {
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: LoteRecepcion): Promise<LoteRecepcion> {
    return handleResponse(
      openapiClient.POST('/api/v1/lotes-recepcion', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: LoteRecepcion): Promise<LoteRecepcion> {
    return handleResponse(
      openapiClient.PUT('/api/v1/lotes-recepcion/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/lotes-recepcion/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async agregarPaquetes(id: number, idPaquetes: number[]): Promise<void> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/lotes-recepcion/{id}/paquetes', {
        params: {
          path: { id },
        },
        body: { idPaquetes },
      })
    ) as any
  },

  async obtenerPaquetes(id: number): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion/{id}/paquetes', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async importarPaquetesDesdeExcel(id: number, file: File): Promise<LoteRecepcionImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    return handleResponse(
      openapiClient.POST('/api/v1/lotes-recepcion/{id}/importar-excel', {
        params: {
          path: { id },
        },
        body: formData as any,
        bodySerializer: (body: any) => body,
      })
    ) as any
  },

  async agregarPaquetesPorNumeroGuia(id: number, numerosGuia: string[]): Promise<LoteRecepcionImportResult> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/lotes-recepcion/{id}/agregar-paquetes', {
        params: {
          path: { id },
        },
        body: { numerosGuia },
      })
    ) as any
  },

  async obtenerEstadisticas(id: number): Promise<LoteRecepcionEstadisticas> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/lotes-recepcion/{id}/estadisticas', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async search(query: string): Promise<LoteRecepcion[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },

  async findAllEspeciales(
    params: Omit<LoteRecepcionFindAllParams, 'tipoLote'> = {}
  ): Promise<LoteRecepcionPage> {
    return loteRecepcionService.findAll({ ...params, tipoLote: 'ESPECIAL' })
  },

  async searchEspeciales(query: string): Promise<LoteRecepcion[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/lotes-recepcion/especiales/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },

  async agregarListasEspeciales(
    id: number,
    body: { etiqueta: string; numerosGuia: string[]; instruccion?: string }
  ): Promise<import('@/types/listas-etiquetadas').ListasEtiquetadasBatchResult> {
    return handleResponse(
      openapiClient.POST('/api/v1/lotes-recepcion/{id}/listas-especiales', {
        params: {
          path: { id },
        },
        body: body as any,
      })
    ) as any
  },

  async obtenerPaquetesNoEncontrados(id: number): Promise<import('@/types/lote-recepcion').PaqueteNoEncontrado[]> {
    return handleResponse(
      (openapiClient as any).GET(`/api/v1/lotes-recepcion/${id}/paquetes-no-encontrados`)
    ) as any
  },

  async agregarHijosClementina(idLoteRecepcion: number, idPaquetePadre: number, idPaquetesHijos: number[]): Promise<LoteRecepcionImportResult> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/lotes-recepcion/{id}/agregar-hijos-clementina', {
        params: {
          path: { id: idLoteRecepcion },
        },
        body: { idPaquetePadre, idPaquetesHijos },
      })
    ) as any
  },

  async agregarHijoClementinaPorGuia(idLoteRecepcion: number, idPaquetePadre: number, numeroGuia: string): Promise<LoteRecepcionImportResult> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/lotes-recepcion/{id}/agregar-hijo-clementina-por-guia', {
        params: {
          path: { id: idLoteRecepcion },
        },
        body: { idPaquetePadre, numeroGuia },
      })
    ) as any
  },
}
