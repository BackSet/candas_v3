import createClient from 'openapi-fetch'
import { useAuthStore } from '@/stores/authStore'
import { ApiFetchError } from './errors'
import type { paths } from './generated/schema'

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

export const API_BASE_URL = resolveApiBaseUrl()

/**
 * Serializador de parámetros de consulta por defecto.
 * Aplanea objetos complejos (como `pageable: { page, size }` -> `page=0&size=20`)
 * y gestiona arrays para compatibilidad con el backend de Spring Boot.
 */
export function defaultQuerySerializer(query: Record<string, any>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== undefined && subValue !== null) {
          params.append(subKey, String(subValue))
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((val) => {
        if (val !== undefined && val !== null) {
          params.append(key, String(val))
        }
      })
    } else {
      params.append(key, String(value))
    }
  }
  return params.toString()
}

// Crear el cliente tipado de openapi-fetch
export const openapiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  querySerializer: defaultQuerySerializer,
  fetch: (request: any, init?: any) => globalThis.fetch(request, init),
})

// Registrar middleware para añadir cabeceras y gestionar la respuesta
openapiClient.use({
  onRequest({ request }: any) {
    const { token, activeAgencyId } = useAuthStore.getState()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    if (activeAgencyId != null) {
      request.headers.set('X-Agencia-Origen-Activa-Id', String(activeAgencyId))
    }
    return request
  },
  onResponse({ response }: any) {
    if (response.status === 401) {
      // Token expirado o inválido - limpiar auth y redirigir a login
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return response
  },
})

/**
 * Procesa la promesa devuelta por openapi-fetch.
 * Si la respuesta contiene un error (o el status no es exitoso), lanza un ApiFetchError.
 * De lo contrario, retorna los datos tipados.
 */
export async function handleResponse<T>(
  promise: Promise<{ data?: T; error?: any; response: Response }>
): Promise<T> {
  const { data, error, response } = await promise
  if (error || !response.ok) {
    throw new ApiFetchError(response, error)
  }
  return data as T
}

export default openapiClient
