import { z } from 'zod'
import type { Despacho } from '@/types/despacho'

export const despachoSchema = z.object({
  fechaDespacho: z.string().min(1, 'La fecha de despacho es requerida'),
  usuarioRegistro: z.string().min(1, 'El usuario de registro es requerido'),
  observaciones: z.string().optional(),
  codigoPresinto: z.string().optional(),
  idAgencia: z.number().optional(),
  idDistribuidor: z.number().optional(),
  numeroGuiaAgenciaDistribucion: z.string().optional(),
  idDestinatarioDirecto: z.number().optional(),
})

export type DespachoFormData = z.infer<typeof despachoSchema>

/** Formatea una Date a string datetime-local (YYYY-MM-DDTHH:mm). */
export function toDateTimeLocalString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

/** Genera valores por defecto para un nuevo despacho. */
export function defaultDespachoFormData(user?: { nombreCompleto?: string; username?: string } | null): DespachoFormData {
  return {
    fechaDespacho: toDateTimeLocalString(new Date()),
    usuarioRegistro: user?.nombreCompleto || user?.username || '',
    codigoPresinto: '',
  }
}

/** Convierte los datos del formulario a DTO Despacho para envío al backend. */
export function despachoFormDataToDto(data: DespachoFormData): Partial<Despacho> {
  return {
    fechaDespacho: data.fechaDespacho,
    usuarioRegistro: data.usuarioRegistro,
    observaciones: data.observaciones?.trim() || undefined,
    codigoPresinto: data.codigoPresinto?.trim() || undefined,
    idAgencia: data.idAgencia,
    idDistribuidor: data.idDistribuidor,
    numeroGuiaAgenciaDistribucion: data.numeroGuiaAgenciaDistribucion?.trim() || undefined,
    idDestinatarioDirecto: data.idDestinatarioDirecto,
  }
}

/** Convierte un Despacho del backend a datos del formulario (para edición). */
export function despachoToFormData(despacho: Despacho): DespachoFormData {
  return {
    fechaDespacho: despacho.fechaDespacho
      ? toDateTimeLocalString(new Date(despacho.fechaDespacho))
      : '',
    usuarioRegistro: despacho.usuarioRegistro,
    observaciones: despacho.observaciones || '',
    codigoPresinto: despacho.codigoPresinto ?? '',
    idAgencia: despacho.idAgencia,
    idDistribuidor: despacho.idDistribuidor,
    numeroGuiaAgenciaDistribucion: despacho.numeroGuiaAgenciaDistribucion,
    idDestinatarioDirecto:
      despacho.idDestinatarioDirecto ||
      despacho.despachoDirecto?.destinatarioDirecto?.idDestinatarioDirecto,
  }
}
