import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  PaqueteEnsacadoInfo,
  DespachoEnsacadoInfo,
  EnsacadoSessionResponse,
} from '@/types/ensacado'

export const ensacadoService = {
  async buscarPaquete(numeroGuia: string): Promise<PaqueteEnsacadoInfo> {
    const response = await apiClient.get<PaqueteEnsacadoInfo>(
      API_ENDPOINTS.ENSACADO.BUSCAR_PAQUETE(numeroGuia)
    )
    return response.data
  },

  async marcarEnsacado(idPaquete: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ENSACADO.MARCAR_ENSACADO(idPaquete))
  },

  async obtenerInfoDespacho(idDespacho: number): Promise<DespachoEnsacadoInfo> {
    const response = await apiClient.get<DespachoEnsacadoInfo>(
      API_ENDPOINTS.ENSACADO.DESPACHO_INFO(idDespacho)
    )
    return response.data
  },

  async getSession(): Promise<EnsacadoSessionResponse> {
    const response = await apiClient.get<EnsacadoSessionResponse>(API_ENDPOINTS.ENSACADO.SESSION)
    return response.data
  },

  async actualizarUltimaBusqueda(numeroGuia: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ENSACADO.SESSION_ULTIMA_BUSQUEDA, { numeroGuia })
  },
}
