import type { DespachoRapido } from '@/types/despacho-rapido'
import { formatearTamanoSaca } from '@/utils/ensacado'

/**
 * Construcción de texto copiable al portapapeles para Despachos rápidos (vista desktop).
 * Aislado de `utils/despachoMasivoCopy.ts`: mismo patrón (función pura + `CopyActionButton`),
 * sin compartir tipos ni modificar el módulo de despacho masivo.
 */

/** Resumen completo del despacho rápido, listo para pegar en el sistema externo del distribuidor. */
export function construirResumenDespachoRapido(despacho: DespachoRapido): string {
  const lineas: string[] = []
  lineas.push(`DESPACHO RÁPIDO${despacho.numeroManifiesto ? ` — Manifiesto ${despacho.numeroManifiesto}` : ''}`)

  const destino = despacho.nombreAgencia ?? despacho.nombreDestinatarioDirecto
  if (destino) {
    lineas.push(`Destino (${despacho.nombreAgencia ? 'agencia' : 'directo'}): ${destino}`)
  }
  if (despacho.nombreDistribuidor) lineas.push(`Distribuidor: ${despacho.nombreDistribuidor}`)
  if (despacho.numeroGuiaAgenciaDistribucion) {
    lineas.push(`Guía del distribuidor: ${despacho.numeroGuiaAgenciaDistribucion}`)
  }
  lineas.push(`Sacas: ${despacho.totalSacas} · Paquetes: ${despacho.totalPaquetes}`)
  if (despacho.observaciones?.trim()) lineas.push(`Observaciones: ${despacho.observaciones.trim()}`)

  lineas.push('')
  for (const saca of despacho.sacas) {
    const presinto = saca.codigoPresinto?.trim() ? ` · Presinto ${saca.codigoPresinto.trim()}` : ''
    const tamano = saca.tamano ? formatearTamanoSaca(saca.tamano) : ''
    lineas.push(`Saca ${saca.numeroOrden}${tamano ? ` — ${tamano}` : ''} · ${saca.paquetes.length} paquete(s)${presinto}`)
    for (const paquete of saca.paquetes) {
      lineas.push(`  - ${paquete.numeroGuia}`)
    }
  }

  return lineas.join('\n')
}

/** Lista de todas las guías del despacho, una por línea (para pegar en sistemas que solo aceptan guías). */
export function construirListaGuiasDespachoRapido(despacho: DespachoRapido): string {
  return despacho.sacas.flatMap((s) => s.paquetes.map((p) => p.numeroGuia)).join('\n')
}
