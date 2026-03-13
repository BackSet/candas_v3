import { z } from 'zod'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'

export const destinatarioDirectoSchema = z.object({
  nombreDestinatario: z.string().min(1, 'El nombre del destinatario es requerido'),
  telefonoDestinatario: z.string().min(1, 'El teléfono del destinatario es requerido'),
  direccionDestinatario: z.string().optional(),
  canton: z.string().optional(),
  codigo: z.string().optional(),
  nombreEmpresa: z.string().optional(),
  activo: z.boolean().optional(),
})

export type DestinatarioDirectoFormData = z.infer<typeof destinatarioDirectoSchema>

function optionalTrim(value: string | undefined): string | undefined {
  const t = value?.trim()
  return t === '' ? undefined : t
}

export function destinatarioDirectoFormDataToDto(data: DestinatarioDirectoFormData): DestinatarioDirecto {
  return {
    nombreDestinatario: data.nombreDestinatario.trim(),
    telefonoDestinatario: data.telefonoDestinatario.trim(),
    direccionDestinatario: optionalTrim(data.direccionDestinatario),
    canton: optionalTrim(data.canton),
    codigo: optionalTrim(data.codigo),
    nombreEmpresa: optionalTrim(data.nombreEmpresa),
    activo: data.activo ?? true,
  }
}

export function destinatarioToFormData(destinatario: DestinatarioDirecto): DestinatarioDirectoFormData {
  return {
    nombreDestinatario: destinatario.nombreDestinatario ?? '',
    telefonoDestinatario: destinatario.telefonoDestinatario ?? '',
    direccionDestinatario: destinatario.direccionDestinatario ?? '',
    canton: destinatario.canton ?? '',
    codigo: destinatario.codigo ?? '',
    nombreEmpresa: destinatario.nombreEmpresa ?? '',
    activo: destinatario.activo ?? true,
  }
}

export function generarCodigo10Digitos(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000))
}
