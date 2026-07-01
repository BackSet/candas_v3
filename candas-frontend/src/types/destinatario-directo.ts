import type { PageResponse } from './paquete'

export type TipoUsoDestinatario = 'FRECUENTE' | 'OCASIONAL'

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
  tipoUso?: TipoUsoDestinatario
}

export type DestinatarioDirectoPage = PageResponse<DestinatarioDirecto>
