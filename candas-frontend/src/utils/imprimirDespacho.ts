import type { Despacho } from '@/types/despacho'
import type { Agencia } from '@/types/agencia'
import type { Distribuidor } from '@/types/distribuidor'
import type { Saca } from '@/types/saca'
import type { Paquete } from '@/types/paquete'
import { paqueteService } from '@/lib/api/paquete.service'
import { jsPDF } from 'jspdf'
import { generarEtiquetaHTML } from './imprimirEtiquetaSaca'
import { observacionesParaDespacho } from './observacionesDespacho'
import QRCode from 'qrcode'

import { PRINT_CSS_BASE, PDF_COLORS, PDF_FONTS, PDF_MARGINS } from './printTheme'

// Helper to load image
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
        height: img.height
      })
    }
    img.onerror = reject
  })
}

// Función auxiliar para cargar paquetes de una saca
async function cargarPaquetesDeSaca(idPaquetes: number[]): Promise<Paquete[]> {
  if (!idPaquetes || idPaquetes.length === 0) {
    return []
  }

  try {
    const paquetes = await Promise.all(
      idPaquetes.map(id => paqueteService.findById(id).catch(() => null))
    )
    return paquetes.filter((p): p is Paquete => p !== null)
  } catch (error) {
    return []
  }
}

/** Construye el HTML completo del documento de manifiesto (estilos + contenido). Usado por imprimirDespacho, imprimirManifiestosMultiples e imprimirManifiestoConsolidado. */
export function buildDocumentoManifiestoHTML(
  contenidoManifiesto: string,
  titulo: string,
  incluirScriptImpresion: boolean = true
): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${titulo}</title>
    <meta charset="UTF-8">
    <style>
      ${PRINT_CSS_BASE}
      @page { size: A4 landscape; margin: 6mm; }
      /* Ajustes compactos solo para despacho/manifiesto */
      body { font-size: 7.2pt; line-height: 1.22; }
      .doc-header { padding-bottom: 6px; margin-bottom: 8px; }
      .header-left-group { gap: 10px; }
      .doc-logo { height: 26px !important; max-height: 26px !important; max-width: 130px !important; }
      .doc-title h1 { font-size: 11pt; margin: 0; }
      .doc-title h2 { font-size: 7.6pt; }
      .doc-meta { font-size: 7pt; gap: 1px; }
      .meta-pills { margin: 0 0 8px; gap: 5px; }
      .meta-pill { font-size: 6.7pt; padding: 1px 6px; }
      .info-grid { gap: 7px 8px; margin-bottom: 8px; }
      .info-label { font-size: 6.2pt; }
      .info-value { font-size: 7.7pt; }
      .warning-box { padding: 5px 8px; margin-bottom: 7px; font-size: 6.8pt; }
      .section-title { font-size: 8.5pt; margin: 8px 0 5px; padding-bottom: 2px; }
      .saca-block { margin-bottom: 7px; }
      .saca-header { padding: 3px 0; margin-bottom: 2px; font-size: 7pt; }
      .paquetes-table { font-size: 6.7pt; }
      .paquetes-table th { padding: 3px 3px; font-size: 6pt; }
      .paquetes-table td { padding: 2px 3px; line-height: 1.16; }
      .col-guia { width: 9.5%; }
      .col-dest { width: 15%; }
      .col-dir { width: 22.5%; }
      .col-city { width: 7.5%; }
      .col-cant { width: 7%; }
      .col-tel { width: 9.5%; }
      .col-obs { width: 17%; }
      .col-firma { width: 12%; }
    </style>
  </head>
  <body>
    ${contenidoManifiesto}
    ${incluirScriptImpresion ? `
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        }, 500);
      };
    </script>` : ''}
  </body>
