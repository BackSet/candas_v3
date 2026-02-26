import { z } from 'zod'
import type { LoteRecepcion } from '@/types/lote-recepcion'

export const loteRecepcionSchema = z.object({
  numeroRecepcion: z.string().optional(),
  tipoLote: z.enum(['NORMAL', 'ESPECIAL']).optional(),
  idAgencia: z.number().min(1, 'La agencia es requerida'),
  fechaRecepcion: z.string().min(1, 'La fecha de recepción es requerida'),
  usuarioRegistro: z.string().min(1, 'El usuario de registro es requerido'),
  observaciones: z.string().optional(),
})

export type LoteRecepcionFormData = z.infer<typeof loteRecepcionSchema>

function toDateTimeLocalString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function loteRecepcionFormDataToDto(
  data: LoteRecepcionFormData,
  defaultTipoLote?: string
): LoteRecepcion {
  return {
    ...data,
    fechaRecepcion: new Date(data.fechaRecepcion).toISOString(),
    observaciones: data.observaciones || undefined,
    tipoLote: data.tipoLote ?? defaultTipoLote ?? 'NORMAL',
  }
}

export function loteRecepcionToFormData(lote: LoteRecepcion): LoteRecepcionFormData {
  const fechaRecepcion = lote.fechaRecepcion
    ? toDateTimeLocalString(new Date(lote.fechaRecepcion))
    : ''
  return {
    numeroRecepcion: lote.numeroRecepcion ?? '',
    tipoLote: (lote.tipoLote === 'ESPECIAL' ? 'ESPECIAL' : 'NORMAL') as 'NORMAL' | 'ESPECIAL',
    idAgencia: lote.idAgencia,
    fechaRecepcion,
    usuarioRegistro: lote.usuarioRegistro ?? '',
    observaciones: lote.observaciones ?? '',
  }
}

export function defaultLoteRecepcionFormData(userNombre?: string, userAgenciaId?: number): Partial<LoteRecepcionFormData> {
  const d = new Date()
  return {
    tipoLote: 'NORMAL',
    usuarioRegistro: userNombre ?? '',
    idAgencia: userAgenciaId ?? undefined,
    fechaRecepcion: toDateTimeLocalString(d),
  }
}
