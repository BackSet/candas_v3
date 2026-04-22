import { z } from 'zod'
import type { Permiso } from '@/types/permiso'

export const permisoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  recurso: z.string().optional(),
  accion: z.string().optional(),
})

export type PermisoFormData = z.infer<typeof permisoSchema>

export function permisoFormDataToDto(data: PermisoFormData): Permiso {
  return {
    ...data,
    descripcion: data.descripcion || undefined,
    recurso: data.recurso || undefined,
    accion: data.accion || undefined,
  }
}

export function permisoToFormData(permiso: Permiso): PermisoFormData {
  return {
    nombre: permiso.nombre,
    descripcion: permiso.descripcion || '',
    recurso: permiso.recurso || '',
    accion: permiso.accion || '',
  }
}
