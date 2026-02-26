import * as XLSX from 'xlsx'

export interface FilaListaEtiquetada {
  etiqueta: string
  estado: string
  numeroGuia: string
  fechaCreacion?: string
}

export function generarExcelListasEtiquetadas(opts: {
  filas: FilaListaEtiquetada[]
  filtroEstado: string
  filtroEtiqueta: string
}): void {
  const { filas, filtroEstado, filtroEtiqueta } = opts
  if (!filas || filas.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const datos = filas.map((f) => ({
    Etiqueta: f.etiqueta,
    Estado: f.estado,
    'Número de Guía': f.numeroGuia,
    'Fecha Creación': f.fechaCreacion ? new Date(f.fechaCreacion).toLocaleString('es-ES') : '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(datos)
  worksheet['!cols'] = [
    { wch: 18 }, // Etiqueta
    { wch: 12 }, // Estado
    { wch: 20 }, // Número de Guía
    { wch: 22 }, // Fecha
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Listas Etiquetadas')

  const fecha = new Date()
  const fechaFormato = fecha.toISOString().split('T')[0]
  const horaFormato = fecha.toTimeString().split(' ')[0].replace(/:/g, '-')

  const safe = (s: string) => s.replace(/[^\w\-]+/g, '_').slice(0, 60)
  const nombreArchivo = `listas-etiquetadas-${safe(filtroEstado)}-${safe(filtroEtiqueta)}-${fechaFormato}-${horaFormato}.xlsx`

  XLSX.writeFile(workbook, nombreArchivo)
}

