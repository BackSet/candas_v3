import { z } from 'zod'
import type { Agencia } from '@/types/agencia'

export const telefonoSchema = z.object({
  numero: z.string().min(1, 'El número de teléfono es requerido'),
  principal: z.boolean().optional(),
  idTelefono: z.number().optional(),
})

export const agenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  canton: z.string().optional(),
  nombrePersonal: z.string().optional(),
  horarioAtencion: z.string().optional(),
  activa: z.boolean().optional(),
})

export type AgenciaFormData = z.infer<typeof agenciaSchema>

export interface TelefonoFormItem {
  numero: string
  principal: boolean
  idTelefono?: number
}

function optionalTrim(value: string | undefined): string | undefined {
  const t = value?.trim()
  return t === '' ? undefined : t
}

export function agenciaFormDataToDto(data: AgenciaFormData, telefonos: TelefonoFormItem[]): Agencia {
  const telefonosValidos = telefonos.filter(t => t.numero.trim() !== '')

  if (telefonosValidos.length > 0 && !telefonosValidos.some(t => t.principal)) {
    telefonosValidos[0].principal = true
  }

  return {
    nombre: data.nombre.trim(),
    codigo: optionalTrim(data.codigo),
    direccion: optionalTrim(data.direccion),
    email: data.email === '' ? undefined : optionalTrim(data.email),
    canton: optionalTrim(data.canton),
    nombrePersonal: optionalTrim(data.nombrePersonal),
    horarioAtencion: optionalTrim(data.horarioAtencion),
    activa: data.activa ?? true,
    telefonos: telefonosValidos.map(t => ({
      numero: t.numero.trim(),
      principal: t.principal,
      idTelefono: t.idTelefono,
    })),
  }
}

export function agenciaToFormData(agencia: Agencia): AgenciaFormData {
  return {
    nombre: agencia.nombre ?? '',
    codigo: agencia.codigo ?? '',
    direccion: agencia.direccion ?? '',
    email: agencia.email ?? '',
    canton: agencia.canton ?? '',
    nombrePersonal: agencia.nombrePersonal ?? '',
    horarioAtencion: agencia.horarioAtencion ?? '',
    activa: agencia.activa ?? true,
  }
}

export function agenciaTelefonosToFormItems(agencia: Agencia): TelefonoFormItem[] {
  if (agencia.telefonos && agencia.telefonos.length > 0) {
    return agencia.telefonos.map(t => ({
      numero: t.numero,
      principal: t.principal || false,
      idTelefono: t.idTelefono,
    }))
  }
  return [{ numero: '', principal: true }]
}
