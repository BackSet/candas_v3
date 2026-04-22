import { z } from 'zod'
import {
  EstadoAtencion,
  TipoProblemaAtencion,
  type AtencionPaquete,
} from '@/types/atencion-paquete'

export const atencionPaqueteSchema = z.object({
  idPaquete: z.number().min(1, 'El paquete es requerido'),
  motivo: z.string().min(1, 'El motivo es requerido'),
  tipoProblema: z.nativeEnum(TipoProblemaAtencion),
  estado: z.nativeEnum(EstadoAtencion),
  observacionesResolucion: z.string().optional(),
})

export type AtencionPaqueteFormData = z.infer<typeof atencionPaqueteSchema>

export function atencionPaqueteFormDataToDto(data: AtencionPaqueteFormData): AtencionPaquete {
  return {
    ...data,
    observacionesResolucion: data.observacionesResolucion || undefined,
  }
}

export function atencionPaqueteToFormData(atencion: AtencionPaquete): AtencionPaqueteFormData {
  return {
    idPaquete: atencion.idPaquete,
    motivo: atencion.motivo,
    tipoProblema: atencion.tipoProblema,
    estado: atencion.estado,
    observacionesResolucion: atencion.observacionesResolucion || '',
  }
}
