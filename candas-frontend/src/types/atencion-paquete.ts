import type { PageResponse } from './paquete'

export enum EstadoAtencion {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  RESUELTO = 'RESUELTO',
  CANCELADO = 'CANCELADO',
}

export enum TipoProblemaAtencion {
  INSTRUCCION_RETENCION = 'INSTRUCCION_RETENCION',
  DIRECCION_INCONSISTENTE = 'DIRECCION_INCONSISTENTE',
  DESTINATARIO_NO_IDENTIFICADO = 'DESTINATARIO_NO_IDENTIFICADO',
  GUIA_REEMPLAZO = 'GUIA_REEMPLAZO',
  CONFLICTO_NOTAS = 'CONFLICTO_NOTAS',
  DATOS_ERRONEOS = 'DATOS_ERRONEOS',
  ERROR_ENVIO = 'ERROR_ENVIO',
  OTRO = 'OTRO',
}

/** Etiquetas en español para mostrar al operario en toda la UI */
export const TIPO_PROBLEMA_ATENCION_LABELS: Record<TipoProblemaAtencion, string> = {
  [TipoProblemaAtencion.INSTRUCCION_RETENCION]: 'Instrucción de retención',
  [TipoProblemaAtencion.DIRECCION_INCONSISTENTE]: 'Dirección inconsistente',
  [TipoProblemaAtencion.DESTINATARIO_NO_IDENTIFICADO]: 'Destinatario no identificado',
  [TipoProblemaAtencion.GUIA_REEMPLAZO]: 'Guía a reemplazar',
  [TipoProblemaAtencion.CONFLICTO_NOTAS]: 'Conflicto en notas',
  [TipoProblemaAtencion.DATOS_ERRONEOS]: 'Datos erróneos',
  [TipoProblemaAtencion.ERROR_ENVIO]: 'Error en envío',
  [TipoProblemaAtencion.OTRO]: 'Otro',
}

/**
 * Devuelve la etiqueta amigable para el tipo de problema.
 * Si el valor no está en el mapa (legacy o desconocido), devuelve "Otro".
 */
export function getTipoProblemaLabel(tipo: TipoProblemaAtencion | string | undefined): string {
  if (!tipo) return 'Otro'
  const label = TIPO_PROBLEMA_ATENCION_LABELS[tipo as TipoProblemaAtencion]
  return label ?? 'Otro'
}

export interface AtencionPaquete {
  idAtencion?: number
  idPaquete: number
  numeroGuia?: string // Número de guía del paquete para mostrar en listas
  motivo: string
  tipoProblema: TipoProblemaAtencion
  fechaSolicitud?: string
  fechaResolucion?: string
  estado: EstadoAtencion
  observacionesResolucion?: string
  activa?: boolean
}

export type AtencionPaquetePage = PageResponse<AtencionPaquete>
