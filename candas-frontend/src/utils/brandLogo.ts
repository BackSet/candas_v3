import { jsPDF } from 'jspdf'

/** Ruta del símbolo MV Services (vectorial) usado en documentos. */
export const MV_LOGO_URL = '/logo-mv-services.svg'
/** Nombre de empresa que acompaña al símbolo en los documentos. */
export const MV_BRAND_NAME = 'MV SERVICES INC'

export interface LoadedImage {
  data: string
  width: number
  height: number
}

/**
 * Carga una imagen raster (PNG/JPG) y la devuelve como dataURL PNG con sus
 * dimensiones intrínsecas. Equivalente a la antigua helper `loadImage` duplicada
 * en los generadores de PDF.
 */
export function loadImage(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No 2D context'))
      ctx.drawImage(img, 0, 0)
      resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height })
    }
    img.onerror = reject
  })
}

/**
 * Rasteriza un SVG a PNG de alta resolución para incrustarlo en jsPDF con nitidez.
 * El ráster se genera a un alto fijo (`renderHeightPx`); el ancho se deriva del
 * ratio del `viewBox`. Como el SVG se escala al tamaño de destino del canvas, el
 * resultado es nítido a cualquier escala de impresión (resuelve la baja resolución
 * del PNG anterior).
 */
export async function loadSvgAsPng(url: string, renderHeightPx = 512): Promise<LoadedImage> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo cargar el SVG: ${url} (${res.status})`)
  const svgText = await res.text()

  // Ratio desde viewBox "minX minY width height" (los SVG con width/height="100%"
  // no exponen un tamaño intrínseco fiable, por eso lo derivamos del viewBox).
  const vb = svgText.match(/viewBox\s*=\s*["']\s*[\d.+-]+\s+[\d.+-]+\s+([\d.]+)\s+([\d.]+)/i)
  const vbW = vb ? parseFloat(vb[1]) : 1
  const vbH = vb ? parseFloat(vb[2]) : 1
  const ratio = vbW > 0 && vbH > 0 ? vbW / vbH : 1

  const height = Math.max(1, Math.round(renderHeightPx))
  const width = Math.max(1, Math.round(height * ratio))

  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.crossOrigin = 'Anonymous'
      i.width = width
      i.height = height
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = blobUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D context')
    ctx.drawImage(img, 0, 0, width, height)
    return { data: canvas.toDataURL('image/png'), width, height }
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export interface BrandLockupOptions {
  /** Alto del símbolo en mm. */
  markHeightMm: number
  /** Texto de marca centrado debajo del símbolo (ej. "MV SERVICES INC"). */
  text?: string
  /** Color del texto (hex). Por defecto gris oscuro del documento. */
  textColor?: string
  /** Tamaño del texto en pt. */
  textSizePt?: number
  /** Separación símbolo↔texto en mm. */
  gapMm?: number
  /** Familia tipográfica de jsPDF. */
  fontFamily?: string
  logoUrl?: string
}

const PT_TO_MM = 0.3528

/**
 * Dibuja el lockup de marca (símbolo arriba, nombre centrado debajo) en jsPDF a
 * partir de un símbolo YA cargado (`loadSvgAsPng`). Versión síncrona: útil cuando
 * el llamador precarga el logo una vez y lo dibuja en cada página. Si `logo` es
 * null (no se pudo cargar) dibuja solo el texto.
 * `(x, y)` es la esquina superior izquierda del símbolo. Devuelve el ancho/alto
 * totales (mm) para posicionar el resto del encabezado.
 */
export function drawBrandLockupImage(
  doc: jsPDF,
  x: number,
  y: number,
  logo: LoadedImage | null,
  opts: BrandLockupOptions
): { width: number; height: number } {
  const {
    markHeightMm,
    text = MV_BRAND_NAME,
    textColor = '#171717',
    textSizePt = 6,
    gapMm = 1.2,
    fontFamily = 'helvetica',
  } = opts

  let markWidth = 0
  if (logo) {
    markWidth = markHeightMm * (logo.width / logo.height)
    doc.addImage(logo.data, 'PNG', x, y, markWidth, markHeightMm)
  }

  let totalWidth = markWidth
  let totalHeight = markHeightMm

  if (text) {
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(textSizePt)
    doc.setTextColor(textColor)
    const textHeightMm = textSizePt * PT_TO_MM
    const baselineY = y + markHeightMm + gapMm + textHeightMm
    doc.text(text, x + markWidth / 2, baselineY, { align: 'center' })
    // Reset a estado neutro del documento.
    doc.setTextColor('#171717')
    doc.setFont(fontFamily, 'normal')
    totalWidth = Math.max(markWidth, doc.getTextWidth(text))
    totalHeight = markHeightMm + gapMm + textHeightMm
  }

  return { width: totalWidth, height: totalHeight }
}

/**
 * Carga el símbolo de marca (SVG, nítido) y dibuja el lockup completo. Conveniencia
 * para encabezados de una sola página. Internamente reutiliza `drawBrandLockupImage`.
 */
export async function drawBrandLockup(
  doc: jsPDF,
  x: number,
  y: number,
  opts: BrandLockupOptions
): Promise<{ width: number; height: number }> {
  const { logoUrl = MV_LOGO_URL } = opts
  let logo: LoadedImage | null = null
  try {
    logo = await loadSvgAsPng(logoUrl, 512)
  } catch (e) {
    console.error('No se pudo cargar el logo de marca', e)
  }
  return drawBrandLockupImage(doc, x, y, logo, opts)
}
