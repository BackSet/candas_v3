import type { DespachoMasivoSessionPaqueteItem } from '@/types/despacho-masivo-session'
import { EstadoPaquete, TipoDestino, type Paquete } from '@/types/paquete'

/**
 * Proyecta el ítem de paquete persistido en sesión de despacho masivo a un
 * `Paquete` mínimo, suficiente para reutilizar los helpers de presentación
 * (`PaqueteCompactListItem`, `paqueteDisplay`) que esperan un `Paquete`.
 *
 * Solo se rellenan los campos que esas vistas leen; los campos requeridos del
 * tipo (`estado`, `idClienteRemitente`) reciben valores neutros.
 */
export function sessionItemToPaquete(item: DespachoMasivoSessionPaqueteItem): Paquete {
  return {
    idPaquete: item.idPaquete,
    numeroGuia: item.numeroGuia,
    nombreClienteDestinatario: item.nombreClienteDestinatario,
    telefonoDestinatario: item.telefonoDestinatario,
    documentoDestinatario: item.documentoDestinatario,
    etiquetaDestinatario: item.etiquetaDestinatario,
    ref: item.ref,
    direccionDestinatarioCompleta: item.direccionDestinatarioCompleta,
    direccionDestinatario: item.direccionDestinatario,
    provinciaDestinatario: item.provinciaDestinatario,
    cantonDestinatario: item.cantonDestinatario,
    paisDestinatario: item.paisDestinatario,
    tipoDestino: item.tipoDestino,
    idAgenciaDestino: item.idAgenciaDestino,
    nombreAgenciaDestino: item.nombreAgenciaDestino,
    cantonAgenciaDestino: item.cantonAgenciaDestino,
    observaciones: item.observaciones,
    pesoKilos: item.pesoKilos,
    estado: item.estado ?? EstadoPaquete.RECIBIDO,
    idClienteRemitente: 0,
  }
}

/** Proyecta un `Paquete` del backend al ítem ligero que persistimos en sesión. */
export function paqueteToSessionItem(p: Paquete): DespachoMasivoSessionPaqueteItem {
  return {
    idPaquete: p.idPaquete,
    numeroGuia: p.numeroGuia,
    nombreClienteDestinatario: p.nombreClienteDestinatario,
    telefonoDestinatario: p.telefonoDestinatario,
    documentoDestinatario: p.documentoDestinatario,
    etiquetaDestinatario: p.etiquetaDestinatario,
    codigoDestinatario: p.etiquetaDestinatario?.trim() || p.documentoDestinatario?.trim() || undefined,
    ref: p.ref,
    direccionDestinatarioCompleta: p.direccionDestinatarioCompleta,
    direccionDestinatario: p.direccionDestinatario,
    provinciaDestinatario: p.provinciaDestinatario,
    cantonDestinatario: p.cantonDestinatario,
    paisDestinatario: p.paisDestinatario,
    tipoDestino: p.tipoDestino,
    idAgenciaDestino: p.idAgenciaDestino,
    nombreAgenciaDestino: p.nombreAgenciaDestino,
    cantonAgenciaDestino: p.cantonAgenciaDestino,
    observaciones: p.observaciones,
    pesoKilos: p.pesoKilos,
    estado: p.estado,
  }
}

/**
 * Código de destino mostrable de un paquete: para destino a agencia usa el
 * nombre de la agencia; para domicilio/directo usa la etiqueta o el documento
 * del destinatario. Devuelve `null` si no hay ninguno.
 */
export function codigoDestinoDePaquete(p: Paquete): string | null {
  if (p.tipoDestino === TipoDestino.AGENCIA) {
    return p.nombreAgenciaDestino?.trim() || null
  }
  return p.etiquetaDestinatario?.trim() || p.documentoDestinatario?.trim() || null
}
