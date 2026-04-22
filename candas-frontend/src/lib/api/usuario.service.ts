import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Usuario, UsuarioPage } from '@/types/usuario'

export interface UsuarioListParams {
  page?: number
  size?: number
  search?: string
  username?: string
  email?: string
  activo?: boolean
}

export const usuarioService = {
  async findAll(params: UsuarioListParams = {}): Promise<UsuarioPage> {
    const { page = 0, size = 20, search, username, email, activo } = params
    const query: Record<string, string | number | boolean> = { page, size }
    if (search && search.trim()) query.search = search.trim()
    if (username && username.trim()) query.username = username.trim()
    if (email && email.trim()) query.email = email.trim()
    if (typeof activo === 'boolean') query.activo = activo
    const response = await apiClient.get<UsuarioPage>(
      API_ENDPOINTS.USUARIOS.BASE,
      { params: query }
    )
    return response.data
  },

  async findById(id: number): Promise<Usuario> {
    const response = await apiClient.get<Usuario>(
      API_ENDPOINTS.USUARIOS.BY_ID(id)
    )
    return response.data
  },

  async create(dto: Usuario): Promise<Usuario> {
    const response = await apiClient.post<Usuario>(
      API_ENDPOINTS.USUARIOS.BASE,
      dto
    )
    return response.data
  },

  async update(id: number, dto: Usuario): Promise<Usuario> {
    const response = await apiClient.put<Usuario>(
      API_ENDPOINTS.USUARIOS.BY_ID(id),
      dto
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USUARIOS.BY_ID(id))
  },

  async obtenerRoles(id: number): Promise<number[]> {
    const response = await apiClient.get<number[]>(
      `${API_ENDPOINTS.USUARIOS.BY_ID(id)}/roles`
    )
    return response.data
  },

  async asignarRoles(id: number, roles: number[]): Promise<void> {
    await apiClient.put(
      `${API_ENDPOINTS.USUARIOS.BY_ID(id)}/roles`,
      { roles }
    )
  },

  async obtenerAgencias(id: number): Promise<number[]> {
    const response = await apiClient.get<number[]>(
      `${API_ENDPOINTS.USUARIOS.BY_ID(id)}/agencias`
    )
    return response.data
  },

  async asignarAgencias(id: number, agencias: number[]): Promise<void> {
    await apiClient.put(
      `${API_ENDPOINTS.USUARIOS.BY_ID(id)}/agencias`,
      { agencias }
    )
  },



  async search(query: string): Promise<Usuario[]> {
    const response = await apiClient.get<Usuario[]>(
      API_ENDPOINTS.USUARIOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
