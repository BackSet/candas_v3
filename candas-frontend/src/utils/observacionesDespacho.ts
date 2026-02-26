/**
 * Devuelve las observaciones sin la parte " Instrucción: ..." para el documento de despacho.
 * La instrucción es informativa para el operario y no debe mostrarse en el documento final.
 */
export function observacionesParaDespacho(observaciones: string | null | undefined): string {
  if (observaciones == null || observaciones === '') return ''
  const idx = observaciones.indexOf(' Instrucción:')
  if (idx === -1) return observaciones.trim()
  return observaciones.slice(0, idx).trim()
}

const PREFIXO_INSTRUCCION = ' Instrucción:'

/**
 * Extrae la instrucción de las observaciones (texto después de " Instrucción:" hasta el final).
 */
export function instruccionDeObservaciones(observaciones: string | null | undefined): string | null {
  if (observaciones == null || observaciones === '') return null
  const idx = observaciones.indexOf(PREFIXO_INSTRUCCION)
  if (idx === -1) return null
  return observaciones.slice(idx + PREFIXO_INSTRUCCION.length).trim() || null
}
