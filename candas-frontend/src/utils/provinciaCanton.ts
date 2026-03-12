import type { Paquete } from '@/types/paquete'

/**
 * Calcula la provincia y el cantón más frecuentes entre los paquetes (destinatario).
 * Solo devuelve valor si el más común supera el 50% de los paquetes con ese dato.
 */
export function calcularProvinciaOCantonMasComun(
  paquetes: Paquete[]
): { provincia: string | null; canton: string | null } {
  if (paquetes.length === 0) return { provincia: null, canton: null }

  const provincias = paquetes
    .map((p) => p.provinciaDestinatario?.trim())
    .filter((c): c is string => !!c && c.length > 0)
    .map((c) => c.toUpperCase())

  const cantones = paquetes
    .map((p) => p.cantonDestinatario?.trim())
    .filter((c): c is string => !!c && c.length > 0)
    .map((c) => c.toUpperCase())

  const frecuenciaProvincias: Record<string, number> = {}
  provincias.forEach((provincia) => {
    frecuenciaProvincias[provincia] = (frecuenciaProvincias[provincia] || 0) + 1
  })

  const frecuenciaCantones: Record<string, number> = {}
  cantones.forEach((canton) => {
    frecuenciaCantones[canton] = (frecuenciaCantones[canton] || 0) + 1
  })

  let provinciaPredominante: string | null = null
  if (provincias.length > 0) {
    const provinciasOrdenadas = Object.entries(frecuenciaProvincias).sort(
      (a, b) => b[1] - a[1]
    )
    if (provinciasOrdenadas.length > 0) {
      const [provinciaMasComun, count] = provinciasOrdenadas[0]
      const porcentaje = (count / provincias.length) * 100
      if (porcentaje > 50) {
        const provinciaOriginal = paquetes.find(
          (p) =>
            p.provinciaDestinatario?.trim().toUpperCase() === provinciaMasComun
        )?.provinciaDestinatario?.trim()
        provinciaPredominante = provinciaOriginal ?? null
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

  return { provincia: provinciaPredominante, canton: cantonPredominante }
}
