import type { Paquete } from '@/types/paquete'

/**
 * Calcula la ciudad y el cantón más frecuentes entre los paquetes (destinatario).
 * Solo devuelve valor si el más común supera el 50% de los paquetes con ese dato.
 */
export function calcularCiudadOCantonMasComun(
  paquetes: Paquete[]
): { ciudad: string | null; canton: string | null } {
  if (paquetes.length === 0) return { ciudad: null, canton: null }

  const ciudades = paquetes
    .map((p) => p.ciudadDestinatario?.trim())
    .filter((c): c is string => !!c && c.length > 0)
    .map((c) => c.toUpperCase())

  const cantones = paquetes
    .map((p) => p.cantonDestinatario?.trim())
    .filter((c): c is string => !!c && c.length > 0)
    .map((c) => c.toUpperCase())

  const frecuenciaCiudades: Record<string, number> = {}
  ciudades.forEach((ciudad) => {
    frecuenciaCiudades[ciudad] = (frecuenciaCiudades[ciudad] || 0) + 1
  })

  const frecuenciaCantones: Record<string, number> = {}
  cantones.forEach((canton) => {
    frecuenciaCantones[canton] = (frecuenciaCantones[canton] || 0) + 1
  })

  let ciudadPredominante: string | null = null
  if (ciudades.length > 0) {
    const ciudadesOrdenadas = Object.entries(frecuenciaCiudades).sort(
      (a, b) => b[1] - a[1]
    )
    if (ciudadesOrdenadas.length > 0) {
      const [ciudadMasComun, count] = ciudadesOrdenadas[0]
      const porcentaje = (count / ciudades.length) * 100
      if (porcentaje > 50) {
        const ciudadOriginal = paquetes.find(
          (p) =>
            p.ciudadDestinatario?.trim().toUpperCase() === ciudadMasComun
        )?.ciudadDestinatario?.trim()
        ciudadPredominante = ciudadOriginal ?? null
      }
    }
  }

  let cantonPredominante: string | null = null
  if (cantones.length > 0) {
    const cantonesOrdenados = Object.entries(frecuenciaCantones).sort(
      (a, b) => b[1] - a[1]
    )
    if (cantonesOrdenados.length > 0) {
      const [cantonMasComun, count] = cantonesOrdenados[0]
      const porcentaje = (count / cantones.length) * 100
      if (porcentaje > 50) {
        const cantonOriginal = paquetes.find(
          (p) =>
            p.cantonDestinatario?.trim().toUpperCase() === cantonMasComun
        )?.cantonDestinatario?.trim()
        cantonPredominante = cantonOriginal ?? null
      }
    }
  }

  return { ciudad: ciudadPredominante, canton: cantonPredominante }
}
