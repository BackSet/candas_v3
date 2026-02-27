/**
 * Tipo compatible con respuestas de error de Axios (response.data.message).
 */
export type ApiError = { response?: { data?: { message?: string } } }

/**
 * Extrae el mensaje de error de una respuesta API o devuelve el fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiError)?.response?.data?.message
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback
}
