import { notify } from '@/lib/notify'
import type { DespachoMasivoSacaDetalle } from '@/types/despacho-masivo-session'
import type { TamanoSaca } from '@/types/saca'
import { copyTextToClipboard } from '@/utils/clipboard'
import { formatearTamanoSaca } from '@/utils/ensacado'

/**
 * Construcción de textos copiables al portapapeles para despacho masivo.
 * Las funciones `build*` son puras (sin DOM); `copyText` ejecuta la copia y
 * notifica. Reutilizadas por el builder (antes de crear), las cards de saca y la
 * lista del lote (después de crear).
 */

/**
 * Copia texto al portapapeles y notifica el resultado. No lanza si el navegador
 * bloquea el portapapeles: muestra un mensaje de error claro.
 */
export async function copyText(text: string, successMessage = 'Copiado al portapapeles'): Promise<void> {
  const ok = await copyTextToClipboard(text)
  if (ok) notify.success(successMessage)
  else notify.error('No se pudo copiar al portapapeles')
}

function fmtPeso(peso?: number): string | null {
  if (peso == null || peso <= 0) return null
  return `${peso.toFixed(2).replace(/\.?0+$/, '')} kg`
}
export interface ResumenDespachoMasivoInput {
  numeroManifiesto?: string
  destinoResumen: string
  tipoEnvio: 'agencia' | 'directo'
  nombreDistribuidor?: string
  numeroGuiaTransporte?: string
  observaciones?: string
  totalSacas: number
  totalPaquetes: number
  numerosGuia: string[]
  sacasDetalle: DespachoMasivoSacaDetalle[]
}

/** Lista de guías, una por línea. */
export function construirListaGuias(numerosGuia: string[]): string {
  return numerosGuia.join('\n')
}

/** Texto del destino (tipo de envío, destino, distribuidor y guía de transporte). */
export function construirDestinoTexto(input: ResumenDespachoMasivoInput): string {
  const lineas: string[] = [
    `Destino (${input.tipoEnvio === 'agencia' ? 'agencia' : 'directo'}): ${input.destinoResumen}`,
  ]
  if (input.nombreDistribuidor) lineas.push(`Distribuidor: ${input.nombreDistribuidor}`)
  if (input.numeroGuiaTransporte) lineas.push(`Guía de transporte: ${input.numeroGuiaTransporte}`)
  return lineas.join('\n')
}

function formatearPeso(peso?: number): string {
  if (peso == null || peso <= 0) return ''
  const fixed = peso.toFixed(2).replace(/\.?0+$/, '')
  return ` · ${fixed} kg`
}

/** Resumen completo del despacho, legible y listo para copiar. */
export function construirResumenDespachoMasivo(input: ResumenDespachoMasivoInput): string {
  const lineas: string[] = []
  lineas.push(`DESPACHO MASIVO${input.numeroManifiesto ? ` — Manifiesto ${input.numeroManifiesto}` : ''}`)
  lineas.push(construirDestinoTexto(input))
  lineas.push(`Sacas: ${input.totalSacas} · Paquetes: ${input.totalPaquetes}`)
  if (input.observaciones?.trim()) lineas.push(`Observaciones: ${input.observaciones.trim()}`)

  lineas.push('')
  for (const saca of input.sacasDetalle) {
    const presinto = saca.codigoPresinto?.trim() ? ` · Presinto ${saca.codigoPresinto.trim()}` : ''
    lineas.push(
      `Saca ${saca.numero} — ${formatearTamanoSaca(saca.tamano)} · ${saca.totalPaquetes} paquete(s)${formatearPeso(
        saca.pesoEstimado
      )}${presinto}`
    )
    for (const guia of saca.numerosGuia) {
      lineas.push(`  - ${guia}`)
    }
  }

  return lineas.join('\n').trim()
}

// --- Copiado por saca ------------------------------------------------------

export interface SacaCopyPaquete {
  numeroGuia?: string
  pesoKilos?: number
  nombreDestinatario?: string
  telefono?: string
  codigo?: string | null
  direccion?: string
  observaciones?: string
}

export interface SacaCopyInput {
  numero: number
  tamano: TamanoSaca
  presinto?: string
  pesoEstimado: number
  paquetes: SacaCopyPaquete[]
}

/** Encabezado de una saca: número, tamaño, cantidad, peso y presinto. */
function encabezadoSaca(saca: SacaCopyInput): string {
  const peso = fmtPeso(saca.pesoEstimado)
  const presinto = saca.presinto?.trim() ? ` · Presinto ${saca.presinto.trim()}` : ''
  return `Saca ${saca.numero} — ${formatearTamanoSaca(saca.tamano)} · ${saca.paquetes.length} paquete(s)${
    peso ? ` · ${peso}` : ''
  }${presinto}`
}

/** Resumen completo de una saca con todos sus paquetes (guía, peso, destino, teléfono, obs). */
export function buildSacaCopyText(saca: SacaCopyInput): string {
  const lineas: string[] = [encabezadoSaca(saca)]
  for (const p of saca.paquetes) {
    const peso = fmtPeso(p.pesoKilos)
    lineas.push(`- ${p.numeroGuia ?? '—'}${peso ? ` · ${peso}` : ''}`)
    const dest = [p.nombreDestinatario, p.telefono, p.codigo].filter(Boolean).join(' · ')
    if (dest) lineas.push(`  ${dest}`)
    if (p.direccion) lineas.push(`  ${p.direccion}`)
    if (p.observaciones) lineas.push(`  Obs: ${p.observaciones}`)
  }
  return lineas.join('\n')
}

/** Solo las guías de la saca, una por línea. */
export function buildSacaGuiasCopyText(saca: SacaCopyInput): string {
  return saca.paquetes
    .map((p) => p.numeroGuia)
    .filter((g): g is string => !!g)
    .join('\n')
}

/** Datos de destino por paquete de la saca: código/destinatario, dirección y teléfono. */
export function buildSacaDestinoCopyText(saca: SacaCopyInput): string {
  const lineas: string[] = [`Saca ${saca.numero} — destinos (${saca.paquetes.length})`]
  for (const p of saca.paquetes) {
    const cabecera = [p.codigo, p.nombreDestinatario].filter(Boolean).join(' · ') || p.numeroGuia || '—'
    lineas.push(`- ${cabecera}`)
    if (p.direccion) lineas.push(`  ${p.direccion}`)
    if (p.telefono) lineas.push(`  Tel: ${p.telefono}`)
  }
  return lineas.join('\n')
}
