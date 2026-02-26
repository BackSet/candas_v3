export interface User {
  idUsuario: number
  username: string
  email: string
  nombreCompleto: string
  roles: string[]
  permisos?: string[]
  activo?: boolean
  idAgencia?: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  nombreCompleto: string
  password: string
  idCliente?: number
  roles?: number[]
}

export interface LoginResponse {
  token: string
  type: string
  idUsuario: number
  username: string
  email: string
  nombreCompleto: string
  roles: string[]
  permisos?: string[]
  idAgencia?: number
}
