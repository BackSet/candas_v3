import { apiClient } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  Paquete,
  PaquetePage,
  EstadoPaquete,
  TipoPaquete,
  PaqueteSimplificado,
  AsociarClementinaLoteResult,
  AsociarCadenitaLoteResult
} from '@/types/paquete'

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
    const response = await apiClient.post<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BASE}/rapido`,
      dto
    )
    return response.data
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
    const query: Record<string, string | number> = { page, size }
    if (search?.trim()) query.search = search.trim()
    if (estado && estado !== 'all') query.estado = estado
    if (tipo && tipo !== 'all') query.tipo = tipo
    if (idAgencia != null) query.idAgencia = idAgencia
    if (idLote != null) query.idLote = idLote
    if (fechaDesde) query.fechaDesde = fechaDesde
    if (fechaHasta) query.fechaHasta = fechaHasta
    const response = await apiClient.get<PaquetePage>(API_ENDPOINTS.PAQUETES.BASE, { params: query })
    return response.data
  },

  /**
   * Obtiene un paquete por ID
   */
  async findById(id: number): Promise<Paquete> {
    const response = await apiClient.get<Paquete>(
      API_ENDPOINTS.PAQUETES.BY_ID(id)
    )
    return response.data
  },

  /**
   * Busca un paquete por número de guía
   */
  async findByNumeroGuia(numeroGuia: string): Promise<Paquete> {
    const response = await apiClient.get<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BASE}/por-guia/${numeroGuia}`
    )
    return response.data
  },

  /**
   * Obtiene los paquetes hijos de un paquete padre
   */
  async findHijos(id: number): Promise<Paquete[]> {
    const response = await apiClient.get<Paquete[]>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/hijos`
    )
    return response.data
  },

  /**
   * Obtiene los paquetes hijos tipo CADENITA dado el número de guía del padre
   */
  async findHijosCadenita(numeroGuiaPadre: string): Promise<Paquete[]> {
    const response = await apiClient.get<Paquete[]>(
      `${API_ENDPOINTS.PAQUETES.BASE}/hijos-cadenita`,
      { params: { numeroGuiaPadre } }
    )
    return response.data
  },

  /**
   * Crea un nuevo paquete
   */
  async create(dto: Paquete): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      API_ENDPOINTS.PAQUETES.BASE,
      dto
    )
    return response.data
  },

  /**
   * Actualiza un paquete existente
   */
  async update(id: number, dto: Paquete): Promise<Paquete> {
    const response = await apiClient.put<Paquete>(
      API_ENDPOINTS.PAQUETES.BY_ID(id),
      dto
    )
    return response.data
  },

  /**
   * Separa un paquete en múltiples paquetes hijos
   */
  async separar(id: number, paquetesHijos: Paquete[]): Promise<Paquete[]> {
    const response = await apiClient.post<Paquete[]>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/separar`,
      paquetesHijos
    )
    return response.data
  },

  /**
   * Cambia el estado de un paquete
   */
  async cambiarEstado(id: number, nuevoEstado: EstadoPaquete): Promise<Paquete> {
    const response = await apiClient.put<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/estado`,
      nuevoEstado
    )
    return response.data
  },

  /**
   * Cambia el tipo de múltiples paquetes a la vez
   */
  async cambiarTipoMasivo(ids: number[], nuevoTipo: TipoPaquete): Promise<Paquete[]> {
    const response = await apiClient.put<Paquete[]>(
      `${API_ENDPOINTS.PAQUETES.BASE}/cambiar-tipo-masivo`,
      {
        ids,
        nuevoTipo,
      }
    )
    return response.data
  },

  /**
   * Elimina un paquete
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PAQUETES.BY_ID(id))
  },

  /**
   * Asigna paquetes hijos a un paquete padre tipo CLEMENTINA
   */
  async asignarHijosClementina(id: number, idPaquetesHijos: number[]): Promise<Paquete[]> {
    const response = await apiClient.post<Paquete[]>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/asignar-hijos-clementina`,
      { idPaquetesHijos }
    )
    return response.data
  },

  /**
   * Asigna un paquete hijo por número de guía a un paquete padre tipo CLEMENTINA
   */
  async asignarHijoPorNumeroGuia(id: number, numeroGuia: string): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/asignar-hijo-por-guia`,
      { numeroGuia }
    )
    return response.data
  },

  /**
   * Asocia múltiples paquetes hijos a paquetes CLEMENTINA padres por lotes usando números de guía
   */
  async asociarClementinaPorLote(
    asociaciones: Array<{ numeroGuiaPadre: string; numeroGuiaHijo: string }>
  ): Promise<AsociarClementinaLoteResult> {
    const response = await apiClient.post<AsociarClementinaLoteResult>(
      `${API_ENDPOINTS.PAQUETES.BASE}/asociar-clementina-lote`,
      { asociaciones }
    )
    return response.data
  },

  /**
   * Asocia una lista de guías hijas a una guía padre, marcando cada hijo como tipo CADENITA
   */
  async asociarCadenitaPorLote(
    numeroGuiaPadre: string,
    numeroGuiasHijos: string[]
  ): Promise<AsociarCadenitaLoteResult> {
    const response = await apiClient.post<AsociarCadenitaLoteResult>(
      `${API_ENDPOINTS.PAQUETES.BASE}/asociar-cadenita-lote`,
      { numeroGuiaPadre, numeroGuiasHijos }
    )
    return response.data
  },

  /**
   * Marca que un paquete CLEMENTINA ya ha sido cambiado de etiqueta
   */
  async marcarEtiquetaCambiada(id: number): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/marcar-etiqueta-cambiada`
    )
    return response.data
  },

  /**
   * Marca que un paquete SEPARAR ya ha sido separado
   */
  async marcarSeparado(id: number): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/marcar-separado`
    )
    return response.data
  },

  /**
   * Marca que un paquete CADENITA ya ha sido unido en una caja
   */
  async marcarUnidoEnCaja(id: number): Promise<Paquete> {
    const response = await apiClient.post<Paquete>(
      `${API_ENDPOINTS.PAQUETES.BY_ID(id)}/marcar-unido-en-caja`
    )
    return response.data
  },

  /**
   * Importa paquetes desde un archivo Excel
   * El número master se lee automáticamente de la primera fila del Excel
   */
  async importarDesdeExcel(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ImportResult>(
      `${API_ENDPOINTS.PAQUETES.BASE}/importar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Crea múltiples paquetes simplificados
   */
  async createSimplificadoBatch(dtos: PaqueteSimplificado[]): Promise<Paquete[]> {
    const response = await apiClient.post<Paquete[]>(
      `${API_ENDPOINTS.PAQUETES.BASE}/simplificado/batch`,
      dtos
    )
    return response.data
  },

  /**
   * Importa REF desde listas (lista de paquetes + lista de referencias por línea).
   * Cada par tiene numeroGuia y ref (null o vacío = sin REF).
   */
  async importarRefDesdeLista(
    pares: Array<{ numeroGuia: string; ref: string | null }>
  ): Promise<ImportResult> {
    const response = await apiClient.post<ImportResult>(
      `${API_ENDPOINTS.PAQUETES.BASE}/importar-ref-lista`,
      pares
    )
    return response.data
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

    const response = await apiClient.post<ImportResult>(
      `${API_ENDPOINTS.PAQUETES.BASE}/importar-actualizar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
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
