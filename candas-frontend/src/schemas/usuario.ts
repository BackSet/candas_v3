import { z } from 'zod'
import type { Usuario } from '@/types/usuario'

export const usuarioSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
  activo: z.boolean().optional(),
  idCliente: z.number().optional().or(z.literal('')),
  idAgencia: z.union([z.number(), z.literal('')]).optional(), // compat temporal
  idAgencias: z.array(z.number()).optional(),
})

export type UsuarioFormData = z.infer<typeof usuarioSchema>

export interface UsuarioFormDataToDtoOptions {
  selectedAgencias: number[]
  canManageAgencias: boolean
  isEdit: boolean
  existingUsuario?: Usuario | null
}

export function usuarioFormDataToDto(
  data: UsuarioFormData,
  options: UsuarioFormDataToDtoOptions,
): Usuario {
  const { selectedAgencias, canManageAgencias, isEdit, existingUsuario } = options

  const usuarioData: Usuario = {
    ...data,
    password: data.password || undefined,
    idCliente: data.idCliente === '' ? undefined : data.idCliente,
    idAgencia: selectedAgencias.length > 0 ? selectedAgencias[0] : undefined,
    idAgencias: canManageAgencias
      ? selectedAgencias
      : (existingUsuario?.idAgencias ?? (existingUsuario?.idAgencia ? [existingUsuario.idAgencia] : [])),
  }

  if (isEdit && !data.password) {
    delete usuarioData.password
  }

  return usuarioData
}

export function usuarioToFormData(usuario: Usuario): UsuarioFormData {
  return {
    username: usuario.username,
    email: usuario.email,
    nombreCompleto: usuario.nombreCompleto,
    activo: usuario.activo ?? true,
    idCliente: usuario.idCliente ?? '',
    idAgencia: usuario.idAgencia ?? '', // compat temporal
  }
}
