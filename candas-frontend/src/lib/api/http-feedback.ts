import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { isNetworkOrCorsError, getNetworkErrorHint } from './errors'

export class HttpFeedback {
  /**
   * Maneja respuestas con estado 401 Unauthorized.
   * Cierra la sesión y redirige al usuario a la página de login.
   */
  static handleUnauthorized(): void {
    const authStore = useAuthStore.getState()
    if (authStore.token != null || authStore.user != null) {
      authStore.logout()
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /**
   * Procesa cualquier error de petición y muestra el feedback visual
   * correspondiente al usuario (error de red, error 500, etc.).
   */
  static handleError(error: unknown, apiBaseUrl: string): void {
    if (isNetworkOrCorsError(error)) {
      const hint = getNetworkErrorHint(apiBaseUrl)
      toast.error('Error de conexión', {
        description: hint,
        duration: 8000,
      })
      return
    }

    const status = (error as any)?.response?.status
    if (status >= 500) {
      toast.error('Error en el servidor', {
        description: 'Ocurrió un problema inesperado en el servidor. Por favor, inténtelo de nuevo más tarde.',
      })
    }
  }
}
