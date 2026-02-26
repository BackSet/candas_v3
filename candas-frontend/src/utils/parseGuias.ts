/**
 * Parsea un texto con guías separadas por comas, saltos de línea o espacios.
 * Retorna un array de guías normalizadas (trim + uppercase).
 */
export function parseGuias(texto: string): string[] {
  return texto
    .split(/[,\n\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.toUpperCase())
}

/**
 * Igual que parseGuias pero elimina duplicados.
 */
export function parseGuiasUnicas(texto: string): string[] {
  return [...new Set(parseGuias(texto))]
}
