import { TamanoSaca, CAPACIDADES_SACA_KG } from '@/types/saca'

/**
 * Recomienda el tamaño de saca según el peso total en kg (umbrales: 15, 30, 40, 50 kg).
 */
export function calcularTamanoSugeridoPorPeso(pesoTotalKg: number): TamanoSaca {
  if (pesoTotalKg <= 15) return TamanoSaca.INDIVIDUAL
  if (pesoTotalKg <= 30) return TamanoSaca.PEQUENO
  if (pesoTotalKg <= 40) return TamanoSaca.MEDIANO
  return TamanoSaca.GRANDE
}

/**
 * Recomienda por cantidad de paquetes cuando no hay pesos (fallback).
 */
export function calcularTamanoSugeridoPorCantidad(cantidadPaquetes: number): TamanoSaca {
  if (cantidadPaquetes >= 1 && cantidadPaquetes <= 2) return TamanoSaca.INDIVIDUAL
  if (cantidadPaquetes >= 3 && cantidadPaquetes <= 6) return TamanoSaca.PEQUENO
  if (cantidadPaquetes >= 7 && cantidadPaquetes <= 10) return TamanoSaca.MEDIANO
  return TamanoSaca.GRANDE
}

export interface PaqueteConPeso {
  pesoKilos?: number | null
}

/**
 * Recomienda tamaño de saca: por peso si los paquetes tienen pesoKilos; si no, por cantidad.
 */
export function calcularTamanoSugerido(
  paquetes: PaqueteConPeso[],
  cantidadFallback?: number
): TamanoSaca {
  const cantidad = cantidadFallback ?? paquetes.length
  const pesos = paquetes.map((p) => (p.pesoKilos != null ? Number(p.pesoKilos) : NaN)).filter((w) => !Number.isNaN(w))
  if (pesos.length > 0) {
    const pesoTotal = pesos.reduce((a, b) => a + b, 0)
    return calcularTamanoSugeridoPorPeso(pesoTotal)
  }
  return calcularTamanoSugeridoPorCantidad(cantidad)
}

/** Capacidad máxima en kg para un tamaño (para validación/advertencias en UI). */
export function capacidadMaximaKg(tamano: TamanoSaca): number {
  return CAPACIDADES_SACA_KG[tamano] ?? 0
}
