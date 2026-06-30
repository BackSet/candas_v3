import type { DespachoMasivoSessionPayload, DespachoMasivoSessionResponse } from '@/types/despacho-masivo-session'
import { openapiClient, handleResponse } from './openapi-client'

export const despachoMasivoSessionService = {
  async getSession(): Promise<DespachoMasivoSessionResponse> {
    return handleResponse(
      openapiClient.GET('/api/v1/despacho-masivo/session')
    ) as any
  },

  async updateSession(payload: DespachoMasivoSessionPayload | Record<string, unknown>): Promise<void> {
    return handleResponse(
      openapiClient.POST('/api/v1/despacho-masivo/session', {
        body: { payload } as any,
      })
    ) as any
  },
}
