import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { DespachoMasivoSessionPayload, DespachoMasivoSessionResponse } from '@/types/despacho-masivo-session'

export const despachoMasivoSessionService = {
  async getSession(): Promise<DespachoMasivoSessionResponse> {
    const response = await apiClient.get<DespachoMasivoSessionResponse>(API_ENDPOINTS.DESPACHO_MASIVO.SESSION)
    return response.data
  },

  async updateSession(payload: DespachoMasivoSessionPayload | Record<string, unknown>): Promise<void> {
    await apiClient.post(API_ENDPOINTS.DESPACHO_MASIVO.SESSION, { payload })
  },
}
