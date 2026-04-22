import { z } from 'zod'
import { TamanoSaca, type Saca } from '@/types/saca'

export const sacaSchema = z.object({
  codigoQr: z.string().optional(),
  numeroOrden: z.number().min(1, 'El número de orden es requerido'),
  tamano: z.nativeEnum(TamanoSaca),
  idDespacho: z.number().optional().or(z.literal('')),
})

export type SacaFormData = z.infer<typeof sacaSchema>

export function sacaFormDataToDto(data: SacaFormData): Saca {
  return {
    ...data,
    idDespacho: data.idDespacho === '' ? undefined : data.idDespacho,
  }
}

export function sacaToFormData(saca: Saca): SacaFormData {
  return {
    codigoQr: saca.codigoQr || '',
    numeroOrden: saca.numeroOrden ?? 1,
    tamano: saca.tamano,
    idDespacho: saca.idDespacho || '',
  }
}
