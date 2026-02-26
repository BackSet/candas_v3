/**
 * Clasifica un paquete en etiqueta de destino (Agencia, Domicilio, Cadena, Separar)
 * según Dirección, Observaciones y, si existe, tipoDestino ya clasificado.
 * Prioridad: Cadena > Separar > (Agencia si tipoDestino) > (Domicilio si tipoDestino) > texto.
 */

export type EtiquetaDestino = 'AGENCIA' | 'DOMICILIO' | 'CADENA' | 'SEPARAR'

function joinText(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' ').trim().toUpperCase()
}

function hasWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
}

function hasPhrase(text: string, phrase: string): boolean {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)
}

/**
 * Detecta si el texto indica Cadena (CADENA, CAD, CAJA).
 */
function esCadena(text: string): boolean {
  if (!text) return false
  const cadenaKeywords = ['CADENA', 'CAD', 'CAJA']
  return cadenaKeywords.some(k => hasWord(text, k))
}

/**
 * Detecta si el texto indica Separar (SEPARAR o patrones tipo "X LB C/U", "C/U").
 */
function esSeparar(text: string): boolean {
  if (!text) return false
  if (hasWord(text, 'SEPARAR')) return true
  // Patrón tipo "4LB C/U", "4 LB C/U", "SERRANO Y AGUIRRE ... C/U"
  if (/\d+\s*LB\s*C\/U/i.test(text)) return true
  if (hasWord(text, 'C/U')) return true
  return false
}

/**
 * Detecta si el texto indica Agencia (AGENCIA sin SERVIENTREGA, OFICINA).
 * Evitar "AGENCIA SERVIENTREGA" como agencia genérica (se considera domicilio).
 */
function esAgenciaPorTexto(text: string): boolean {
  if (!text) return false
  if (hasWord(text, 'OFICINA')) return true
  // "AGENCIA" pero no "AGENCIA SERVIENTREGA" (esa es domicilio)
  if (hasWord(text, 'AGENCIA') && !hasPhrase(text, 'AGENCIA SERVIENTREGA')) return true
  return false
}

/**
 * Detecta si el texto indica Domicilio (DOMICILIO, SERVIENTREGA, AGENCIA SERVIENTREGA, dirección exacta).
 */
function esDomicilioPorTexto(text: string): boolean {
  if (!text) return false
  if (hasWord(text, 'DOMICILIO')) return true
  if (hasWord(text, 'SERVIENTREGA')) return true
  if (hasPhrase(text, 'AGENCIA SERVIENTREGA')) return true
  return false
}

export interface ClasificarEtiquetaDestinoParams {
  direccionCompleta?: string
  observaciones?: string
  tipoDestino?: 'AGENCIA' | 'DOMICILIO'
  /** Nombres de agencias registradas para coincidencia opcional */
  nombresAgencias?: string[]
}

/**
 * Devuelve la etiqueta de destino para mostrar en la fila del paquete.
 * Prioridad: Cadena > Separar > (tipoDestino AGENCIA/DOMICILIO si existe) > Agencia por texto > Domicilio por texto.
 */
export function clasificarEtiquetaDestino(params: ClasificarEtiquetaDestinoParams): EtiquetaDestino | undefined {
  const { direccionCompleta = '', observaciones = '', tipoDestino, nombresAgencias = [] } = params
  const texto = joinText(direccionCompleta, observaciones)

  // 1) Cadena y Separar por texto (mayor prioridad)
  if (esCadena(texto)) return 'CADENA'
  if (esSeparar(texto)) return 'SEPARAR'

  // 2) Si ya está clasificado por backend
  if (tipoDestino === 'AGENCIA') return 'AGENCIA'
  if (tipoDestino === 'DOMICILIO') return 'DOMICILIO'

  // 3) Inferir por texto (Agencia antes que Domicilio para evitar falsos domicilios)
  if (esAgenciaPorTexto(texto)) return 'AGENCIA'
  if (esDomicilioPorTexto(texto)) return 'DOMICILIO'

  // Opcional: coincidencia con nombres de agencias
  if (nombresAgencias.length > 0 && texto) {
    const match = nombresAgencias.some(nombre => nombre && texto.includes(nombre.toUpperCase()))
    if (match) return 'AGENCIA'
  }

  return undefined
}
