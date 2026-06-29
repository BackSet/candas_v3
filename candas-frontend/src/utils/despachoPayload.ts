import type { SacaFormData } from '@/hooks/useSacasManager'
import type { Despacho } from '@/types/despacho'
import type { Saca } from '@/types/saca'

/**
 * Lógica pura de construcción del payload `Despacho` a partir del estado del
 * formulario/sacas. Sin dependencias de DOM ni de navegación: reutilizable tanto
 * por `/despachos/new` (DespachoForm) como por el módulo de despacho masivo.
 */

export type DespachoTipoEnvio = 'agencia' | 'directo'
export type DespachoDestinatarioOrigen = 'existente' | 'desde_paquete'

/** Descriptor de destino con los ids ya resueltos al momento de crear el despacho. */
export interface DespachoDestinoInput {
  tipoEnvio: DespachoTipoEnvio
  /** Requerido cuando `tipoEnvio === 'agencia'`. */
  idAgencia?: number
  /** Origen del destinatario directo (cuando `tipoEnvio === 'directo'`). */
  destinatarioOrigen?: DespachoDestinatarioOrigen
  /** Id del destinatario directo ya resuelto/creado (cuando `tipoEnvio === 'directo'`). */
  idDestinatarioDirecto?: number
  /** Paquete de referencia para destinatario "desde_paquete". Solo se usa en validación previa. */
  idPaqueteOrigenDestinatario?: number
}

/** Entrada para construir el DTO `Despacho` a enviar al backend. */
export interface ConstruirDespachoPayloadInput {
  /** Fecha en formato datetime-local o ISO; se normaliza a ISO. */
  fechaDespacho: string
  usuarioRegistro: string
  observaciones?: string
  destino: DespachoDestinoInput
  idDistribuidor?: number
  numeroGuiaAgenciaDistribucion?: string
  sacas: SacaFormData[]
}

/** Entrada para la validación mínima previa a crear un despacho. */
export interface ValidarDespachoInput {
  sacas: SacaFormData[]
  destino: DespachoDestinoInput
}

/** Resumen agregado de sacas/paquetes de un despacho en construcción. */
export interface ResumenDespacho {
  totalSacas: number
  totalPaquetes: number
}

/**
 * Normaliza el presinto de una saca: recorta espacios y convierte el vacío en
 * `undefined` para que el backend lo genere automáticamente.
 */
export function normalizarCodigoPresinto(codigo?: string): string | undefined {
  const valor = codigo?.trim()
  return valor ? valor : undefined
}

/** Convierte `SacaFormData[]` en el arreglo de `Saca` del DTO de despacho. */
export function construirSacasPayload(sacas: SacaFormData[]): Saca[] {
  return sacas.map((saca) => ({
    tamano: saca.tamano,
    idPaquetes: saca.idPaquetes,
    codigoPresinto: normalizarCodigoPresinto(saca.codigoPresinto),
  }))
}

/** Mapea el destino (agencia/directo) a los campos de id del DTO `Despacho`. */
export function mapearDestinoDespacho(
  destino: DespachoDestinoInput
): Pick<Despacho, 'idAgencia' | 'idDestinatarioDirecto'> {
  if (destino.tipoEnvio === 'agencia') {
    return { idAgencia: destino.idAgencia, idDestinatarioDirecto: undefined }
  }
  return { idAgencia: undefined, idDestinatarioDirecto: destino.idDestinatarioDirecto }
}

/** Calcula el resumen de sacas y paquetes de un conjunto de sacas. */
export function resumenDespacho(sacas: SacaFormData[]): ResumenDespacho {
  return {
    totalSacas: sacas.length,
    totalPaquetes: sacas.reduce((acc, saca) => acc + saca.idPaquetes.length, 0),
  }
}

/**
 * Validación mínima antes de crear un despacho. Devuelve el primer mensaje de
 * error encontrado, o `null` si es válido. Los mensajes y el orden coinciden con
 * los de `/despachos/new` para no alterar su UX.
 */
export function validarDespachoParaCrear({ sacas, destino }: ValidarDespachoInput): string | null {
  if (sacas.length === 0) {
    return 'Debe haber al menos una saca'
  }
  for (let i = 0; i < sacas.length; i++) {
    if (sacas[i].idPaquetes.length === 0) {
      return `La saca ${i + 1} debe tener al menos un paquete`
    }
  }
  if (destino.tipoEnvio === 'agencia' && !destino.idAgencia) {
    return 'Selecciona una agencia'
  }
  if (
    destino.tipoEnvio === 'directo' &&
    destino.destinatarioOrigen === 'existente' &&
    !destino.idDestinatarioDirecto
  ) {
    return 'Selecciona un destinatario'
  }
  if (
    destino.tipoEnvio === 'directo' &&
    destino.destinatarioOrigen === 'desde_paquete' &&
    !destino.idPaqueteOrigenDestinatario
  ) {
    return 'Selecciona un paquete de referencia para el destinatario'
  }
  return null
}

/**
 * Construye el DTO `Despacho` listo para enviar al backend a partir del estado
 * de formulario/sacas. No valida; usar `validarDespachoParaCrear` antes.
 */
export function construirDespachoPayload(input: ConstruirDespachoPayloadInput): Despacho {
  const { idAgencia, idDestinatarioDirecto } = mapearDestinoDespacho(input.destino)
  return {
    fechaDespacho: new Date(input.fechaDespacho).toISOString(),
    usuarioRegistro: input.usuarioRegistro,
    observaciones: input.observaciones || undefined,
    idAgencia,
    idDistribuidor: input.idDistribuidor,
    numeroGuiaAgenciaDistribucion: input.numeroGuiaAgenciaDistribucion || undefined,
    idDestinatarioDirecto,
    idPaqueteOrigenDestinatario: undefined,
    sacas: construirSacasPayload(input.sacas),
  }
}
