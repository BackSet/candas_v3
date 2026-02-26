import * as XLSX from 'xlsx'
import type { ManifiestoConsolidadoDetalle, DespachoDetalle, PaqueteDetalle } from '@/types/manifiesto-consolidado'

/**
 * Construye el texto de observación según el formato especificado
 * Formato: {AGENCIA DESTINO o DESTINATARIO DIRECTO} - {CIUDAD} / {NOMBRE DEL DISTRIBUIDOR} - {NUMERO DE GUIA DEL DISTRIBUIDOR}
 */
function construirObservacion(despacho: DespachoDetalle): string {
  const partes: string[] = []

  // Primera parte: AGENCIA DESTINO o DESTINATARIO DIRECTO - CIUDAD
  const destinoPartes: string[] = []

  if (despacho.esDestinatarioDirecto && despacho.nombreDestinatarioDirecto) {
    destinoPartes.push(despacho.nombreDestinatarioDirecto)
    // Agregar ciudad del destinatario directo si está disponible
    if (despacho.cantonDestinatarioDirecto) {
      destinoPartes.push(despacho.cantonDestinatarioDirecto)
    }
  } else if (despacho.nombreAgencia) {
    destinoPartes.push(despacho.nombreAgencia)
    // Agregar ciudad de la agencia si está disponible
    if (despacho.cantonAgencia) {
      destinoPartes.push(despacho.cantonAgencia)
    }
  } else if (despacho.codigoAgencia) {
    destinoPartes.push(despacho.codigoAgencia)
    // Agregar ciudad de la agencia si está disponible
    if (despacho.cantonAgencia) {
      destinoPartes.push(despacho.cantonAgencia)
    }
  }

  if (destinoPartes.length > 0) {
    partes.push(destinoPartes.join(' - '))
  }

  // Segunda parte: NOMBRE DEL DISTRIBUIDOR - NUMERO DE GUIA DEL DISTRIBUIDOR
  // Solo agregar si hay distribuidor o número de guía
  if (despacho.nombreDistribuidor || despacho.numeroGuiaAgenciaDistribucion) {
    const distribuidorPartes: string[] = []
    if (despacho.nombreDistribuidor) {
      distribuidorPartes.push(despacho.nombreDistribuidor)
    }
    if (despacho.numeroGuiaAgenciaDistribucion) {
      distribuidorPartes.push(despacho.numeroGuiaAgenciaDistribucion)
    }

    if (distribuidorPartes.length > 0) {
      partes.push(distribuidorPartes.join(' - '))
    }
  }

  // Si no hay primera parte, retornar solo la segunda parte o vacío
  if (partes.length === 0) {
    return ''
  }

  return partes.join(' / ')
}

/**
 * Extrae todos los paquetes de un manifiesto consolidado
 */
function extraerPaquetes(manifiesto: ManifiestoConsolidadoDetalle): Array<{
  paquete: PaqueteDetalle
  despacho: DespachoDetalle
}> {
  const paquetes: Array<{ paquete: PaqueteDetalle; despacho: DespachoDetalle }> = []

  for (const despacho of manifiesto.despachos || []) {
    for (const saca of despacho.sacas || []) {
      for (const paquete of saca.paquetes || []) {
        if (paquete.numeroGuia && paquete.numeroGuia.trim() !== '') {
          paquetes.push({ paquete, despacho })
        }
      }
    }
  }

  return paquetes
}

/**
 * Genera un archivo Excel con el formato especificado para un manifiesto consolidado
 * @param manifiesto Manifiesto consolidado con todos sus despachos y paquetes
 * @param fecha Fecha en formato YYYY-MM-DD (ej: 2026-01-08)
 * @param hora Hora en formato HH:mm (ej: 14:50)
 */
