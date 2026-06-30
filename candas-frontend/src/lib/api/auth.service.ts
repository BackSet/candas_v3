import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest, User } from '@/types/user'
import { openapiClient, handleResponse } from './openapi-client'

export const authService = {
  /**
   * Inicia sesión con username y password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await handleResponse(
      openapiClient.POST('/api/auth/login', {
        body: credentials as any,
      })
    ) as LoginResponse

    // Guardar en el store
    const { token, idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias } = data
    useAuthStore.getState().setAuth(
      {
        idUsuario,
        username,
        email,
        nombreCompleto,
        roles,
        permisos,
        idAgencia,
        idAgencias,
      },
      token
    )

    return data
  },

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterRequest) {
    return handleResponse(
      openapiClient.POST('/api/auth/register', {
        body: data as any,
      })
    )
  },

  /**
   * Obtiene el usuario actual (roles/permisos) sin relogin
   */
  async me(): Promise<User> {
    const data = await handleResponse(
      openapiClient.GET('/api/auth/me')
    ) as LoginResponse
    const { idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias } = data
    return { idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias }
  },

  /**
   * Actualiza perfil del usuario autenticado y rota token.
   */
  async updateMe(data: UpdateProfileRequest): Promise<LoginResponse> {
    const responseData = await handleResponse(
      openapiClient.PUT('/api/auth/me', {
        body: data as any,
      })
    ) as LoginResponse
    const { token, idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias } = responseData
    useAuthStore.getState().setAuth(
      {
        idUsuario,
        username,
        email,
        nombreCompleto,
        roles,
        permisos,
        idAgencia,
        idAgencias,
      },
      token
    )
    return responseData
  },

  /**
   * Cierra sesión
   */
  logout() {
    useAuthStore.getState().logout()
  },
}
