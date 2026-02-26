import { z } from 'zod'
import type { PuntoOrigen } from '@/types/punto-origen'

export const puntoOrigenSchema = z.object({
  nombrePuntoOrigen: z.string().min(1, 'El nombre del punto de origen es requerido'),
  activo: z.boolean().optional(),
})

export type PuntoOrigenFormData = z.infer<typeof puntoOrigenSchema>

export function puntoOrigenFormDataToDto(data: PuntoOrigenFormData): PuntoOrigen {
  return {
    nombrePuntoOrigen: data.nombrePuntoOrigen.trim(),
    activo: data.activo ?? true,
  }
}

export function puntoOrigenToFormData(origen: PuntoOrigen): PuntoOrigenFormData {
  return {
    nombrePuntoOrigen: origen.nombrePuntoOrigen ?? '',
    activo: origen.activo ?? true,
  }
}
