import type {
  ConsultaListasEtiquetadasResponse,
  GuiaListaEtiquetadaConsultaDTO,
  ListasEtiquetadasBatchRequest,
  ListasEtiquetadasBatchResult,
} from '@/types/listas-etiquetadas'
import type { Paquete } from '@/types/paquete'
import { openapiClient, handleResponse } from './openapi-client'
import { ApiFetchError } from './errors'

export const listasEtiquetadasService = {
  async createBatch(request: ListasEtiquetadasBatchRequest): Promise<ListasEtiquetadasBatchResult> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/listas-etiquetadas/batch', {
        body: request as any,
      })
    ) as any
  },

  async consultarGuia(numeroGuia: string): Promise<GuiaListaEtiquetadaConsultaDTO | null> {
    try {
      return await handleResponse(
        (openapiClient as any).GET('/api/v1/paquetes/listas-etiquetadas/guia/{numeroGuia}', {
          params: {
            path: { numeroGuia },
          },
        })
      )
    } catch (err: unknown) {
      if (err instanceof ApiFetchError && err.response?.status === 404) {
        return null
      }
      throw err
    }
  },

  async consultarGuias(numerosGuia: string[]): Promise<ConsultaListasEtiquetadasResponse> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/listas-etiquetadas/consulta', {
        body: numerosGuia,
      })
    ) as any
  },

  async getGuiasEnVariasListas(): Promise<GuiaListaEtiquetadaConsultaDTO[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/paquetes/listas-etiquetadas/guias-en-varias-listas')
    ) as any
  },

  async elegirEtiqueta(numeroGuia: string, etiqueta: string): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/listas-etiquetadas/elegir-etiqueta', {
        body: { numeroGuia, etiqueta } as any,
      })
    ) as any
  },

  async marcarReceptado(numeroGuia: string, idLoteRecepcion?: number): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/listas-etiquetadas/marcar-receptado', {
        body: { numeroGuia, idLoteRecepcion } as any,
      })
    ) as any
  },

  async getHistorialReceptados(): Promise<Paquete[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/paquetes/listas-etiquetadas/historial-receptados')
    ) as any
  },

  async findByEtiqueta(etiqueta: string): Promise<Paquete[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/paquetes/listas-etiquetadas/etiqueta/{etiqueta}', {
        params: {
          path: { etiqueta },
        },
      })
    ) as any
  },

  async getAllEtiquetas(): Promise<string[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/paquetes/listas-etiquetadas/etiquetas')
    ) as any
  },

  async exportExcel(etiqueta?: string): Promise<Blob> {
    const query = etiqueta != null && etiqueta.trim() !== '' ? { etiqueta: etiqueta.trim() } : {}
    return handleResponse(
      openapiClient.GET('/api/v1/paquetes/listas-etiquetadas/export', {
        params: { query },
        parseAs: 'blob',
      })
    ) as any
  },
}
