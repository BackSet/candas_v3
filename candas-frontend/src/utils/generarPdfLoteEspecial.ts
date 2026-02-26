import { jsPDF } from 'jspdf'
import type { Paquete } from '@/types/paquete'
import { instruccionDeObservaciones, observacionesParaDespacho } from '@/utils/observacionesDespacho'

const loadImage = (url: string): Promise<{ data: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('No context')
      ctx.drawImage(img, 0, 0)
      resolve({
        data: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = reject
  })
}

/**
 * Filtra paquetes por tipo: TODOS, SIN_ETIQUETA o nombre de etiqueta (ref).
 */
export function filtrarPaquetesPorTipo(
  paquetes: Paquete[],
  tipo: string
): Paquete[] {
  const t = (tipo ?? '').trim()
  if (t === '' || t.toUpperCase() === 'TODOS') return paquetes
  if (t.toUpperCase() === 'SIN_ETIQUETA') {
    return paquetes.filter((p) => !p.ref || p.ref.trim() === '')
  }
  const etiqueta = t.toUpperCase()
  return paquetes.filter(
    (p) => p.ref != null && p.ref.toUpperCase() === etiqueta
  )
}

// --- Constantes de layout ---
const MARGIN = 12
const PAGE_WIDTH = 210 - MARGIN * 2
const PAGE_HEIGHT = 297
const MAX_Y = PAGE_HEIGHT - MARGIN - 10
const LINE_HEIGHT = 5.5

// Anchos de columna
const COL_GUIA_W = 48
const COL_ETIQ_W = 30
const COL_INSTR_W = 32
const COL_OBS_W = PAGE_WIDTH - COL_GUIA_W - COL_ETIQ_W - COL_INSTR_W

/**
 * Construye el documento PDF del lote especial (misma librería que generarPDFDespacho: jsPDF).
 * Uso interno para descarga (doc.save) e impresión por HTML (no se usa el blob para imprimir).
 */
async function buildPdfLoteEspecial(
  paquetes: Paquete[],
  numeroRecepcion: string,
  tipo: string
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let logoData: { data: string; width: number; height: number } | null = null
  try {
    logoData = await loadImage('/logo.png')
  } catch {
    // Logo no disponible
  }

  const fechaGeneracion = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  function dibujarEncabezado(): number {
    let y = MARGIN
    let logoWidth = 0
    const targetHeight = 12
    if (logoData) {
      const ratio = logoData.width / logoData.height
      logoWidth = Math.min(53, targetHeight * ratio)
      doc.addImage(logoData.data, 'PNG', MARGIN, y, logoWidth, targetHeight)
    }
    const titleX = MARGIN + (logoWidth > 0 ? logoWidth + 5 : 0)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('LOTE ESPECIAL', titleX, y + 5)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(85, 85, 85)
    doc.text(`Recepción: ${numeroRecepcion || '-'}`, titleX, y + 10)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(`Tipo: ${tipo || 'TODOS'}`, MARGIN + PAGE_WIDTH, y + 5, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(85, 85, 85)
    doc.text(`Generado: ${fechaGeneracion}`, MARGIN + PAGE_WIDTH, y + 9, { align: 'right' })
    doc.text(`Total: ${paquetes.length} paquete${paquetes.length !== 1 ? 's' : ''}`, MARGIN + PAGE_WIDTH, y + 13, { align: 'right' })
    y += Math.max(targetHeight, 14) + 2
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, MARGIN + PAGE_WIDTH, y)
    y += 4
    return y
  }

  function dibujarCabeceraTabla(y: number): number {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(68, 68, 68)
    const cols = [
      { label: 'Nº GUÍA', x: MARGIN + 2 },
      { label: 'ETIQUETA', x: MARGIN + COL_GUIA_W + 2 },
      { label: 'INSTRUCCIÓN', x: MARGIN + COL_GUIA_W + COL_ETIQ_W + 2 },
      { label: 'OBSERVACIONES', x: MARGIN + COL_GUIA_W + COL_ETIQ_W + COL_INSTR_W + 2 },
    ]
    doc.setFillColor(243, 244, 246)
    doc.rect(MARGIN, y - 3.5, PAGE_WIDTH, 6, 'F')
    cols.forEach((c) => doc.text(c.label, c.x, y))
    y += 4
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, MARGIN + PAGE_WIDTH, y)
    y += 2
    return y
  }

  let y = dibujarEncabezado()
  y = dibujarCabeceraTabla(y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(0)
  let rowIndex = 0

  for (const p of paquetes) {
    if (y > MAX_Y) {
      doc.addPage()
      y = dibujarEncabezado()
      y = dibujarCabeceraTabla(y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(0)
      rowIndex = 0
    }
    if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(MARGIN, y - 3, PAGE_WIDTH, LINE_HEIGHT, 'F')
    }
    const guia = (p.numeroGuia ?? '').substring(0, 20)
    const ref = (p.ref ?? '').substring(0, 12)
    const instr = (instruccionDeObservaciones(p.observaciones) ?? '').substring(0, 16)
    const obs = observacionesParaDespacho(p.observaciones).substring(0, 45)
    doc.setTextColor(0)
    doc.setFont('courier', 'normal')
    doc.text(guia, MARGIN + 2, y)
    doc.setFont('helvetica', 'normal')
    doc.text(ref, MARGIN + COL_GUIA_W + 2, y)
    if (instr) {
      doc.setTextColor(146, 64, 14)
      doc.setFont('helvetica', 'bold')
      doc.text(instr, MARGIN + COL_GUIA_W + COL_ETIQ_W + 2, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0)
    }
    doc.setTextColor(100, 100, 100)
    doc.text(obs, MARGIN + COL_GUIA_W + COL_ETIQ_W + COL_INSTR_W + 2, y)
    doc.setTextColor(0)
    y += LINE_HEIGHT
    rowIndex++
  }

  y += 4
  if (y < MAX_Y) {
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, y, MARGIN + PAGE_WIDTH, y)
    y += 4
    doc.setFontSize(7)
    doc.setTextColor(130, 130, 130)
    doc.text(`${paquetes.length} paquete${paquetes.length !== 1 ? 's' : ''} - Generado el ${fechaGeneracion}`, MARGIN, y)
  }

  return doc
}

/**
 * Genera y descarga el PDF del lote especial (misma implementación que generarPDFDespacho: jsPDF + doc.save).
 */
export async function descargarPDFLoteEspecial(
  paquetes: Paquete[],
  numeroRecepcion: string,
  tipo: string
): Promise<void> {
  const doc = await buildPdfLoteEspecial(paquetes, numeroRecepcion, tipo)
  const nombreArchivo = `lote-especial-${numeroRecepcion || 'recepcion'}-${(tipo || 'TODOS').toLowerCase()}.pdf`
  doc.save(nombreArchivo)
}

/**
 * Genera el PDF y devuelve un Blob (para compatibilidad si se necesita en memoria).
 */
export async function generarPdfLoteEspecial(
  paquetes: Paquete[],
  numeroRecepcion: string,
  tipo: string
): Promise<Blob> {
  const doc = await buildPdfLoteEspecial(paquetes, numeroRecepcion, tipo)
  return doc.output('blob') as Blob
}
