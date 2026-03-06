import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'

export interface PlantillaWhatsAppDespachoDTO {
  plantilla: string
}

export interface VariablePlantillaDespacho {
  clave: string
  descripcion: string
}

export const parametroSistemaService = {
  async getPlantillaWhatsAppDespacho(): Promise<PlantillaWhatsAppDespachoDTO> {
    const response = await apiClient.get<PlantillaWhatsAppDespachoDTO>(
      API_ENDPOINTS.PARAMETROS_SISTEMA.WHATSAPP_DESPACHO
    )
    return response.data
  },

  async guardarPlantillaWhatsAppDespacho(plantilla: string): Promise<PlantillaWhatsAppDespachoDTO> {
    const response = await apiClient.put<PlantillaWhatsAppDespachoDTO>(
      API_ENDPOINTS.PARAMETROS_SISTEMA.WHATSAPP_DESPACHO,
      { plantilla }
    )
    return response.data
  },

  async getVariablesPlantillaDespacho(): Promise<VariablePlantillaDespacho[]> {
    const response = await apiClient.get<VariablePlantillaDespacho[]>(
      API_ENDPOINTS.PARAMETROS_SISTEMA.WHATSAPP_DESPACHO_VARIABLES
    )
    return response.data
  },
}
