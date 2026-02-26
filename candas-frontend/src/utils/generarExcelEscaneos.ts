import * as XLSX from 'xlsx'

interface EscaneoResultado {
  numeroGuia: string
  etiqueta: string | null
  fecha: Date
}

/**
 * Genera un archivo Excel con los resultados de escaneo de guías
 * @param historial Lista de resultados de escaneo
 * @param gruposFiltro Lista opcional de grupos/etiquetas a incluir en el Excel
 */
export function generarExcelEscaneos(historial: EscaneoResultado[], gruposFiltro?: string[]): void {
  if (historial.length === 0) {
    throw new Error('No hay escaneos para exportar')
  }

  // Filtrar historial según grupos seleccionados si se proporciona filtro
  let historialFiltrado = historial
  if (gruposFiltro && gruposFiltro.length > 0) {
    const gruposFiltroSet = new Set(gruposFiltro)
    historialFiltrado = historial.filter(item => {
      const grupo = item.etiqueta || 'Sin etiqueta'
      return gruposFiltroSet.has(grupo)
    })
  }

  if (historialFiltrado.length === 0) {
    throw new Error('No hay escaneos para exportar con los grupos seleccionados')
  }

  // Preparar datos para Excel
  const datos = historialFiltrado.map((item) => ({
    'Número de Guía': item.numeroGuia,
    'Etiqueta': item.etiqueta || 'Sin etiqueta',
    'Estado': item.etiqueta ? 'Encontrado' : 'No encontrado',
    'Fecha': item.fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    'Hora': item.fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }))

  // Crear hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(datos)

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 20 }, // Número de Guía
    { wch: 15 }, // Etiqueta
    { wch: 15 }, // Estado
    { wch: 12 }, // Fecha
    { wch: 10 }, // Hora
  ]
  worksheet['!cols'] = columnWidths

  // Crear workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Escaneos')

  // Generar nombre del archivo
  const fecha = new Date()
  const fechaFormato = fecha.toISOString().split('T')[0].replace(/-/g, '')
  const horaFormato = fecha.toTimeString().split(' ')[0].replace(/:/g, '')
  const nombreArchivo = gruposFiltro && gruposFiltro.length > 0
    ? `escaneos-guias-${gruposFiltro.join('-')}-${fechaFormato}-${horaFormato}.xlsx`
    : `escaneos-guias-${fechaFormato}-${horaFormato}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, nombreArchivo)
}
