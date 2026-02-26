import type { PageResponse } from './paquete'

export enum TamanoSaca {
  INDIVIDUAL = 'INDIVIDUAL',
  PEQUENO = 'PEQUENO',
  MEDIANO = 'MEDIANO',
  GRANDE = 'GRANDE',
}

/** Capacidad máxima en kg por tamaño de saca (según especificación: Pequeña 30, Mediana 40, Grande 50; Individual/otros 15). */
export const CAPACIDADES_SACA_KG: Record<TamanoSaca, number> = {
  [TamanoSaca.INDIVIDUAL]: 15,
  [TamanoSaca.PEQUENO]: 30,
  [TamanoSaca.MEDIANO]: 40,
  [TamanoSaca.GRANDE]: 50,
}

export interface Saca {
  idSaca?: number
  codigoQr?: string // Se genera automáticamente (ID de la saca)
  numeroOrden?: number // Se genera automáticamente
  tamano: TamanoSaca
  pesoTotal?: number
  idDespacho?: number
  numeroManifiesto?: string // Número de manifiesto del despacho para mostrar en listas
  fechaCreacion?: string
  fechaEnsacado?: string
  idPaquetes?: number[] // Para asignar paquetes al crear la saca
}

export type SacaPage = PageResponse<Saca>
