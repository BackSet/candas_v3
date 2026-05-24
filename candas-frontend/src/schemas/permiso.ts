import { z } from 'zod'
import type { Permiso } from '@/types/permiso'

/** Solo el nombre es editable desde la UI. */
export const permisoEditSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
})

export type PermisoEditFormData = z.infer<typeof permisoEditSchema>

export function permisoToEditFormData(permiso: Permiso): PermisoEditFormData {
  return {
    nombre: permiso.nombre,
  }
}

export function permisoEditFormDataToDto(data: PermisoEditFormData): Pick<Permiso, 'nombre'> {
  return { nombre: data.nombre.trim() }
}
