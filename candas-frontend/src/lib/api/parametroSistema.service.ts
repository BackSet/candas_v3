import { openapiClient, handleResponse } from './openapi-client'

export interface PlantillaWhatsAppDespachoDTO {
  plantilla: string
}

export interface VariablePlantillaDespacho {
  clave: string
  descripcion: string
}

export const parametroSistemaService = {
  async getPlantillaWhatsAppDespacho(): Promise<PlantillaWhatsAppDespachoDTO> {
    return handleResponse(
      openapiClient.GET('/api/v1/parametros-sistema/whatsapp-despacho')
    )
  },

  async guardarPlantillaWhatsAppDespacho(plantilla: string): Promise<PlantillaWhatsAppDespachoDTO> {
    return handleResponse(
      openapiClient.PUT('/api/v1/parametros-sistema/whatsapp-despacho', {
        body: { plantilla } as any,
      })
    )
  },

  async getVariablesPlantillaDespacho(): Promise<VariablePlantillaDespacho[]> {
    // Nota: Aunque no esté completamente descrito, mapea sobre /api/v1/parametros-sistema/whatsapp-despacho/variables
    return handleResponse(
      (openapiClient as any).GET('/api/v1/parametros-sistema/whatsapp-despacho/variables')
    )
  },
}
