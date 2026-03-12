import type { PageResponse } from './paquete'

export interface Cliente {
  idCliente?: number
  nombreCompleto: string
  documentoIdentidad?: string
  email?: string
  pais?: string
  provincia?: string
  canton?: string
  direccion?: string
  telefono?: string
  fechaRegistro?: string
  activo?: boolean
}

export type ClientePage = PageResponse<Cliente>
