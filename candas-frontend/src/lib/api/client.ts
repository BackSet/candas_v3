import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

/**
 * Desarrollo / preview de Vite: permite LAN (`hostname:8080`) o `localhost:8080`.
 * Producción (`vite build`): solo `VITE_API_BASE_URL` (URL completa del backend, sin inferir puerto).
 */
function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()

  if (import.meta.env.PROD) {
    if (!fromEnv) {
      throw new Error(
        'VITE_API_BASE_URL es obligatoria en producción. Defínela en el build (ej. https://api.tudominio.com).'
      )
    }
    return fromEnv.replace(/\/$/, '')
  }

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  const isLanMode = import.meta.env.VITE_NETWORK_MODE === 'lan'
  if (typeof window !== 'undefined' && isLanMode) {
    return `http://${window.location.hostname}:8080`
  }
  return 'http://localhost:8080'
}

const API_BASE_URL = resolveApiBaseUrl()

export { API_BASE_URL }

// Crear instancia de Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token JWT a las peticiones
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token, activeAgencyId } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (activeAgencyId != null) {
      config.headers['X-Agencia-Origen-Activa-Id'] = String(activeAgencyId)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores 401 (no autorizado)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - limpiar auth y redirigir a login
      useAuthStore.getState().logout()
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
