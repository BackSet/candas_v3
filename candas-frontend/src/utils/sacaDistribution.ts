import type { SacaFormData } from '@/hooks/useSacasManager'
import type { Paquete } from '@/types/paquete'
import { calcularTamanoSugerido } from '@/utils/saca'

/**
 * Helpers puros para distribuir una lista ordenada de paquetes (orden de tipiado)
 * en sacas con forma `{ tamano, idPaquetes }`, compatible con el payload de despacho.
 *
 * Todos respetan el orden de entrada y calculan el tamaño sugerido por saca con
 * `calcularTamanoSugerido` (por peso si hay `pesoKilos`, si no por cantidad).
 */

/** Construye una saca a partir de un subconjunto de paquetes (descarta los que no tienen idPaquete). */
function construirSaca(paquetes: Paquete[]): SacaFormData {
  const idPaquetes = paquetes
    .map((p) => p.idPaquete)
    .filter((id): id is number => id != null)
  return { tamano: calcularTamanoSugerido(paquetes, idPaquetes.length), idPaquetes }
}

/** Una sola saca con todos los paquetes. */
export function repartirTodoEnUnaSaca(paquetes: Paquete[]): SacaFormData[] {
  if (paquetes.length === 0) return []
  return [construirSaca(paquetes)]
}

/** N sacas con reparto equitativo (las primeras reciben el sobrante de la división). */
export function repartirEnNSacas(paquetes: Paquete[], n: number): SacaFormData[] {
  if (paquetes.length === 0 || n <= 0) return []
  const total = paquetes.length
  const base = Math.floor(total / n)
  const resto = total % n
  const sacas: SacaFormData[] = []
  let idx = 0
  for (let i = 0; i < n; i++) {
    const qty = i < resto ? base + 1 : base
    if (qty <= 0) continue
    sacas.push(construirSaca(paquetes.slice(idx, idx + qty)))
    idx += qty
  }
  return sacas
}

export interface PatronParseResult {
  grupos: number[]
  error: string | null
}

/** Parsea un patrón tipo "2,3,5": solo enteros positivos separados por coma. */
export function parsearPatron(texto: string): PatronParseResult {
  const tokens = texto.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
  if (tokens.length === 0) return { grupos: [], error: 'Ingresa un patrón, por ejemplo 2,3,5' }
  const grupos: number[] = []
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) {
      return { grupos: [], error: `Valor inválido: "${token}". Usa solo números separados por comas.` }
    }
    const n = parseInt(token, 10)
    if (n <= 0) return { grupos: [], error: 'No se permiten ceros ni números negativos en el patrón.' }
    grupos.push(n)
  }
  return { grupos, error: null }
}

export interface PatronDistribucion {
  sacas: SacaFormData[]
  /** Paquetes que sobraron tras aplicar el patrón y se agruparon en una última saca. */
  sobrantes: number
  /** Cuánto pide el patrón por encima del total disponible (patrón > total). */
  faltantes: number
}

/**
 * Reparte por patrón manual. Si sobran paquetes (patrón cubre menos que el total),
 * crea una última saca "Sobrantes" automáticamente. Si el patrón pide más que el
 * total, se ignoran los grupos sin paquetes y se informa vía `faltantes`.
 */
export function repartirPorPatron(paquetes: Paquete[], grupos: number[]): PatronDistribucion {
  const total = paquetes.length
  const sacas: SacaFormData[] = []
  let idx = 0
  for (const qty of grupos) {
    if (idx >= total) break
    sacas.push(construirSaca(paquetes.slice(idx, idx + qty)))
    idx += qty
  }
  const sobrantes = Math.max(0, total - idx)
  if (sobrantes > 0) {
    sacas.push(construirSaca(paquetes.slice(idx)))
  }
  const sumaPatron = grupos.reduce((a, b) => a + b, 0)
  return { sacas, sobrantes, faltantes: Math.max(0, sumaPatron - total) }
}
