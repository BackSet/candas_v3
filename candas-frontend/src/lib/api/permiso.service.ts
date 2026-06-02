import type { Permiso,PermisoPage } from '@/types/permiso'
import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'

export interface PermisoListParams {
  page?: number
  size?: number
  search?: string
  recurso?: string
  accion?: string
}

export const permisoService = {
  async findAll(params: PermisoListParams = {}): Promise<PermisoPage> {
    const { page = 0, size = 20, search, recurso, accion } = params
    const query: Record<string, string | number> = { page, size }
    if (search && search.trim()) query.search = search.trim()
    if (recurso && recurso.trim()) query.recurso = recurso.trim()
    if (accion && accion.trim()) query.accion = accion.trim()
    const response = await apiClient.get<PermisoPage>(
      API_ENDPOINTS.PERMISOS.BASE,
      { params: query }
    )
    return response.data
  },

  async findById(id: number): Promise<Permiso> {
    const response = await apiClient.get<Permiso>(
      API_ENDPOINTS.PERMISOS.BY_ID(id)
    )
    return response.data
  },

  /** Solo renombra el permiso; recurso/acción se gestionan en código backend. */
  async updateNombre(id: number, dto: Pick<Permiso, 'nombre'>): Promise<Permiso> {
    const response = await apiClient.put<Permiso>(
      API_ENDPOINTS.PERMISOS.BY_ID(id),
      dto
    )
    return response.data
  },

  async search(query: string): Promise<Permiso[]> {
    const response = await apiClient.get<Permiso[]>(
      API_ENDPOINTS.PERMISOS.SEARCH,
      {
        params: { query },
      }
    )
    return response.data
  },
}
