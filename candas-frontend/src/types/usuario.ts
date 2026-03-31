import type { PageResponse } from './paquete'

export interface Usuario {
  idUsuario?: number
  username: string
  email: string
  password?: string
  nombreCompleto: string
  activo?: boolean
  cuentaNoExpirada?: boolean
  cuentaNoBloqueada?: boolean
  credencialesNoExpiradas?: boolean
  fechaRegistro?: string
  ultimoAcceso?: string
  idCliente?: number
  idAgencia?: number
  idAgencias?: number[]
  roles?: number[]
}

export type UsuarioPage = PageResponse<Usuario>
