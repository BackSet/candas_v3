import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Cliente, ClientePage } from '@/types/cliente'

export type { Cliente, ClientePage } from '@/types/cliente'

export const clienteService = {
  async findAll(
    page: number = 0,
    size: number = 20,
    params?: { search?: string; nombre?: string; documento?: string; email?: string; activo?: boolean }
  ): Promise<ClientePage> {
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (params?.search) queryParams.search = params.search
    if (params?.nombre) queryParams.nombre = params.nombre
    if (params?.documento) queryParams.documento = params.documento
    if (params?.email) queryParams.email = params.email
    if (params?.activo !== undefined) queryParams.activo = params.activo
    const response = await apiClient.get<ClientePage>(
      API_ENDPOINTS.CLIENTES.BASE,
      { params: queryParams }
    )
    return response.data
  },

  async findById(id: number): Promise<Cliente> {
    const response = await apiClient.get<Cliente>(
      API_ENDPOINTS.CLIENTES.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Cliente): Promise<Cliente> {
    const response = await apiClient.post<Cliente>(
      API_ENDPOINTS.CLIENTES.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Cliente): Promise<Cliente> {
    const response = await apiClient.put<Cliente>(
      API_ENDPOINTS.CLIENTES.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CLIENTES.BY_ID(id))
  },

  async search(query: string): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>(
      API_ENDPOINTS.CLIENTES.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
