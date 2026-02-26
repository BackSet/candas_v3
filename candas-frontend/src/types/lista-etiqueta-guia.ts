export type EstadoGuiaEtiqueta = 'REGISTRADO' | 'RECIBIDO' | 'ENVIADO'
export type InstruccionGuiaEtiqueta = 'NINGUNA' | 'RETENER' | 'PREGUNTAR' | 'ATENCION'

export interface ListaEtiquetaGuia {
  idListaEtiquetaGuia?: number
  numeroGuia: string
  etiqueta: string
  fechaCreacion?: string
  fechaActualizacion?: string
  activo?: boolean
  estado?: EstadoGuiaEtiqueta
  instruccion?: InstruccionGuiaEtiqueta
  fechaRecepcion?: string
  fechaEnvio?: string
  /** Solo en respuesta de create/createBatch cuando la guía está en varias listas */
  etiquetasDondeYaEstaba?: string[]
}

/** Respuesta al consultar una guía: lista de etiquetas donde aparece e instrucción (PREGUNTAR si está en varias). */
export interface ListaEtiquetaGuiaConsultaDTO {
  numeroGuia: string
  etiquetas: string[]
  instruccion?: InstruccionGuiaEtiqueta
  estado?: EstadoGuiaEtiqueta
  fechaRecepcion?: string
  fechaEnvio?: string
  idListaEtiquetaGuia?: number
}

export interface ConsultaEtiquetasResponse {
  [numeroGuia: string]: ListaEtiquetaGuiaConsultaDTO
}

export type EstadoListaEtiqueta = 'RECEPTADO' | 'RETENER'

export interface EtiquetaConEstado {
  etiqueta: string
  estado: EstadoListaEtiqueta | null
  totalGuias: number
}
