import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { ClienteEnvioDirecto } from '@/types/cliente-envio-directo'

export const clienteEnvioDirectoService = {
  async getAll(): Promise<ClienteEnvioDirecto[]> {
    const response = await apiClient.get<ClienteEnvioDirecto[]>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BASE
    )
    return response.data
  },

  async findById(id: number): Promise<ClienteEnvioDirecto> {
    const response = await apiClient.get<ClienteEnvioDirecto>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BY_ID(id)
    )
    return response.data
  },

  async search(query: string): Promise<ClienteEnvioDirecto[]> {
    const response = await apiClient.get<ClienteEnvioDirecto[]>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },

  async create(dto: ClienteEnvioDirecto): Promise<ClienteEnvioDirecto> {
    const response = await apiClient.post<ClienteEnvioDirecto>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: ClienteEnvioDirecto): Promise<ClienteEnvioDirecto> {
    const response = await apiClient.put<ClienteEnvioDirecto>(
      API_ENDPOINTS.DESTINATARIOS_DIRECTOS.BY_ID(id),
      dto
    )
    return response.data
  },
}
