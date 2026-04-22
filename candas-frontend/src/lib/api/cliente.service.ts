import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Cliente, ClientePage } from '@/types/cliente'

export type { Cliente, ClientePage } from '@/types/cliente'

export interface ClienteFindAllParams {
  page?: number
  size?: number
  search?: string
  nombre?: string
  documento?: string
  email?: string
  activo?: boolean
}

export const clienteService = {
  async findAll(params: ClienteFindAllParams = {}): Promise<ClientePage> {
    const { page = 0, size = 20, search, nombre, documento, email, activo } = params
    const queryParams: Record<string, string | number | boolean> = { page, size }
    if (search && search.trim()) queryParams.search = search.trim()
    if (nombre && nombre.trim()) queryParams.nombre = nombre.trim()
    if (documento && documento.trim()) queryParams.documento = documento.trim()
    if (email && email.trim()) queryParams.email = email.trim()
    if (activo !== undefined) queryParams.activo = activo
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
