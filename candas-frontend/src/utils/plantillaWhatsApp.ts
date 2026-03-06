import type { Despacho } from '@/types/despacho'
import type { Agencia } from '@/types/agencia'
import type { Distribuidor } from '@/types/distribuidor'

/**
 * Reemplaza en la plantilla cada {{clave}} por el valor correspondiente del mapa.
 * Si una clave no existe en valores, se deja el placeholder sin cambiar.
 */
export function reemplazarVariables(
  plantilla: string,
  valores: Record<string, string>
): string {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, clave) => valores[clave] ?? `{{${clave}}}`)
}

/**
 * Construye el mapa de variables para la plantilla de WhatsApp despacho
 * a partir de los datos del despacho, agencia, distribuidor y sacas.
 */
export function construirVariablesDesdeDespacho(
  despacho: Despacho,
  agencia: Agencia | null,
  distribuidor: Distribuidor | null
): Record<string, string> {
  const sacas = despacho.sacas ?? []
  const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden ?? 0) - (b.numeroOrden ?? 0))
  const totalSacas = sacas.length
  const totalPaquetes = sacas.reduce((sum, s) => sum + (s.idPaquetes?.length ?? 0), 0)

  let destinatarioDirecto = ''
  let encargado = ''
  let agenciaNombre = ''

  if (despacho.idAgencia && agencia) {
    agenciaNombre = agencia.nombre ?? ''
    destinatarioDirecto = [agencia.nombre, agencia.canton].filter(Boolean).join(' - ')
    encargado = agencia.nombrePersonal ?? ''
  } else if (despacho.despachoDirecto?.destinatarioDirecto) {
    const d = despacho.despachoDirecto.destinatarioDirecto
    destinatarioDirecto = d.nombreDestinatario ?? ''
  }

  const detalleSacas = sacasOrdenadas
    .map((saca, i) => {
      const numPaq = saca.idPaquetes?.length ?? 0
      return `${i + 1}. Saca #${saca.numeroOrden ?? 'N/A'} (${numPaq} paq)`
    })
    .join('\n')

  const fechaDespacho = despacho.fechaDespacho
    ? new Date(despacho.fechaDespacho).toLocaleDateString('es-ES')
    : ''

  return {
    numero_manifiesto: despacho.numeroManifiesto ?? `ID: ${despacho.idDespacho ?? ''}`,
    fecha_despacho: fechaDespacho,
    destinatario_directo: destinatarioDirecto,
    encargado,
    distribuidor: distribuidor?.nombre ?? '',
    guia: despacho.numeroGuiaAgenciaDistribucion ?? '',
    guias: despacho.numeroGuiaAgenciaDistribucion ?? '',
    cantidad_sacas: String(totalSacas),
    cantidad_paquetes: String(totalPaquetes),
    detalle_sacas: detalleSacas,
    agencia: agenciaNombre,
    observaciones: despacho.observaciones ?? '',
    codigo_presinto: despacho.codigoPresinto ?? '',
  }
}
