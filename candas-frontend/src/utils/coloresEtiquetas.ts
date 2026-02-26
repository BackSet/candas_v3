/**
 * Asigna colores consistentes a etiquetas para visualización
 */

interface ColorEtiqueta {
  bg: string
  bgLight: string
  text: string
  border: string
}

// Colores predefinidos para etiquetas comunes
const coloresPredefinidos: Record<string, ColorEtiqueta> = {
  GEO: {
    bg: '#3b82f6',
    bgLight: '#dbeafe',
    text: '#1e40af',
    border: '#2563eb',
  },
  MIA: {
    bg: '#10b981',
    bgLight: '#d1fae5',
    text: '#065f46',
    border: '#059669',
  },
  // Colores adicionales para otras etiquetas comunes
  OTRO: {
    bg: '#8b5cf6',
    bgLight: '#ede9fe',
    text: '#5b21b6',
    border: '#7c3aed',
  },
  SIN_ETIQUETA: {
    bg: '#6b7280',
    bgLight: '#f3f4f6',
    text: '#374151',
    border: '#4b5563',
  },
}

// Paleta de colores para etiquetas no predefinidas
const paletaColores: ColorEtiqueta[] = [
  { bg: '#ef4444', bgLight: '#fee2e2', text: '#991b1b', border: '#dc2626' }, // Rojo
  { bg: '#f59e0b', bgLight: '#fef3c7', text: '#92400e', border: '#d97706' }, // Amarillo/Naranja
  { bg: '#ec4899', bgLight: '#fce7f3', text: '#9f1239', border: '#db2777' }, // Rosa
  { bg: '#14b8a6', bgLight: '#ccfbf1', text: '#134e4a', border: '#0d9488' }, // Turquesa
  { bg: '#6366f1', bgLight: '#e0e7ff', text: '#312e81', border: '#4f46e5' }, // Índigo
  { bg: '#f97316', bgLight: '#ffedd5', text: '#9a3412', border: '#ea580c' }, // Naranja
]

// Cache de colores asignados para mantener consistencia
const coloresAsignados = new Map<string, ColorEtiqueta>()

/**
 * Obtiene el color para una etiqueta, asignando colores consistentes
 */
export function obtenerColorEtiqueta(etiqueta: string | null): ColorEtiqueta {
  if (!etiqueta) {
    return coloresPredefinidos.SIN_ETIQUETA
  }

  const etiquetaUpper = etiqueta.toUpperCase().trim()

  // Si tiene color predefinido, usarlo
  if (coloresPredefinidos[etiquetaUpper]) {
    return coloresPredefinidos[etiquetaUpper]
  }

  // Si ya se asignó un color, reutilizarlo
  if (coloresAsignados.has(etiquetaUpper)) {
    return coloresAsignados.get(etiquetaUpper)!
  }

  // Asignar un color de la paleta basado en hash de la etiqueta
  const hash = etiquetaUpper.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  const colorIndex = Math.abs(hash) % paletaColores.length
  const color = paletaColores[colorIndex]

  // Guardar en cache
  coloresAsignados.set(etiquetaUpper, color)

  return color
}

/**
 * Limpia el cache de colores asignados (útil para testing o reset)
 */
export function limpiarCacheColores(): void {
  coloresAsignados.clear()
}
