import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const isLanMode = import.meta.env.VITE_NETWORK_MODE === 'lan'
const defaultApiUrl =
  typeof window !== 'undefined' && isLanMode
    ? `http://${window.location.hostname}:9080`
    : 'http://localhost:9080'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? defaultApiUrl

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
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
