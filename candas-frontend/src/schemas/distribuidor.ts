import { z } from 'zod'
import type { Distribuidor } from '@/types/distribuidor'

export const distribuidorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  activa: z.boolean().optional(),
})

export type DistribuidorFormData = z.infer<typeof distribuidorSchema>

export function distribuidorFormDataToDto(data: DistribuidorFormData): Distribuidor {
  return {
    ...data,
    email: data.email === '' ? undefined : data.email,
  }
}

export function distribuidorToFormData(distribuidor: Distribuidor): DistribuidorFormData {
  return {
    nombre: distribuidor.nombre,
    codigo: distribuidor.codigo || '',
    email: distribuidor.email || '',
    activa: distribuidor.activa ?? true,
  }
}
