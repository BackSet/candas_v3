/**
 * Tipo compatible con respuestas de error de Axios (response.data.message).
 */
export type ApiError = {
  response?: {
    status?: number
    data?: {
      message?: string
      detail?: string
      reason?: string
      error?: string
      errors?: Record<string, string>
    }
  }
}

/**
 * Extrae el mensaje de error de una respuesta API o devuelve el fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as ApiError)?.response?.data
  const validationMessage =
    data?.errors && Object.keys(data.errors).length > 0
      ? Object.entries(data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(' | ')
      : undefined
  const message = data?.message ?? data?.detail ?? data?.reason ?? validationMessage ?? data?.error
  return typeof message === 'string' && message.trim().length > 0
    ? message
    : fallback
}

export function getApiStatus(error: unknown): number | null {
  const status = (error as ApiError)?.response?.status
  return typeof status === 'number' ? status : null
}

export function getInteragencyRestrictionMessage(error: unknown): string | null {
  if (getApiStatus(error) !== 403) {
    return null
  }
  return getApiErrorMessage(
    error,
    'No tienes permiso para ver o asignar recursos de otra agencia.'
  )
}
