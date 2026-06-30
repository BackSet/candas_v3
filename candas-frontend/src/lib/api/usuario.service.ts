import type { Usuario, UsuarioPage } from '@/types/usuario'
import { openapiClient, handleResponse } from './openapi-client'

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
    return handleResponse(
      openapiClient.GET('/api/v1/usuarios', {
        params: {
          query: {
            pageable: { page, size },
            search,
            username,
            email,
            activo,
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Usuario> {
    return handleResponse(
      openapiClient.GET('/api/v1/usuarios/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Usuario): Promise<Usuario> {
    return handleResponse(
      openapiClient.POST('/api/v1/usuarios', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Usuario): Promise<Usuario> {
    return handleResponse(
      openapiClient.PUT('/api/v1/usuarios/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/usuarios/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async obtenerRoles(id: number): Promise<number[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/usuarios/{id}/roles', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async asignarRoles(id: number, roles: number[]): Promise<void> {
    return handleResponse(
      openapiClient.PUT('/api/v1/usuarios/{id}/roles', {
        params: {
          path: { id },
        },
        body: { roles } as any,
      })
    ) as any
  },

  async obtenerAgencias(id: number): Promise<number[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/usuarios/{id}/agencias', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async asignarAgencias(id: number, agencias: number[]): Promise<void> {
    return handleResponse(
      openapiClient.PUT('/api/v1/usuarios/{id}/agencias', {
        params: {
          path: { id },
        },
        body: { agencias } as any,
      })
    ) as any
  },

  async search(query: string): Promise<Usuario[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/usuarios/search', {
        params: {
          query: { query },
        },
      })
    ) as any
  },
}
