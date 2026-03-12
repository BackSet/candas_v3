import { z } from 'zod'
import type { Cliente } from '@/types/cliente'

export const clienteSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
  documentoIdentidad: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  pais: z.string().optional(),
  provincia: z.string().optional(),
  canton: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>

/**
 * Convierte los datos del formulario a DTO Cliente (trim, vacíos a undefined).
 */
export function clienteFormDataToDto(data: ClienteFormData): Cliente {
  return {
    ...data,
    email: data.email === '' ? undefined : data.email,
    pais: data.pais?.trim() ? data.pais : undefined,
    provincia: data.provincia?.trim() ? data.provincia : undefined,
    canton: data.canton?.trim() ? data.canton : undefined,
    direccion: data.direccion?.trim() ? data.direccion : undefined,
    telefono: data.telefono?.trim() ? data.telefono : undefined,
  }
}
