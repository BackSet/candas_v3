import type { Paquete } from '@/types/paquete'

const SIN_ESPECIFICAR = 'Sin especificar'

/**
 * Deriva solo provincia y cantón del paquete para agrupar.
 * Usa siempre los campos explícitos del destinatario (provinciaDestinatario, cantonDestinatario)
 * cuando tengan valor. No usa la dirección completa como provincia/cantón para evitar
 * que textos largos (ej. "277Q DOMICILIO YANTZAZA- ZAMORA CHINCHIPE: AGENCIA...")
 * se tomen como provincia o cantón.
 */
export function derivarProvinciaCantonDeDireccion(paquete: Paquete): { provincia: string; canton: string } {
  const provincia = (paquete.provinciaDestinatario ?? '').trim()
  const canton = (paquete.cantonDestinatario ?? '').trim()

  if (provincia || canton) {
    return {
      provincia: provincia || SIN_ESPECIFICAR,
      canton: canton || SIN_ESPECIFICAR,
    }
  }

  // Solo si no hay provincia/cantón explícitos: intentar derivar de dirección completa
  // únicamente cuando tenga formato "X, Y, ..." (partes claras separadas por coma)
  const dir = paquete.direccionDestinatarioCompleta?.trim()
  if (dir) {
    const partes = dir.split(',').map(p => p.trim()).filter(Boolean)
    if (partes.length >= 2) {
      return {
        provincia: partes[0],
        canton: partes[1],
      }
    }
  }

  return {
    provincia: SIN_ESPECIFICAR,
    canton: SIN_ESPECIFICAR,
  }
}
