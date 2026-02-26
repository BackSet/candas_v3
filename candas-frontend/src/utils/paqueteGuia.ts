import type { Paquete } from '@/types/paquete'

/**
 * Guía efectiva para mostrar/exportar: propia si existe, si no la del paquete padre (guía origen).
 * Usar en listados, Excel tracking y cualquier flujo que necesite un único identificador de guía.
 */
export function guiaEfectiva(paquete: Paquete): string {
  const propia = paquete.numeroGuia?.trim()
  if (propia) return propia
  return paquete.numeroGuiaPaquetePadre?.trim() ?? ''
}

/**
 * Indica si el paquete tiene al menos una guía (propia o origen) para filtros y validación en UI.
 */
export function tieneGuiaEfectiva(paquete: Paquete): boolean {
  return guiaEfectiva(paquete).length > 0
}
