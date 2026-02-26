import type { PageResponse } from './paquete'

export interface TelefonoAgencia {
  idTelefono?: number
  idAgencia?: number
  numero: string
  principal?: boolean
  fechaRegistro?: string
}

export interface Agencia {
  idAgencia?: number
  nombre: string
  codigo?: string
  direccion?: string
  email?: string
  canton?: string
  nombrePersonal?: string
  horarioAtencion?: string
  activa?: boolean
  telefonos?: TelefonoAgencia[]
}

export type AgenciaPage = PageResponse<Agencia>