</html>`
}

export async function imprimirDespacho(
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  nombreAgenciaOrigen?: string
) {
  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }
  const manifiestoHTML = await generarManifiestoHTML(despacho, agencia, distribuidor, nombreAgenciaOrigen)
  const htmlContent = buildDocumentoManifiestoHTML(manifiestoHTML, `Despacho - ${despacho.numeroManifiesto || 'N/A'}`)
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

// Interfaz para los datos de un despacho en impresión múltiple
interface DatosDespachoImpresion {
  despacho: Despacho
  agencia?: Agencia
  distribuidor?: Distribuidor
}

// Interfaz para datos de etiquetas en impresión múltiple
interface DatosEtiquetasImpresion {
  sacas: Saca[]
  despacho: Despacho
  agencia?: Agencia
  distribuidor?: Distribuidor
  indiceSacaConLeyenda?: number
}

// Función auxiliar para generar HTML de un manifiesto individual
export async function generarManifiestoHTML(
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  nombreAgenciaOrigen?: string
): Promise<string> {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'
  const numeroManifiesto = despacho.numeroManifiesto || 'N/A'
  const fechaDespacho = despacho.fechaDespacho
    ? new Date(despacho.fechaDespacho).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    : 'N/A'

  // Determinar si es destinatario directo o agencia
  const esDestinatarioDirecto = despacho.despachoDirecto?.destinatarioDirecto !== undefined

  // Datos de agencia o destinatario directo
  let entidadLabel: string
  let entidadNombre: string
  let entidadDireccion: string
  // let cantonAgencia: string // Not strictly needed if we compose location str
  let entidadTelefonos: string

  if (esDestinatarioDirecto) {
    const destinatario = despacho.despachoDirecto!.destinatarioDirecto!
    entidadLabel = 'Destinatario'
    entidadNombre = destinatario.nombreDestinatario || 'N/A'
    entidadDireccion = destinatario.direccionDestinatario || 'N/A'
    entidadTelefonos = destinatario.telefonoDestinatario || 'N/A'
  } else {
    entidadLabel = 'Agencia'
    entidadNombre = agencia?.nombre || 'N/A'
    entidadDireccion = `${agencia?.direccion || ''} ${agencia?.canton ? `(${agencia.canton})` : ''}`
    entidadTelefonos = agencia?.telefonos?.map(t => t.numero).join(', ') || 'N/A'
  }

  const nombreDistribuidor = distribuidor?.nombre || 'N/A'
  const numeroGuiaAgenciaDistribucion = despacho.numeroGuiaAgenciaDistribucion || 'N/A'
  const codigoPresinto = despacho.codigoPresinto || 'N/A'

  // Procesar sacas y cargar paquetes
  const sacas = despacho.sacas || []
  const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))

  const sacasConPaquetes = await Promise.all(
    sacasOrdenadas.map(async (saca) => {
      const paquetes = await cargarPaquetesDeSaca(saca.idPaquetes || [])
      return { saca, paquetes }
    })
  )

  const totalPaquetes = sacas.reduce((sum, s) => sum + (s.idPaquetes?.length || 0), 0)
  const totalSacas = sacas.length

  // Generar HTML de sacas
  let sacasHTML = ''
  if (sacasConPaquetes.length > 0) {
    sacasHTML = sacasConPaquetes.map(({ saca, paquetes }) => {
      const paquetesHTML = paquetes.length > 0 ? paquetes.map((paquete) => {
        return `
          <tr>
            <td class="col-guia">${paquete.numeroGuia || '-'}</td>
            <td class="col-dest">${paquete.nombreClienteDestinatario || '-'}</td>
            <td class="col-dir">${paquete.direccionDestinatario || '-'}</td>
            <td class="col-city">${paquete.provinciaDestinatario || '-'}</td>
            <td class="col-cant">${paquete.cantonDestinatario || '-'}</td>
            <td class="col-tel">${paquete.telefonoDestinatario || '-'}</td>
            <td class="col-obs">${observacionesParaDespacho(paquete.observaciones)}</td>
            <td class="col-firma"></td>
          </tr>
        `
      }).join('') : '<tr><td colspan="8" style="text-align:center; padding:8px; color:#999;">Sin paquetes</td></tr>'

      const numeroSaca = saca.numeroOrden || 'N/A'
      const codigoQrTexto = saca.codigoQr ? ` (${saca.codigoQr})` : ''

      return `
        <div class="saca-block">
          <div class="saca-header">
            <span>Saca #${numeroSaca}${codigoQrTexto}</span>
            <span style="font-weight:normal; color:#555">Tamaño: ${saca.tamano} | Paquetes: ${paquetes.length}</span>
          </div>
          <table class="paquetes-table">
            <thead>
              <tr>
                <th class="col-guia">Guía</th>
                <th class="col-dest">Destinatario</th>
                <th class="col-dir">Dirección</th>
                <th class="col-city">Provincia</th>
                <th class="col-cant">Cantón</th>
                <th class="col-tel">Teléfono</th>
                <th class="col-obs">Observaciones</th>
                <th class="col-firma">FIRMA CONFORME</th>
              </tr>
            </thead>
            <tbody>
              ${paquetesHTML}
            </tbody>
          </table>
        </div>
      `
    }).join('')
  } else {
    sacasHTML = '<div class="warning-box">No hay sacas registradas para este despacho.</div>'
  }

  return `
    <div class="manifiesto-wrapper">
      <div class="doc-header">
        <div class="header-left-group">
           <img src="/logo.png" class="doc-logo" alt="Logo" />
           <div class="doc-title">
              <h1>Documento de Despacho</h1>
              <h2>${tituloOrigen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
           </div>
        </div>
        <div class="doc-meta">
           <div class="meta-item"><span class="meta-label">Total Sacas:</span> <span class="meta-value">${totalSacas}</span></div>
           <div class="meta-item"><span class="meta-label">Total Paquetes:</span> <span class="meta-value">${totalPaquetes}</span></div>
           <div class="meta-item"><span class="meta-label">Presinto:</span> <span class="meta-value">${codigoPresinto}</span></div>
        </div>
      </div>

      <div class="info-grid">
         <div class="info-item">
            <span class="info-label">Manifiesto #</span>
            <span class="info-value font-mono">${numeroManifiesto}</span>
         </div>
         <div class="info-item">
            <span class="info-label">Fecha</span>
            <span class="info-value">${fechaDespacho}</span>
         </div>
         <div class="info-item">
            <span class="info-label">${entidadLabel}</span>
            <span class="info-value">${entidadNombre}</span>
         </div>
         <div class="info-item">
            <span class="info-label">Distribuidor</span>
            <span class="info-value">${nombreDistribuidor}</span>
         </div>
         
         <div class="info-item" style="grid-column: span 2">
            <span class="info-label">Dirección / Ubicación</span>
            <span class="info-value">${entidadDireccion}</span>
         </div>
         <div class="info-item">
            <span class="info-label">Teléfono</span>
            <span class="info-value">${entidadTelefonos}</span>
         </div>
         <div class="info-item">
            <span class="info-label">Guía Distribución</span>
            <span class="info-value font-mono">${numeroGuiaAgenciaDistribucion}</span>
         </div>
      </div>

      <div class="warning-box">
         ⚠️ Priorice la columna Observaciones para confirmar el destino. Si no hay observaciones, guíese por los datos de dirección regular.
      </div>

      <div class="section-title">Detalle de Sacas</div>
      ${sacasHTML}
    </div>
  `
}

export async function imprimirManifiestosMultiples(
  datosDespachos: DatosDespachoImpresion[],
  nombreAgenciaOrigen?: string
) {
  if (datosDespachos.length === 0) {
    alert('No hay despachos para imprimir')
    return
  }

  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  const manifiestosHTML = await Promise.all(
    datosDespachos.map(async ({ despacho, agencia, distribuidor }) => {
      try {
        return await generarManifiestoHTML(despacho, agencia, distribuidor, nombreAgenciaOrigen)
      } catch (error) {
        return `<div class="manifiesto-wrapper"><p>Error al generar el manifiesto para el despacho ${despacho.idDespacho || 'N/A'}</p></div>`
      }
    })
  )
  const manifiestosHTMLJoined = manifiestosHTML.join('')

  if (!manifiestosHTMLJoined || manifiestosHTMLJoined.trim() === '') {
    alert('Error: No se pudo generar el contenido de los manifiestos')
    printWindow.close()
    return
  }

  const htmlContent = buildDocumentoManifiestoHTML(
    manifiestosHTMLJoined,
    `Múltiples Despachos - ${datosDespachos.length} manifiesto(s)`
  )
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

export async function generarPDFDespacho(
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  nombreAgenciaOrigen?: string
) {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'
  const codigoPresinto = despacho.codigoPresinto || 'N/A'
  // Configuración del PDF (A4 Landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // Constantes de diseño
  const MARGIN_X = Math.max(6, PDF_MARGINS.x - 2)
  const MARGIN_Y = Math.max(6, PDF_MARGINS.y - 2)
  const PAGE_WIDTH = 297 - (MARGIN_X * 2)
  const MAX_Y = 200
  const LINE_HEIGHT_MM = 2.9
  const ROW_TOP_PAD = 2.8

  // Helper para textos
  const text = (
    str: string,
    x: number,
    y: number,
    size: number = PDF_FONTS.sizes.normal,
    style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal',
    align: 'left' | 'center' | 'right' = 'left',
    color: string = PDF_COLORS.text.primary
  ) => {
    doc.setFontSize(size)
    doc.setFont(PDF_FONTS.family, style)
    doc.setTextColor(color)
    doc.text(str, x, y, { align })
    doc.setTextColor(PDF_COLORS.text.primary) // reset
  }

  // --- HEADER ---
  let currentY = MARGIN_Y

  // Logo
  let logoWidth = 0
  try {
    const logo = await loadImage('/logo.png')
    // CSS height: 45px approx 12mm.
    const targetHeight = 12
    const ratio = logo.width / logo.height
    logoWidth = targetHeight * ratio

    // Max width check (approx 53mm)
    if (logoWidth > 53) {
      logoWidth = 53
    }

    doc.addImage(logo.data, 'PNG', MARGIN_X, currentY, logoWidth, targetHeight)
  } catch (e) {
    console.error('No se pudo cargar el logo', e)
  }

  // Title Group (Next to logo)
  const titleX = MARGIN_X + (logoWidth > 0 ? logoWidth + 5 : 0)
  text('Documento de Despacho', titleX, currentY + 4.5, 12, 'bold')
  text(tituloOrigen, titleX, currentY + 8.8, 8, 'normal', 'left', PDF_COLORS.text.secondary)

  // Meta Data (Right Aligned)
  const totalSacas = despacho.sacas?.length || 0
  const totalPaquetes = despacho.sacas?.reduce((acc, s) => acc + (s.idPaquetes?.length || 0), 0) || 0

  text(`Total Sacas: ${totalSacas}`, MARGIN_X + PAGE_WIDTH, currentY + 4.5, 7.4, 'bold', 'right')
  text(`Total Paquetes: ${totalPaquetes}`, MARGIN_X + PAGE_WIDTH, currentY + 8.8, 7.4, 'bold', 'right')
  text(`Presinto: ${codigoPresinto}`, MARGIN_X + PAGE_WIDTH, currentY + 13.1, 7.1, 'normal', 'right', PDF_COLORS.text.secondary)

  // Line under header
  currentY += 15
  doc.setDrawColor(PDF_COLORS.border.normal)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
  currentY += 3.5

  // --- INFO GRID ---
  const gridHeight = 18
  doc.setFillColor(PDF_COLORS.background.pill)
  doc.setDrawColor(PDF_COLORS.border.normal)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN_X, currentY, PAGE_WIDTH, gridHeight, 'FD')

  // Datos
  const numeroManifiesto = despacho.numeroManifiesto || 'N/A'
  const fechaDespacho = despacho.fechaDespacho
    ? new Date(despacho.fechaDespacho).toLocaleDateString('es-ES')
    : 'N/A'

  let entidadLabel = 'AGENCIA'
  let entidadNombre = agencia?.nombre || 'N/A'
  let entidadDireccion = `${agencia?.direccion || ''} ${agencia?.canton ? `(${agencia.canton})` : ''}`
  let entidadTelefonos = agencia?.telefonos?.map(t => t.numero).join(', ') || 'N/A'

  if (despacho.despachoDirecto?.destinatarioDirecto) {
    const dest = despacho.despachoDirecto.destinatarioDirecto
    entidadLabel = 'DESTINATARIO'
    entidadNombre = dest.nombreDestinatario || 'N/A'
    entidadDireccion = dest.direccionDestinatario || 'N/A'
    entidadTelefonos = dest.telefonoDestinatario || 'N/A'
  }

  // Layout Grid
  const colGap = 4
  const numCols = 4
  const colWidth = (PAGE_WIDTH - (colGap * (numCols - 1)) - 4) / numCols
  const gridStartY = currentY + 4

  // Row 1
  let colX = MARGIN_X + 2
  text('MANIFIESTO #', colX, gridStartY, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(numeroManifiesto, colX, gridStartY + 4, PDF_FONTS.sizes.subtitle, 'normal')

  colX += colWidth + colGap
  text('FECHA', colX, gridStartY, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(fechaDespacho, colX, gridStartY + 4, PDF_FONTS.sizes.subtitle, 'normal')

  colX += colWidth + colGap
  text(entidadLabel, colX, gridStartY, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(entidadNombre, colX, gridStartY + 4, PDF_FONTS.sizes.subtitle, 'normal')

  colX += colWidth + colGap
  text('DISTRIBUIDOR', colX, gridStartY, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(distribuidor?.nombre || 'N/A', colX, gridStartY + 4, PDF_FONTS.sizes.subtitle, 'normal')

  // Row 2
  const gridRow2Y = gridStartY + 8.5
  colX = MARGIN_X + 2

  text('DIRECCIÓN / UBICACIÓN', colX, gridRow2Y, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  const splitDir = doc.splitTextToSize(entidadDireccion, (colWidth * 2) + colGap - 2)
  doc.setFontSize(PDF_FONTS.sizes.normal)
  doc.text(splitDir, colX, gridRow2Y + 4)

  colX += (colWidth * 2) + (colGap * 2)
  text('TELÉFONO', colX, gridRow2Y, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(entidadTelefonos, colX, gridRow2Y + 4, PDF_FONTS.sizes.subtitle, 'normal')

  colX += colWidth + colGap
  text('GUÍA DISTRIBUCIÓN', colX, gridRow2Y, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(despacho.numeroGuiaAgenciaDistribucion || 'N/A', colX, gridRow2Y + 4, PDF_FONTS.sizes.subtitle, 'normal')

  currentY += gridHeight + 3

  // --- WARNING BOX ---
  const warningHeight = 6
  doc.setFillColor(PDF_COLORS.background.warning)
  doc.setDrawColor(PDF_COLORS.warning.border)
  doc.rect(MARGIN_X, currentY, PAGE_WIDTH, warningHeight, 'FD')

  text(
    'Priorice la columna Observaciones para confirmar el destino. Si no hay observaciones, guíese por los datos de dirección regular.',
    MARGIN_X + (PAGE_WIDTH / 2),
    currentY + 4,
    7.2,
    'normal',
    'center',
    PDF_COLORS.warning.text
  )
  currentY += warningHeight + 5

  // --- SECTION TITLE ---
  text('Detalle de Sacas', MARGIN_X, currentY, PDF_FONTS.sizes.section, 'bold')
  currentY += 2
  doc.setDrawColor(PDF_COLORS.border.normal)
  doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
  currentY += 3.5

  // --- SACAS LIST ---
  const sacas = despacho.sacas || []
  const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))

  for (const saca of sacasOrdenadas) {
    const paquetes = await cargarPaquetesDeSaca(saca.idPaquetes || [])
    const colGuia = 28
    const colDest = 42
    const colDir = 56
    const colCity = 28
    const colCant = 28
    const colTel = 28
    const colObs = 42
    const colFirma = 25

    const cols = [
      { t: 'GUÍA', w: colGuia },
      { t: 'DESTINATARIO', w: colDest },
      { t: 'DIRECCIÓN', w: colDir },
      { t: 'CIUDAD', w: colCity },
      { t: 'CANTÓN', w: colCant },
      { t: 'TELÉFONO', w: colTel },
      { t: 'OBSERVACIONES', w: colObs },
      { t: 'FIRMA CONFORME', w: colFirma }
    ]

    const minSacaBlockHeight = 15
    if (currentY + minSacaBlockHeight > MAX_Y) {
      doc.addPage()
      currentY = MARGIN_Y
    }

    let sacaHeaderY = currentY
    const drawSacaSectionHeaders = () => {
      sacaHeaderY = currentY
      doc.setFillColor(PDF_COLORS.background.pill)
      doc.setDrawColor(PDF_COLORS.border.normal)
      doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, 7, 'FD')

      doc.setFont(PDF_FONTS.family, 'bold')
      doc.setFontSize(PDF_FONTS.sizes.normal)
      doc.setTextColor(PDF_COLORS.text.primary)
      doc.text(`Saca #${saca.numeroOrden || 'N/A'} ${saca.codigoQr ? `(${saca.codigoQr})` : ''}`, MARGIN_X + 2, sacaHeaderY + 4.5)

      doc.setFont(PDF_FONTS.family, 'normal')
      doc.setTextColor(PDF_COLORS.text.secondary)
      doc.text(`Tamaño: ${saca.tamano || '-'} | Paquetes: ${paquetes.length}`, MARGIN_X + PAGE_WIDTH - 2, sacaHeaderY + 4.5, { align: 'right' })
      doc.setTextColor(PDF_COLORS.text.primary)
      currentY += 5.8

      let headerX = MARGIN_X + 2
      doc.setFont(PDF_FONTS.family, 'bold')
      doc.setFontSize(PDF_FONTS.sizes.tiny)
      doc.setTextColor(PDF_COLORS.text.secondary)
      cols.forEach(c => {
        doc.text(c.t, headerX, currentY + 4)
        headerX += c.w
      })

      currentY += 4.8
      doc.setDrawColor(PDF_COLORS.border.normal)
      doc.line(MARGIN_X, currentY - 1, MARGIN_X + PAGE_WIDTH, currentY - 1)
      doc.setFont(PDF_FONTS.family, 'normal')
      doc.setTextColor(PDF_COLORS.text.primary)
    }

    drawSacaSectionHeaders()

    if (paquetes.length === 0) {
      doc.text('Sin paquetes', MARGIN_X + (PAGE_WIDTH / 2), currentY + 3.2, { align: 'center' })
      currentY += 6.2
    }

    for (const paq of paquetes) {
      const d = [
        paq.numeroGuia || '-',
        paq.nombreClienteDestinatario || '-',
        paq.direccionDestinatario || '-',
        paq.provinciaDestinatario || '-',
        paq.cantonDestinatario || '-',
        paq.telefonoDestinatario || '-',
        observacionesParaDespacho(paq.observaciones)
      ]

      const dirLines = doc.splitTextToSize(String(d[2]), colDir - 2)
      const obsLines = doc.splitTextToSize(String(d[6]), colObs - 2)
      const destLines = doc.splitTextToSize(String(d[1]), colDest - 2)

      const maxLines = Math.max(dirLines.length, obsLines.length, destLines.length, 1)
      const rowHeight = Math.max(6, (maxLines * LINE_HEIGHT_MM) + 1.6)

      if (currentY + rowHeight > MAX_Y) {
        doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, currentY - sacaHeaderY)
        doc.addPage()
        currentY = MARGIN_Y
        drawSacaSectionHeaders()
      }

      let x = MARGIN_X + 2
      doc.setFont('courier', 'normal')
      doc.text(String(d[0]), x, currentY + ROW_TOP_PAD)
      x += colGuia
      doc.setFont(PDF_FONTS.family, 'normal')

      doc.text(destLines, x, currentY + ROW_TOP_PAD)
      x += colDest
      doc.text(dirLines, x, currentY + ROW_TOP_PAD)
      x += colDir
      doc.text(String(d[3]), x, currentY + ROW_TOP_PAD)
      x += colCity
      doc.text(String(d[4]), x, currentY + ROW_TOP_PAD)
      x += colCant
      doc.text(String(d[5]), x, currentY + ROW_TOP_PAD)
      x += colTel

      doc.setTextColor(PDF_COLORS.text.secondary)
      doc.setFont(PDF_FONTS.family, 'italic')
      doc.text(obsLines, x, currentY + ROW_TOP_PAD)
      doc.setTextColor(PDF_COLORS.text.primary)
      doc.setFont(PDF_FONTS.family, 'normal')

      currentY += rowHeight
      doc.setDrawColor(PDF_COLORS.border.light)
      doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
    }

    doc.setDrawColor(PDF_COLORS.border.normal)
    doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, currentY - sacaHeaderY)
    currentY += 4.8
  }

  const nombreArchivo = `despacho-${despacho.numeroManifiesto || despacho.idDespacho}.pdf`
  doc.save(nombreArchivo)
}
