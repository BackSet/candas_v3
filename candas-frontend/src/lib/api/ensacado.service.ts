import type {
  DespachoEnsacadoInfo,
  EnsacadoSessionResponse,
  PaqueteEnsacadoInfo,
} from '@/types/ensacado'
import { openapiClient, handleResponse } from './openapi-client'

export const ensacadoService = {
  async buscarPaquete(numeroGuia: string): Promise<PaqueteEnsacadoInfo> {
    return handleResponse(
      (openapiClient as any).GET(`/api/v1/ensacado/buscar-paquete/${encodeURIComponent(numeroGuia)}`)
    )
  },

  async marcarEnsacado(idPaquete: number): Promise<void> {
    return handleResponse(
      openapiClient.POST('/api/v1/ensacado/marcar-ensacado/{idPaquete}', {
        params: {
          path: { idPaquete },
        },
      })
    )
  },

  async desmarcarEnsacado(idPaquete: number): Promise<void> {
    return handleResponse(
      openapiClient.POST('/api/v1/ensacado/desmarcar-ensacado/{idPaquete}', {
        params: {
          path: { idPaquete },
        },
      })
    )
  },

  async obtenerInfoDespacho(idDespacho: number): Promise<DespachoEnsacadoInfo> {
    return handleResponse(
      (openapiClient as any).GET(`/api/v1/ensacado/despacho/${idDespacho}/info`)
    )
  },

  async getSession(): Promise<EnsacadoSessionResponse> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/ensacado/session')
    )
  },

  async actualizarUltimaBusqueda(numeroGuia: string): Promise<void> {
    return handleResponse(
      openapiClient.POST('/api/v1/ensacado/session/ultima-busqueda', {
        body: { numeroGuia } as any,
      })
    )
  },
}
