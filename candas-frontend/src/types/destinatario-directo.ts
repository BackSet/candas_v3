import type { PageResponse } from './paquete'

export interface DestinatarioDirecto {
  idDestinatarioDirecto?: number
  nombreDestinatario: string
  telefonoDestinatario: string
  direccionDestinatario?: string
  provincia?: string
  canton?: string
  codigo?: string
  nombreEmpresa?: string
  fechaRegistro?: string
  activo?: boolean
}

export type DestinatarioDirectoPage = PageResponse<DestinatarioDirecto>