export function generarExcelManifiestoConsolidado(
  manifiesto: ManifiestoConsolidadoDetalle,
  fecha: string,
  hora: string
): void {
  // Extraer todos los paquetes del manifiesto
  const paquetesConDespacho = extraerPaquetes(manifiesto)

  if (paquetesConDespacho.length === 0) {
    throw new Error('No hay paquetes con número de guía para generar el Excel')
  }

  // Preparar datos para el Excel
  const datos = paquetesConDespacho.map(({ paquete, despacho }) => ({
    FECHA: fecha,
    HORA: hora,
    'HAWB/REFERENCIA': paquete.numeroGuia || '',
    'ESTADO DE GUIA': 'ENTREGADA A TRANSPORTADORA',
    OBSERVACION: `${construirObservacion(despacho)} - Notificado`,
    REMESA: '',
  }))

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(datos)

  // Configurar anchos de columna
  const columnWidths = [
    { wch: 12 }, // FECHA
    { wch: 8 }, // HORA
    { wch: 20 }, // HAWB/REFERENCIA
    { wch: 30 }, // ESTADO DE GUIA
    { wch: 50 }, // OBSERVACION (más ancho porque puede tener más texto)
    { wch: 15 }, // REMESA
  ]
  worksheet['!cols'] = columnWidths

  // Crear workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Paquetes')

  // Generar nombre del archivo
  const fechaFormato = fecha.replace(/-/g, '')
  const numeroManifiesto = manifiesto.numeroManifiesto || `MC-${manifiesto.idManifiestoConsolidado}`
  const nombreArchivo = `manifiesto-consolidado-${numeroManifiesto}-${fechaFormato}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}

/**
 * Formatea fecha ISO (con o sin hora) a DD/MM/YYYY
 */
function formatearFechaDespacho(fechaDespacho: string | undefined): string {
  if (!fechaDespacho) return ''
  const d = new Date(fechaDespacho)
  if (isNaN(d.getTime())) return ''
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const anio = d.getFullYear()
  return `${dia}/${mes}/${anio}`
}

/**
 * Genera un Excel solo con paquetes de despachos a destinatarios directos.
 * Columnas: FECHA, GUIA ORIGEN, REFERENCIA, DESTINATARIO, CIUDAD, DIRECCION, TELF, NOTAS, GUIA, ESTADO, DIRECCIÓN DESTINO FINAL.
 * - DESTINATARIO/CIUDAD/DIRECCION/TELF → datos del cliente destino del paquete.
 * - NOTAS → observaciones del paquete.
 * - DIRECCIÓN DESTINO FINAL → datos del destinatario directo del despacho (nombre, teléfono, dirección, cantón).
 * @param manifiesto Manifiesto consolidado con todos sus despachos y paquetes
 */
export function generarExcelDestinatariosDirectos(manifiesto: ManifiestoConsolidadoDetalle): void {
  const despachosDirectos = (manifiesto.despachos || []).filter((d) => d.esDestinatarioDirecto === true)
  const filas: Array<{
    FECHA: string
    'GUIA ORIGEN': string
    REFERENCIA: string
    DESTINATARIO: string
    CIUDAD: string
    DIRECCION: string
    TELF: string
    NOTAS: string
    GUIA: string
    ESTADO: string
    'DIRECCIÓN DESTINO FINAL': string
  }> = []

  for (const despacho of despachosDirectos) {
    // Construir DIRECCIÓN DESTINO FINAL con datos del destinatario directo del despacho
    const destinoFinalPartes: string[] = []
    if (despacho.nombreDestinatarioDirecto?.trim()) {
      destinoFinalPartes.push(despacho.nombreDestinatarioDirecto.trim())
    }
    if (despacho.telefonoDestinatarioDirecto?.trim()) {
      destinoFinalPartes.push(`Tel: ${despacho.telefonoDestinatarioDirecto.trim()}`)
    }
    if (despacho.direccionDestinatarioDirecto?.trim()) {
      destinoFinalPartes.push(despacho.direccionDestinatarioDirecto.trim())
    }
    if (despacho.cantonDestinatarioDirecto?.trim()) {
      destinoFinalPartes.push(despacho.cantonDestinatarioDirecto.trim())
    }
    const direccionDestinoFinal = destinoFinalPartes.join(' - ')

    for (const saca of despacho.sacas || []) {
      for (const paquete of saca.paquetes || []) {
        if (!paquete.numeroGuia || paquete.numeroGuia.trim() === '') continue

        // Datos del cliente destino asociado al paquete
        const ciudadPaquetePartes: string[] = []
        if (paquete.ciudadDestinatario?.trim()) {
          ciudadPaquetePartes.push(paquete.ciudadDestinatario.trim())
        }
        if (paquete.cantonDestinatario?.trim()) {
          ciudadPaquetePartes.push(paquete.cantonDestinatario.trim())
        }

        filas.push({
          FECHA: formatearFechaDespacho(despacho.fechaDespacho),
          'GUIA ORIGEN': paquete.numeroGuia.trim(),
          REFERENCIA: paquete.ref?.trim() || '',
          DESTINATARIO: paquete.nombreClienteDestinatario?.trim() || '',
          CIUDAD: ciudadPaquetePartes.join(', '),
          DIRECCION: paquete.direccionDestinatarioCompleta?.trim() || '',
          TELF: paquete.telefonoDestinatario?.trim() || '',
          NOTAS: paquete.observaciones?.trim() || '',
          GUIA: despacho.numeroGuiaAgenciaDistribucion?.trim() || '',
          ESTADO: 'ENVIADO',
          'DIRECCIÓN DESTINO FINAL': direccionDestinoFinal,
        })
      }
    }
  }

  if (filas.length === 0) {
    throw new Error('No hay paquetes de destinatarios directos en este manifiesto')
  }

  const worksheet = XLSX.utils.json_to_sheet(filas)
  const columnWidths = [
    { wch: 12 },  // FECHA
    { wch: 18 },  // GUIA ORIGEN
    { wch: 14 },  // REFERENCIA
    { wch: 28 },  // DESTINATARIO
    { wch: 22 },  // CIUDAD
    { wch: 40 },  // DIRECCION
    { wch: 16 },  // TELF
    { wch: 30 },  // NOTAS
    { wch: 20 },  // GUIA
    { wch: 10 },  // ESTADO
    { wch: 50 },  // DIRECCIÓN DESTINO FINAL
  ]
  worksheet['!cols'] = columnWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Destinatarios directos')

  const numeroManifiesto = manifiesto.numeroManifiesto || `MC-${manifiesto.idManifiestoConsolidado}`
  const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const nombreArchivo = `destinatarios-directos-${numeroManifiesto}-${hoy}.xlsx`
  XLSX.writeFile(workbook, nombreArchivo)
}
