import type { Paquete } from '@/types/paquete'
import type { Recepcion, RecepcionEstadisticas, RecepcionImportResult, RecepcionPage } from '@/types/recepcion'
import { openapiClient, handleResponse } from './openapi-client'

export const recepcionService = {
  async findAll(page: number = 0, size: number = 20): Promise<RecepcionPage> {
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion', {
        params: {
          query: {
            pageable: { page, size },
          },
        },
      })
    ) as any
  },

  async findById(id: number): Promise<Recepcion> {
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async create(dto: Recepcion): Promise<Recepcion> {
    return handleResponse(
      openapiClient.POST('/api/v1/lotes-recepcion', {
        body: dto as any,
      })
    ) as any
  },

  async update(id: number, dto: Recepcion): Promise<Recepcion> {
    return handleResponse(
      openapiClient.PUT('/api/v1/lotes-recepcion/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/lotes-recepcion/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async agregarPaquetes(id: number, idPaquetes: number[]): Promise<void> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/lotes-recepcion/{id}/paquetes', {
        params: {
          path: { id },
        },
        body: { idPaquetes },
      })
    ) as any
  },

  async obtenerPaquetes(id: number): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.GET('/api/v1/lotes-recepcion/{id}/paquetes', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  async importarPaquetesDesdeExcel(id: number, file: File): Promise<RecepcionImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    return handleResponse(
      openapiClient.POST('/api/v1/lotes-recepcion/{id}/importar-excel', {
        params: {
          path: { id },
        },
        body: formData as any,
        bodySerializer: (body: any) => body, // Envía FormData directamente
      })
    ) as any
  },

  async agregarPaquetesPorNumeroGuia(id: number, numerosGuia: string[]): Promise<RecepcionImportResult> {
    return handleResponse(
      (openapiClient as any).POST('/api/v1/lotes-recepcion/{id}/agregar-paquetes', {
        params: {
          path: { id },
        },
        body: { numerosGuia },
      })
    ) as any
  },

  async obtenerEstadisticas(id: number): Promise<RecepcionEstadisticas> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/lotes-recepcion/{id}/estadisticas', {
        params: {
          path: { id },
        },
      })
    ) as any
  },
}
