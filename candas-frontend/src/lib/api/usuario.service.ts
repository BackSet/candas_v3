import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { Usuario, UsuarioPage } from '@/types/usuario'

export const usuarioService = {
  async findAll(page: number = 0, size: number = 20): Promise<UsuarioPage> {
    const response = await apiClient.get<UsuarioPage>(
      API_ENDPOINTS.USUARIOS.BASE,
      {
        params: { page, size },
      }
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
