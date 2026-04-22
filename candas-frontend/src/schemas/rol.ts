import { z } from 'zod'
import type { Rol } from '@/types/rol'

export const rolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

export type RolFormData = z.infer<typeof rolSchema>

export function rolFormDataToDto(data: RolFormData): Rol {
  return {
    ...data,
    descripcion: data.descripcion || undefined,
  }
}

export function rolToFormData(rol: Rol): RolFormData {
  return {
    nombre: rol.nombre,
    descripcion: rol.descripcion || '',
    activo: rol.activo ?? true,
  }
}
