/**
 * Formatea una fecha en formato relativo (Hoy, Ayer, Hace X días, etc.)
 * @param fechaString - Fecha en formato ISO string
 * @returns String con la fecha formateada de forma relativa
 */
export function formatearFechaRelativa(fechaString: string): string {
  const fecha = new Date(fechaString)
  const hoy = new Date()
  
  // Normalizar a medianoche para comparar solo días
  const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  
  const diferenciaMs = hoyNormalizado.getTime() - fechaNormalizada.getTime()
  const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24))
  
  if (diferenciaDias === 0) {
    return 'Hoy'
  } else if (diferenciaDias === 1) {
    return 'Ayer'
  } else if (diferenciaDias > 1) {
    return `Hace ${diferenciaDias} días`
  } else if (diferenciaDias === -1) {
    return 'Mañana'
  } else {
    // Si es en el futuro, mostrar la fecha normal
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
}

export function formatearFechaCorta(fechaString: string | null | undefined): string {
  if (!fechaString) return '-'
  return new Date(fechaString).toLocaleDateString('es-ES')
}

export function formatearFechaLarga(fechaString: string | null | undefined): string {
  if (!fechaString) return '-'
  return new Date(fechaString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
