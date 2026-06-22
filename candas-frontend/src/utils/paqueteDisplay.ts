import type { Paquete } from '@/types/paquete'

/**
 * Helpers de presentación compacta de un Paquete para los listados operativos
 * del detalle de lote (despacho, domicilio, clementina, separar, cadenita y lista).
 *
 * Centraliza el formato de peso, referencia, dirección/destino y observación para
 * reutilizarlo entre `LoteRecepcionOperador` y `LoteEspecialOperador`.
 */

/** Formatea el peso en kg con 2 decimales. Devuelve null si no hay peso válido (> 0). */
export function formatPesoKg(paquete: Paquete): string | null {
  const peso = paquete.pesoKilos
  if (peso == null || Number.isNaN(peso) || peso <= 0) return null
  // toFixed(2) y luego quitar ceros finales innecesarios (3.60 -> 3.6, 3.00 -> 3)
  const fixed = peso.toFixed(2).replace(/\.?0+$/, '')
  return `${fixed} kg`
}

/** Referencia del paquete ya recortada, o null si no existe. No anteponer "Ref:" aquí. */
export function formatRef(paquete: Paquete): string | null {
  const ref = paquete.ref?.trim()
  return ref ? ref : null
}

/** Observación del paquete ya recortada, o null si no existe. */
export function formatObservacionPaquete(paquete: Paquete): string | null {
  const obs = paquete.observaciones?.trim()
  return obs ? obs : null
}

/** Limpia comas/espacios sobrantes: colapsa comas dobles y espacios, recorta comas al inicio/fin. */
function limpiarComas(texto: string): string {
  return texto
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*){2,}/g, ', ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim()
}

/** Une partes omitiendo vacíos y descartando duplicados exactos consecutivos (case-insensitive). */
function unirPartes(partes: Array<string | undefined | null>): string {
  const limpias: string[] = []
  for (const parte of partes) {
    const valor = parte?.trim()
    if (!valor) continue
    const previo = limpias[limpias.length - 1]
    if (previo && previo.toLowerCase() === valor.toLowerCase()) continue
    limpias.push(valor)
  }
  return limpiarComas(limpias.join(', '))
}

export interface FormatDireccionOptions {
  /** Texto cuando no hay datos. Por defecto 'Sin dirección'. */
  fallback?: string
}

/**
 * Dirección/destino normalizado y compacto para mostrar en una línea.
 *
 * Reglas:
 * - AGENCIA: nombre de la agencia + cantón.
 * - DOMICILIO/sin tipo: prefiere `direccionDestinatarioCompleta` (que ya suele incluir
 *   provincia/cantón/país, evitando repetirlos); si no existe, construye con
 *   dirección + cantón + provincia + país.
 * - Omite vacíos, descarta duplicados consecutivos y limpia comas sobrantes.
 * - Si no hay datos devuelve el fallback ('Sin dirección' por defecto; usar 'Sin destino' donde aplique).
 */
export function formatDireccionPaquete(paquete: Paquete, options: FormatDireccionOptions = {}): string {
  const fallback = options.fallback ?? 'Sin dirección'

  if (paquete.tipoDestino === 'AGENCIA') {
    const agencia = unirPartes([paquete.nombreAgenciaDestino, paquete.cantonAgenciaDestino])
    return agencia || (options.fallback ?? 'Sin destino')
  }

  const completa = paquete.direccionDestinatarioCompleta?.trim()
  if (completa) {
    return limpiarComas(completa) || fallback
  }

  const construida = unirPartes([
    paquete.direccionDestinatario,
    paquete.cantonDestinatario,
    paquete.provinciaDestinatario,
    paquete.paisDestinatario,
  ])
  return construida || fallback
}
