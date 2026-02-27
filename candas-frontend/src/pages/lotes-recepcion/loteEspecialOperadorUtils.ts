import type { Paquete } from '@/types/paquete'

export const SIN_ETIQUETA_KEY = '__SIN_ETIQUETA__'
export const VARIAS_LISTAS_KEY = 'VARIAS'

export function hasDespacho(p: Paquete): boolean {
  return p.idDespacho != null && p.idDespacho > 0
}

/** Cliente destino para la tarjeta de feedback (modo Despacho). */
export function buildClienteDestinoFromPaquete(p: Paquete): {
  nombre?: string
  direccion?: string
  ciudad?: string
  canton?: string
  pais?: string
  telefono?: string
} | undefined {
  const nombre = p.nombreClienteDestinatario?.trim()
  let direccion = (p.direccionDestinatarioCompleta || p.direccionDestinatario)?.trim() ?? ''
  const ciudad = p.ciudadDestinatario?.trim()
  const canton = p.cantonDestinatario?.trim()
  const pais = p.paisDestinatario?.trim()
  const telefono = p.telefonoDestinatario?.trim()
  const sufijoUbicacion = [ciudad, canton, pais].filter(Boolean).join(', ')
  if (sufijoUbicacion && direccion.endsWith(sufijoUbicacion)) {
    direccion = direccion.slice(0, -sufijoUbicacion.length).replace(/,?\s*$/, '').trim()
  } else {
    direccion = direccion.replace(/,(\s*[^,]+,\s*[^,]+,\s*[^,]+)\s*$/, '').trim()
  }
  if (!nombre && !direccion && !ciudad && !canton && !pais && !telefono) return undefined
  return {
    nombre: nombre || undefined,
    direccion: direccion || undefined,
    ciudad: ciudad || undefined,
    canton: canton || undefined,
    pais: pais || undefined,
    telefono: telefono || undefined,
  }
}
