import type { Paquete } from '@/types/paquete'

const SIN_ESPECIFICAR = 'Sin especificar'

/**
 * Deriva solo ciudad y cantón del paquete para agrupar.
 * Usa siempre los campos explícitos del destinatario (ciudadDestinatario, cantonDestinatario)
 * cuando tengan valor. No usa la dirección completa como ciudad/cantón para evitar
 * que textos largos (ej. "277Q DOMICILIO YANTZAZA- ZAMORA CHINCHIPE: AGENCIA...")
 * se tomen como ciudad o cantón.
 */
export function derivarCiudadCantonDeDireccion(paquete: Paquete): { ciudad: string; canton: string } {
  const ciudad = (paquete.ciudadDestinatario ?? '').trim()
  const canton = (paquete.cantonDestinatario ?? '').trim()

  if (ciudad || canton) {
    return {
      ciudad: ciudad || SIN_ESPECIFICAR,
      canton: canton || SIN_ESPECIFICAR,
    }
  }

  // Solo si no hay ciudad/cantón explícitos: intentar derivar de dirección completa
  // únicamente cuando tenga formato "X, Y, ..." (partes claras separadas por coma)
  const dir = paquete.direccionDestinatarioCompleta?.trim()
  if (dir) {
    const partes = dir.split(',').map(p => p.trim()).filter(Boolean)
    if (partes.length >= 2) {
      return {
        ciudad: partes[0],
        canton: partes[1],
      }
    }
  }

  return {
    ciudad: SIN_ESPECIFICAR,
    canton: SIN_ESPECIFICAR,
  }
}
