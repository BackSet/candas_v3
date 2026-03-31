import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest, User } from '@/types/user'
import { useAuthStore } from '@/stores/authStore'

export const authService = {
  /**
   * Inicia sesión con username y password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )
    
    // Guardar en el store
    const { token, idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias } = response.data
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
    
    return response.data
  },

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterRequest) {
    const response = await apiClient.post(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    )
    return response.data
  },

  /**
   * Obtiene el usuario actual (roles/permisos) sin relogin
   */
  async me(): Promise<User> {
    const response = await apiClient.get<LoginResponse>(API_ENDPOINTS.AUTH.ME)
    const { idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias } = response.data
    return { idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias }
  },

  /**
   * Actualiza perfil del usuario autenticado y rota token.
   */
  async updateMe(data: UpdateProfileRequest): Promise<LoginResponse> {
    const response = await apiClient.put<LoginResponse>(API_ENDPOINTS.AUTH.ME, data)
    const { token, idUsuario, username, email, nombreCompleto, roles, permisos, idAgencia, idAgencias } = response.data
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
    return response.data
  },

  /**
   * Cierra sesión
   */
  logout() {
    useAuthStore.getState().logout()
  },
}
