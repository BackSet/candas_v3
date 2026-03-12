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
export function buildDocumentoManifiestoHTML(contenidoManifiesto: string, titulo: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${titulo}</title>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @page { size: A4 landscape; margin: 5mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; font-size: 8pt; line-height: 1.2; color: #111; background: #fff; }
      html, body { height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
      .manifiesto-wrapper { page-break-after: always !important; break-after: page !important; page-break-inside: avoid; margin-bottom: 0; padding-bottom: 0; border-bottom: none; display: block; }
      .manifiesto-wrapper:last-child { page-break-after: auto !important; break-after: auto !important; margin-bottom: 0 !important; }
      .doc-header, .info-grid, .warning-box, .saca-block, .paquetes-table, .paquetes-table tbody, .paquetes-table tr, .paquetes-table td, div, section, article { page-break-inside: auto !important; break-inside: auto !important; }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 5px; margin-bottom: 5px; border-bottom: 1px solid #000; }
      .header-left-group { display: flex; align-items: center; gap: 15px; }
      .doc-logo { height: 45px !important; max-height: 45px !important; width: auto !important; max-width: 200px !important; object-fit: contain !important; flex-shrink: 0 !important; }
      .doc-title h1 { font-size: 11pt; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: -0.3px; }
      .doc-title h2 { font-size: 8pt; font-weight: 500; color: #555; margin: 0; text-transform: uppercase; }
      .doc-meta { text-align: right; font-size: 7pt; }
      .meta-item { margin-bottom: 0px; }
      .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; padding: 6px; background: #f9fafb; border: 1px solid #ccc; border-radius: 4px; }
      .info-item { display: flex; flex-direction: column; gap: 0px; }
      .info-label { font-size: 6pt; text-transform: uppercase; color: #666; font-weight: 600; line-height: 1.1; }
      .info-value { font-size: 8pt; font-weight: 500; line-height: 1.2; }
      .warning-box { padding: 4px; margin-bottom: 8px; border: 1px solid #e5e7eb; background: #fffbeb; color: #92400e; font-size: 7pt; border-radius: 4px; text-align: center; }
      .section-title { font-size: 9pt; font-weight: 600; margin-bottom: 5px; padding-bottom: 2px; border-bottom: 1px solid #ccc; }
      .saca-block { margin-bottom: 8px; border: 1px solid #ccc; border-radius: 4px; overflow: visible !important; display: block; }
      .saca-header { padding: 3px 6px; background: #f3f4f6; border-bottom: 1px solid #ccc; font-size: 7.5pt; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
      .paquetes-table { width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed; }
      .paquetes-table thead { display: table-header-group; }
      .paquetes-table tbody { display: table-row-group; }
      .paquetes-table th { text-align: left; padding: 2px 4px; font-weight: 600; color: #444; border-bottom: 1px solid #ccc; background: #fff; text-transform: uppercase; }
      .paquetes-table td { padding: 2px 4px; border-bottom: 1px solid #eee; vertical-align: top; line-height: normal; }
      .paquetes-table tr:last-child td { border-bottom: none; }
      .col-guia { width: 10%; font-family: monospace; }
      .col-dest { width: 15%; }
      .col-dir { width: 22%; }
      .col-city { width: 8%; }
      .col-cant { width: 8%; }
      .col-tel { width: 10%; }
      .col-obs { width: 17%; font-style: italic; color: #555; }
      .col-firma { width: 10%; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .saca-block, .manifiesto-wrapper, .info-grid { page-break-inside: auto !important; break-inside: auto !important; }
        html, body { height: auto; }
      }
    </style>
  </head>
  <body>
    ${contenidoManifiesto}
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        }, 500);
      };
    </script>
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
  // Configuración del PDF (A4 Landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // Constantes de diseño
  const MARGIN_X = 10
  const MARGIN_Y = 10
  const PAGE_WIDTH = 297 - (MARGIN_X * 2)
  const PAGE_HEIGHT = 210 - (MARGIN_Y * 2)

  // Colores
  const COLOR_GRAY_50 = '#f9fafb'
  const COLOR_GRAY_100 = '#f3f4f6'
  const COLOR_GRAY_200 = '#e5e7eb'
  const COLOR_GRAY_500 = '#6b7280'
  const COLOR_AMBER_50 = '#fffbeb'
  const COLOR_AMBER_800 = '#92400e'

  // Helper para textos
  const text = (
    str: string,
    x: number,
    y: number,
    size: number = 8,
    style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal',
    align: 'left' | 'center' | 'right' = 'left',
    color: string = '#000000'
  ) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(color)
    doc.text(str, x, y, { align })
    doc.setTextColor('#000000') // reset
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
  text('DOCUMENTO DE DESPACHO', titleX, currentY + 5, 14, 'bold')
  text(tituloOrigen, titleX, currentY + 10, 9, 'normal', 'left', '#555555')

  // Meta Data (Right Aligned)
  const totalSacas = despacho.sacas?.length || 0
  const totalPaquetes = despacho.sacas?.reduce((acc, s) => acc + (s.idPaquetes?.length || 0), 0) || 0

  text(`Total Sacas: ${totalSacas}`, MARGIN_X + PAGE_WIDTH, currentY + 5, 8, 'bold', 'right')
  text(`Total Paquetes: ${totalPaquetes}`, MARGIN_X + PAGE_WIDTH, currentY + 10, 8, 'bold', 'right')

  // Line under header
  currentY += 15
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
  currentY += 5

  // --- INFO GRID ---
  const gridHeight = 22
  doc.setFillColor(COLOR_GRAY_50)
  doc.setDrawColor(COLOR_GRAY_200)
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
  text('MANIFIESTO #', colX, gridStartY, 7, 'bold', 'left', COLOR_GRAY_500)
  text(numeroManifiesto, colX, gridStartY + 4, 9, 'normal')

  colX += colWidth + colGap
  text('FECHA', colX, gridStartY, 7, 'bold', 'left', COLOR_GRAY_500)
  text(fechaDespacho, colX, gridStartY + 4, 9, 'normal')

  colX += colWidth + colGap
  text(entidadLabel, colX, gridStartY, 7, 'bold', 'left', COLOR_GRAY_500)
  text(entidadNombre, colX, gridStartY + 4, 9, 'normal')

  colX += colWidth + colGap
  text('DISTRIBUIDOR', colX, gridStartY, 7, 'bold', 'left', COLOR_GRAY_500)
  text(distribuidor?.nombre || 'N/A', colX, gridStartY + 4, 9, 'normal')

  // Row 2
  const gridRow2Y = gridStartY + 10
  colX = MARGIN_X + 2

  text('DIRECCIÓN / UBICACIÓN', colX, gridRow2Y, 7, 'bold', 'left', COLOR_GRAY_500)
  // Split direction text if too long
  const splitDir = doc.splitTextToSize(entidadDireccion, (colWidth * 2) + colGap - 2)
  doc.setFontSize(8)
  doc.text(splitDir, colX, gridRow2Y + 4)

  colX += (colWidth * 2) + (colGap * 2)
  text('TELÉFONO', colX, gridRow2Y, 7, 'bold', 'left', COLOR_GRAY_500)
  text(entidadTelefonos, colX, gridRow2Y + 4, 9, 'normal')

  colX += colWidth + colGap
  text('GUÍA DISTRIBUCIÓN', colX, gridRow2Y, 7, 'bold', 'left', COLOR_GRAY_500)
  text(despacho.numeroGuiaAgenciaDistribucion || 'N/A', colX, gridRow2Y + 4, 9, 'normal')

  currentY += gridHeight + 5

  // --- WARNING BOX ---
  const warningHeight = 8
  doc.setFillColor(COLOR_AMBER_50)
  doc.setDrawColor('#fcd34d') // amber-300
  doc.rect(MARGIN_X, currentY, PAGE_WIDTH, warningHeight, 'FD')

  text(
    'Priorice la columna Observaciones para confirmar el destino. Si no hay observaciones, guíese por los datos de dirección regular.',
    MARGIN_X + (PAGE_WIDTH / 2),
    currentY + 5,
    8,
    'normal',
    'center',
    COLOR_AMBER_800
  )
  currentY += warningHeight + 8

  // --- SECTION TITLE ---
  text('Detalle de Sacas', MARGIN_X, currentY, 10, 'bold')
  currentY += 2
  doc.setDrawColor(COLOR_GRAY_200)
  doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
  currentY += 5

  // --- SACAS LIST ---
  const sacas = despacho.sacas || []
  const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))

  for (const saca of sacasOrdenadas) {
    if (currentY + 25 > 190) {
      doc.addPage()
      currentY = MARGIN_Y
    }

    const paquetes = await cargarPaquetesDeSaca(saca.idPaquetes || [])

    // Saca Header
    const sacaHeaderY = currentY
    doc.setFillColor(COLOR_GRAY_100)
    doc.setDrawColor(COLOR_GRAY_200)
    doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, 7, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text(`Saca #${saca.numeroOrden || 'N/A'} ${saca.codigoQr ? `(${saca.codigoQr})` : ''}`, MARGIN_X + 2, sacaHeaderY + 4.5)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#555555')
    doc.text(`Tamaño: ${saca.tamano || '-'} | Paquetes: ${paquetes.length}`, MARGIN_X + PAGE_WIDTH - 2, sacaHeaderY + 4.5, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    currentY += 7

    // Table Header
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

    let x = MARGIN_X + 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor('#444444')

    cols.forEach(c => {
      doc.text(c.t, x, currentY + 4)
      x += c.w
    })

    currentY += 6
    doc.setDrawColor(COLOR_GRAY_200)
    doc.line(MARGIN_X, currentY - 1, MARGIN_X + PAGE_WIDTH, currentY - 1)

    // Rows
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#000000')

    if (paquetes.length === 0) {
      doc.text('Sin paquetes', MARGIN_X + (PAGE_WIDTH / 2), currentY + 4, { align: 'center' })
      currentY += 8
    }

    for (const paq of paquetes) {
      if (currentY + 10 > 195) {
        // Close previous block border before break
        doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, currentY - sacaHeaderY)

        doc.addPage()
        currentY = MARGIN_Y

        // Note: Breaking mid-saca doesn't redraw saca header in this simple version, 
        // but just continues the table on next page.
      }

      const d = [
        paq.numeroGuia || '-',
        paq.nombreClienteDestinatario || '-',
        paq.direccionDestinatario || '-',
        paq.provinciaDestinatario || '-',
        paq.cantonDestinatario || '-',
        paq.telefonoDestinatario || '-',
        observacionesParaDespacho(paq.observaciones)
      ]

      // Height Calc
      const dirLines = doc.splitTextToSize(String(d[2]), colDir - 2)
      const obsLines = doc.splitTextToSize(String(d[6]), colObs - 2)
      const destLines = doc.splitTextToSize(String(d[1]), colDest - 2)

      const maxLines = Math.max(dirLines.length, obsLines.length, destLines.length, 1)
      // Minimum height 6mm, or roughly 3mm per line
      const rowHeight = Math.max(6, (maxLines * 3) + 2)

      x = MARGIN_X + 2

      // Guia (Mono)
      doc.setFont('courier', 'normal')
      doc.text(String(d[0]), x, currentY + 3)
      x += colGuia
      doc.setFont('helvetica', 'normal')

      // Dest
      doc.text(destLines, x, currentY + 3)
      x += colDest

      // Dir
      doc.text(dirLines, x, currentY + 3)
      x += colDir

      // City
      doc.text(String(d[3]), x, currentY + 3)
      x += colCity

      // Cant
      doc.text(String(d[4]), x, currentY + 3)
      x += colCant

      // Tel
      doc.text(String(d[5]), x, currentY + 3)
      x += colTel

      // Obs
      doc.setTextColor('#555555')
      doc.setFont('helvetica', 'italic')
      doc.text(obsLines, x, currentY + 3)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      x += colObs

      // Firma
      // Empty

      currentY += rowHeight

      // Separator
      doc.setDrawColor('#f3f4f6')
      doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
    }

    // Draw Border around Saca Block
    doc.setDrawColor(COLOR_GRAY_200)
    doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, currentY - sacaHeaderY)

    currentY += 8
  }

  const nombreArchivo = `despacho-${despacho.numeroManifiesto || despacho.idDespacho}.pdf`
  doc.save(nombreArchivo)
}
