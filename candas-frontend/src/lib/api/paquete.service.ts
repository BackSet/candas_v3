import type {
  AsociarCadenitaLoteResult,
  AsociarClementinaLoteResult,
  EstadoPaquete,
  Paquete,
  PaquetePage,
  PaqueteSimplificado,
  TipoPaquete
} from '@/types/paquete'
import { openapiClient, handleResponse } from './openapi-client'

export interface PaqueteRapidoDTO {
  peso: number
  descripcion: string
  nombreDestinatario: string
}

export interface PaqueteFindAllParams {
  page?: number
  size?: number
  search?: string
  estado?: string
  tipo?: string
  idAgencia?: number
  idLote?: number
  fechaDesde?: string
  fechaHasta?: string
}

export const paqueteService = {
  /**
   * Crea un paquete rápido (SEPARAR)
   */
  async createRapido(dto: PaqueteRapidoDTO): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/rapido', {
        body: dto as any,
      })
    ) as any
  },

  /**
   * Lista todos los paquetes con paginación y filtros opcionales.
   */
  async findAll(params: PaqueteFindAllParams = {}): Promise<PaquetePage> {
    const {
      page = 0,
      size = 20,
      search,
      estado,
      tipo,
      idAgencia,
      idLote,
      fechaDesde,
      fechaHasta,
    } = params
    return handleResponse(
      openapiClient.GET('/api/v1/paquetes', {
        params: {
          query: {
            pageable: { page, size },
            search,
            estado: estado === 'all' ? undefined : estado,
            tipo: tipo === 'all' ? undefined : tipo,
            idAgencia,
            idLote,
            fechaDesde,
            fechaHasta,
          },
        },
      })
    ) as any
  },

  /**
   * Obtiene un paquete por ID
   */
  async findById(id: number): Promise<Paquete> {
    return handleResponse(
      openapiClient.GET('/api/v1/paquetes/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /**
   * Busca un paquete por número de guía
   */
  async findByNumeroGuia(numeroGuia: string): Promise<Paquete> {
    return handleResponse(
      openapiClient.GET('/api/v1/paquetes/por-guia/{numeroGuia}', {
        params: {
          path: { numeroGuia },
        },
      })
    ) as any
  },

  /**
   * Obtiene los paquetes hijos de un paquete padre
   */
  async findHijos(id: number): Promise<Paquete[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/paquetes/{id}/hijos', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /**
   * Obtiene los paquetes hijos tipo CADENITA dado el número de guía del padre
   */
  async findHijosCadenita(numeroGuiaPadre: string): Promise<Paquete[]> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/paquetes/hijos-cadenita', {
        params: {
          query: { numeroGuiaPadre },
        },
      })
    ) as any
  },

  /**
   * Crea un nuevo paquete
   */
  async create(dto: Paquete): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes', {
        body: dto as any,
      })
    ) as any
  },

  /**
   * Actualiza un paquete existente
   */
  async update(id: number, dto: Paquete): Promise<Paquete> {
    return handleResponse(
      openapiClient.PUT('/api/v1/paquetes/{id}', {
        params: {
          path: { id },
        },
        body: dto as any,
      })
    ) as any
  },

  /**
   * Separa un paquete en múltiples paquetes hijos
   */
  async separar(id: number, paquetesHijos: Paquete[]): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/{id}/separar', {
        params: {
          path: { id },
        },
        body: paquetesHijos as any,
      })
    ) as any
  },

  /**
   * Cambia el estado de un paquete
   */
  async cambiarEstado(id: number, nuevoEstado: EstadoPaquete): Promise<Paquete> {
    return handleResponse(
      openapiClient.PUT('/api/v1/paquetes/{id}/estado', {
        params: {
          path: { id },
        },
        body: nuevoEstado as any,
      })
    ) as any
  },

  /**
   * Cambia el tipo de múltiples paquetes a la vez
   */
  async cambiarTipoMasivo(ids: number[], nuevoTipo: TipoPaquete): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.PUT('/api/v1/paquetes/cambiar-tipo-masivo', {
        body: { ids, nuevoTipo } as any,
      })
    ) as any
  },

  /**
   * Elimina un paquete
   */
  async delete(id: number): Promise<void> {
    return handleResponse(
      openapiClient.DELETE('/api/v1/paquetes/{id}', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /**
   * Asigna paquetes hijos a un paquete padre tipo CLEMENTINA
   */
  async asignarHijosClementina(id: number, idPaquetesHijos: number[]): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/{id}/asignar-hijos-clementina', {
        params: {
          path: { id },
        },
        body: { idPaquetesHijos } as any,
      })
    ) as any
  },

  /**
   * Asigna un paquete hijo por número de guía a un paquete padre tipo CLEMENTINA
   */
  async asignarHijoPorNumeroGuia(id: number, numeroGuia: string): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/{id}/asignar-hijo-por-guia', {
        params: {
          path: { id },
        },
        body: { numeroGuia } as any,
      })
    ) as any
  },

  /**
   * Asocia múltiples paquetes hijos a paquetes CLEMENTINA padres por lotes usando números de guía
   */
  async asociarClementinaPorLote(
    asociaciones: Array<{ numeroGuiaPadre: string; numeroGuiaHijo: string }>
  ): Promise<AsociarClementinaLoteResult> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/asociar-clementina-lote', {
        body: { asociaciones } as any,
      })
    ) as any
  },

  /**
   * Asocia una lista de guías hijas a una guía padre, marcando cada hijo como tipo CADENITA
   */
  async asociarCadenitaPorLote(
    numeroGuiaPadre: string,
    numeroGuiasHijos: string[]
  ): Promise<AsociarCadenitaLoteResult> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/asociar-cadenita-lote', {
        body: { numeroGuiaPadre, numeroGuiasHijos } as any,
      })
    ) as any
  },

  /**
   * Marca que un paquete CLEMENTINA ya ha sido cambiado de etiqueta
   */
  async marcarEtiquetaCambiada(id: number): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/{id}/marcar-etiqueta-cambiada', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /**
   * Marca que un paquete SEPARAR ya ha sido separado
   */
  async marcarSeparado(id: number): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/{id}/marcar-separado', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /**
   * Marca que un paquete CADENITA ya ha sido unido en una caja
   */
  async marcarUnidoEnCaja(id: number): Promise<Paquete> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/{id}/marcar-unido-en-caja', {
        params: {
          path: { id },
        },
      })
    ) as any
  },

  /**
   * Importa paquetes desde un archivo Excel
   * El número master se lee automáticamente de la primera fila del Excel
   */
  async importarDesdeExcel(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/importar', {
        body: formData as any,
        bodySerializer: (body: any) => body,
      })
    ) as any
  },

  /**
   * Crea múltiples paquetes simplificados
   */
  async createSimplificadoBatch(dtos: PaqueteSimplificado[]): Promise<Paquete[]> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/simplificado/batch', {
        body: dtos as any,
      })
    ) as any
  },

  /**
   * Importa REF desde listas (lista de paquetes + lista de referencias por línea).
   * Cada par tiene numeroGuia y ref (null o vacío = sin REF).
   */
  async importarRefDesdeLista(
    pares: Array<{ numeroGuia: string; ref: string | null }>
  ): Promise<ImportResult> {
    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/importar-ref-lista', {
        body: pares as any,
      })
    ) as any
  },

  /**
   * FUNCIÓN TEMPORAL: Importa y actualiza paquetes desde Excel.
   * Actualiza paquetes existentes (por número de guía) o crea nuevos.
   * Elimina los clientes actuales y crea nuevos.
   * 
   * @deprecated Esta es una función temporal.
   */
  async importarYActualizarDesdeExcel(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    return handleResponse(
      openapiClient.POST('/api/v1/paquetes/importar-actualizar', {
        body: formData as any,
        bodySerializer: (body: any) => body,
      })
    ) as any
  },

  async getEstadisticas(): Promise<PaqueteEstadisticas> {
    return handleResponse(
      (openapiClient as any).GET('/api/v1/paquetes/stats')
    ) as any
  },
}

export interface ImportResult {
  totalRegistros: number
  registrosExitosos: number
  registrosFallidos: number
  errores: string[]
  paquetesCreados: Paquete[]
  paquetesNoImportados?: Array<{
    numeroGuia: string
    motivo: string
    numeroFila?: number
  }>
  numerosGuiaDuplicados?: string[]
}

export interface PaqueteEstadisticas {
  total: number
  registrados: number
  recibidos: number
  ensacados: number
  despachados: number
}
