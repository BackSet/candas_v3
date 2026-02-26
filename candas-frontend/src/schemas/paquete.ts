import { z } from 'zod'
import { EstadoPaquete, TipoDestino, TipoPaquete, type Paquete } from '@/types/paquete'

export const paqueteSchema = z.object({
  numeroGuia: z.string().optional(),
  numeroMaster: z.string().optional(),
  pesoKilos: z.number().positive().optional().or(z.literal('')),
  estado: z.nativeEnum(EstadoPaquete),
  tipoPaquete: z.nativeEnum(TipoPaquete).optional().or(z.literal('')),
  tipoDestino: z.nativeEnum(TipoDestino).optional().or(z.literal('')),
  idPuntoOrigen: z.number().optional().or(z.literal('')),
  idClienteRemitente: z.number().min(1, 'El cliente remitente es requerido'),
  idClienteDestinatario: z.number().optional().or(z.literal('')),
  idAgenciaDestino: z.number().optional().or(z.literal('')),
  etiquetaDestinatario: z.string().optional(),
  observaciones: z.string().optional(),
  sed: z.string().optional(),
  medidas: z.string().optional(),
  pesoLibras: z.number().positive().optional().or(z.literal('')),
  descripcion: z.string().optional(),
  valor: z.number().positive().optional().or(z.literal('')),
  tarifaPosition: z.string().optional(),
  ref: z.string().optional(),
}).refine((data) => {
  if (data.tipoDestino === TipoDestino.AGENCIA) {
    return !!data.idAgenciaDestino
  }
  return true
}, {
  message: 'La agencia destino es requerida para paquetes con destino AGENCIA',
  path: ['idAgenciaDestino'],
})

export type PaqueteFormData = z.infer<typeof paqueteSchema>

const optionalNumber = (value: number | '' | undefined): number | undefined => {
  if (value === '' || Number.isNaN(value)) {
    return undefined
  }
  return value
}

const optionalText = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function paqueteToFormData(paquete: Paquete): PaqueteFormData {
  return {
    numeroGuia: paquete.numeroGuia ?? '',
    numeroMaster: paquete.numeroMaster ?? '',
    pesoKilos: paquete.pesoKilos ?? '',
    estado: paquete.estado,
    tipoPaquete: paquete.tipoPaquete ?? '',
    tipoDestino: paquete.tipoDestino ?? '',
    idPuntoOrigen: paquete.idPuntoOrigen ?? '',
    idClienteRemitente: paquete.idClienteRemitente ?? 0,
    idClienteDestinatario: paquete.idClienteDestinatario ?? '',
    idAgenciaDestino: paquete.idAgenciaDestino ?? '',
    etiquetaDestinatario: paquete.etiquetaDestinatario ?? '',
    observaciones: paquete.observaciones ?? '',
    sed: paquete.sed ?? '',
    medidas: paquete.medidas ?? '',
    pesoLibras: paquete.pesoLibras ?? '',
    descripcion: paquete.descripcion ?? '',
    valor: paquete.valor ?? '',
    tarifaPosition: paquete.tarifaPosition ?? '',
    ref: paquete.ref ?? '',
  }
}

export function paqueteFormDataToDto(data: PaqueteFormData): Paquete {
  return {
    numeroGuia: optionalText(data.numeroGuia),
    numeroMaster: optionalText(data.numeroMaster),
    pesoKilos: optionalNumber(data.pesoKilos),
    estado: data.estado,
    tipoPaquete: data.tipoPaquete === '' ? undefined : data.tipoPaquete,
    tipoDestino: data.tipoDestino === '' ? undefined : data.tipoDestino,
    idPuntoOrigen: optionalNumber(data.idPuntoOrigen),
    idClienteRemitente: data.idClienteRemitente,
    idClienteDestinatario: optionalNumber(data.idClienteDestinatario),
    idAgenciaDestino: optionalNumber(data.idAgenciaDestino),
    etiquetaDestinatario: optionalText(data.etiquetaDestinatario),
    observaciones: optionalText(data.observaciones),
    sed: optionalText(data.sed),
    medidas: optionalText(data.medidas),
    pesoLibras: optionalNumber(data.pesoLibras),
    descripcion: optionalText(data.descripcion),
    valor: optionalNumber(data.valor),
    tarifaPosition: optionalText(data.tarifaPosition),
    ref: optionalText(data.ref),
  }
}
