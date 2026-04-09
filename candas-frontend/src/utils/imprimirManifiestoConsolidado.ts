import type {
  ManifiestoConsolidadoDetalle,
  DespachoDetalle,
  SacaDetalle,
  PaqueteDetalle,
} from '@/types/manifiesto-consolidado'
import { buildDocumentoManifiestoHTML } from '@/utils/imprimirDespacho'
import { observacionesParaDespacho } from '@/utils/observacionesDespacho'
import { jsPDF } from 'jspdf'
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS } from './printTheme'

function loadImage(url: string): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No context'))
      ctx.drawImage(img, 0, 0)
      resolve({
        data: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = () => reject(new Error('Image load failed'))
  })
}

export function imprimirManifiestoConsolidado(
  manifiesto: ManifiestoConsolidadoDetalle,
  tipoFiltro: 'todos' | 'agencias' | 'destinatarios-directos' = 'todos',
  nombreAgenciaOrigen?: string
) {
  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  const periodoTexto = formatearPeriodo(manifiesto)
  const fechaGeneracion = manifiesto.fechaGeneracion
    ? new Date(manifiesto.fechaGeneracion).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A'

  const contenidoConsolidadoHTML = generarContenidoConsolidado(
    manifiesto,
    periodoTexto,
    fechaGeneracion,
    tipoFiltro,
    nombreAgenciaOrigen
  )
  const titulo = `Manifiesto Consolidado - ${manifiesto.numeroManifiesto || 'Reporte'}`
  const htmlContent = buildDocumentoManifiestoHTML(contenidoConsolidadoHTML, titulo)

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

/** Genera el cuerpo del documento (un solo manifiesto-wrapper) con la estructura del documento de despacho. */
function generarContenidoConsolidado(
  manifiesto: ManifiestoConsolidadoDetalle,
  periodoTexto: string,
  fechaGeneracion: string,
  tipoFiltro: 'todos' | 'agencias' | 'destinatarios-directos',
  nombreAgenciaOrigen?: string
): string {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'
  const tituloPrincipal =
    manifiesto.idAgencia == null ? 'Manifiesto Consolidado' : 'Manifiesto de Agencia'
  const { totalDespachos, totalSacas, totalPaquetes } = manifiesto.totales

  return `
    <div class="manifiesto-wrapper">
      <div class="doc-header">
        <div class="header-left-group">
          <img src="/logo.png" class="doc-logo" alt="Logo" />
          <div class="doc-title">
            <h1>${tituloPrincipal}</h1>
            <h2>${tituloOrigen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
          </div>
        </div>
        <div class="doc-meta">
          <div class="meta-item"><span class="meta-label">Generado:</span> <span class="meta-value">${fechaGeneracion}</span></div>
          <div class="meta-item"><span class="meta-label">Total Sacas:</span> <span class="meta-value">${totalSacas}</span></div>
          <div class="meta-item"><span class="meta-label">Total Paquetes:</span> <span class="meta-value">${totalPaquetes}</span></div>
        </div>
      </div>

      <div class="meta-pills">
        <span class="meta-pill">Despachos: <strong>${totalDespachos}</strong></span>
        <span class="meta-pill">Generado: <strong>${fechaGeneracion}</strong></span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Manifiesto #</span>
          <span class="info-value font-mono">${manifiesto.numeroManifiesto || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Agencia / Entidad</span>
          <span class="info-value">${manifiesto.nombreAgencia || 'Todas'}${manifiesto.codigoAgencia ? ` (${manifiesto.codigoAgencia})` : ''}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ubicación</span>
          <span class="info-value">${manifiesto.cantonAgencia || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Período</span>
          <span class="info-value">${periodoTexto}</span>
        </div>
      </div>

      <div class="warning-box">
        ⚠️ Priorice la columna Observaciones para confirmar el destino. Si no hay observaciones, guíese por los datos de dirección regular.
      </div>

      <div class="section-title">Detalle de Sacas</div>
      ${generarHTMLDespachos(manifiesto.despachos, manifiesto.idAgencia == null, tipoFiltro)}
    </div>
  `
}

function formatearPeriodo(manifiesto: ManifiestoConsolidadoDetalle): string {
  if (manifiesto.fechaInicio && manifiesto.fechaFin) {
    const inicio = new Date(manifiesto.fechaInicio).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const fin = new Date(manifiesto.fechaFin).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return `${inicio} - ${fin}`
  } else if (manifiesto.mes && manifiesto.anio) {
    const meses = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]
    return `${meses[manifiesto.mes]} ${manifiesto.anio}`
  }
  return '-'
}

function generarHTMLDespachos(
  despachos: DespachoDetalle[],
  agruparPorAgencia: boolean,
  tipoFiltro: 'todos' | 'agencias' | 'destinatarios-directos' = 'todos'
): string {
  let despachosDirectos = despachos.filter((d) => d.esDestinatarioDirecto === true)
  let despachosNormales = despachos.filter((d) => !d.esDestinatarioDirecto)

  if (tipoFiltro === 'agencias') despachosDirectos = []
  else if (tipoFiltro === 'destinatarios-directos') despachosNormales = []

  let html = ''

  if (despachosNormales.length > 0) {
    if (agruparPorAgencia) {
      const despachosPorAgencia = new Map<string, DespachoDetalle[]>()
      for (const despacho of despachosNormales) {
        const nombreAgencia = despacho.nombreAgencia || 'Sin Agencia'
        const cantonAgencia = despacho.cantonAgencia || ''
        const keyAgencia = `${nombreAgencia}${cantonAgencia ? ` - ${cantonAgencia}` : ''}`
        if (!despachosPorAgencia.has(keyAgencia)) despachosPorAgencia.set(keyAgencia, [])
        despachosPorAgencia.get(keyAgencia)!.push(despacho)
      }
      for (const [, despachosAgencia] of despachosPorAgencia.entries()) {
        html += despachosAgencia.map((d) => generarHTMLDespacho(d, false)).join('')
      }
    } else {
      html += despachosNormales.map((d) => generarHTMLDespacho(d, false)).join('')
    }
  }

  if (despachosDirectos.length > 0) {
    const despachosPorDestinatario = new Map<string, DespachoDetalle[]>()
    for (const d of despachosDirectos) {
      const nombre = d.nombreDestinatarioDirecto || 'Sin Nombre'
      if (!despachosPorDestinatario.has(nombre)) despachosPorDestinatario.set(nombre, [])
      despachosPorDestinatario.get(nombre)!.push(d)
    }
    for (const [, grupo] of despachosPorDestinatario.entries()) {
      html += grupo.map((d) => generarHTMLDespacho(d, false)).join('')
    }
  }

  return html || '<p class="warning-box">No hay despachos para mostrar con el filtro seleccionado.</p>'
}

/** Genera HTML por despacho usando solo clases del documento de despacho: section-title (opcional), saca-block, saca-header, paquetes-table, col-*. */
function generarHTMLDespacho(despacho: DespachoDetalle, mostrarAgencia: boolean): string {
  const fecha = new Date(despacho.fechaDespacho).toLocaleDateString('es-ES')
  let html = `<div class="section-title" style="margin-top:10px">Manifiesto ${despacho.numeroManifiesto} — ${fecha}${mostrarAgencia ? ` — ${despacho.nombreAgencia || ''}` : ''}</div>`

  if (despacho.sacas?.length) {
    for (const saca of despacho.sacas) {
      html += generarHTMLSaca(saca)
    }
  }

  return html
}

/** Genera un bloque saca con tabla alineada al documento de despacho (col-guia, col-dest, col-dir, col-city, col-cant, col-tel, col-obs, col-firma). */
function generarHTMLSaca(saca: SacaDetalle): string {
  const paquetes = saca.paquetes || []
  const paquetesHTML = paquetes.length
    ? paquetes
        .map(
          (p: PaqueteDetalle) => `
            <tr>
              <td class="col-guia">${p.numeroGuia || '-'}</td>
              <td class="col-dest">${p.nombreClienteDestinatario || '-'}</td>
              <td class="col-dir">${p.direccionDestinatarioCompleta || '-'}</td>
              <td class="col-city">${p.provinciaDestinatario || '-'}</td>
              <td class="col-cant">${p.cantonDestinatario || '-'}</td>
              <td class="col-tel">${p.telefonoDestinatario || '-'}</td>
              <td class="col-obs">${observacionesParaDespacho(p.observaciones)}</td>
              <td class="col-firma"></td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="8" style="text-align:center; color:#999; padding:8px;">Sin paquetes</td></tr>'

  return `
    <div class="saca-block">
      <div class="saca-header">
        Saca #${saca.numeroOrden} ${saca.codigoQr ? `(${saca.codigoQr})` : ''}
        <span style="font-weight:normal; color:#666">Tamaño: ${saca.tamano || '-'} | Paquetes: ${saca.cantidadPaquetes}</span>
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
            <th class="col-firma">Firma</th>
          </tr>
        </thead>
        <tbody>
          ${paquetesHTML}
        </tbody>
      </table>
    </div>
  `
}

/** Devuelve la lista de despachos filtrada y en el mismo orden que la impresión (agencias primero, luego destinatarios directos). */
function getDespachosOrdenadosParaPDF(
  despachos: DespachoDetalle[],
  agruparPorAgencia: boolean,
  tipoFiltro: 'todos' | 'agencias' | 'destinatarios-directos'
): DespachoDetalle[] {
  let despachosDirectos = despachos.filter((d) => d.esDestinatarioDirecto === true)
  let despachosNormales = despachos.filter((d) => !d.esDestinatarioDirecto)
  if (tipoFiltro === 'agencias') despachosDirectos = []
  else if (tipoFiltro === 'destinatarios-directos') despachosNormales = []

  const result: DespachoDetalle[] = []
  if (despachosNormales.length > 0) {
    if (agruparPorAgencia) {
      const porAgencia = new Map<string, DespachoDetalle[]>()
      for (const d of despachosNormales) {
        const key = `${d.nombreAgencia || 'Sin Agencia'}${d.cantonAgencia ? ` - ${d.cantonAgencia}` : ''}`
        if (!porAgencia.has(key)) porAgencia.set(key, [])
        porAgencia.get(key)!.push(d)
      }
      for (const [, arr] of porAgencia.entries()) result.push(...arr)
    } else {
      result.push(...despachosNormales)
    }
  }
  if (despachosDirectos.length > 0) {
    const porDest = new Map<string, DespachoDetalle[]>()
    for (const d of despachosDirectos) {
      const nombre = d.nombreDestinatarioDirecto || 'Sin Nombre'
      if (!porDest.has(nombre)) porDest.set(nombre, [])
      porDest.get(nombre)!.push(d)
    }
    for (const [, arr] of porDest.entries()) result.push(...arr)
  }
  return result
}

/** Genera y descarga el PDF del manifiesto consolidado con la misma estructura que el documento de despacho. */
export async function generarPDFManifiestoConsolidado(
  manifiesto: ManifiestoConsolidadoDetalle,
  tipoFiltro: 'todos' | 'agencias' | 'destinatarios-directos' = 'todos',
  nombreAgenciaOrigen?: string
) {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const MARGIN_X = PDF_MARGINS.x
  const MARGIN_Y = PDF_MARGINS.y
  const PAGE_WIDTH = 297 - MARGIN_X * 2

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
    doc.setTextColor(PDF_COLORS.text.primary)
  }

  let currentY = MARGIN_Y

  try {
    const logo = await loadImage('/logo.png')
    const targetHeight = 12
    const logoWidth = Math.min(53, targetHeight * (logo.width / logo.height))
    doc.addImage(logo.data, 'PNG', MARGIN_X, currentY, logoWidth, targetHeight)
  } catch (e) {
    console.error('No se pudo cargar el logo', e)
  }

  const tituloPrincipal =
    manifiesto.idAgencia == null ? 'MANIFIESTO CONSOLIDADO' : 'MANIFIESTO DE AGENCIA'
  const titleX = MARGIN_X + 18
  text(tituloPrincipal, titleX, currentY + 5, PDF_FONTS.sizes.title, 'bold')
  text(tituloOrigen, titleX, currentY + 10, PDF_FONTS.sizes.subtitle, 'normal', 'left', PDF_COLORS.text.secondary)
  text(`Total Sacas: ${manifiesto.totales.totalSacas}`, MARGIN_X + PAGE_WIDTH, currentY + 5, PDF_FONTS.sizes.normal, 'bold', 'right')
  text(`Total Paquetes: ${manifiesto.totales.totalPaquetes}`, MARGIN_X + PAGE_WIDTH, currentY + 10, PDF_FONTS.sizes.normal, 'bold', 'right')

  currentY += 15
  doc.setDrawColor(PDF_COLORS.border.normal)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
  currentY += 5
  const periodoTexto = formatearPeriodo(manifiesto)
  const fechaGeneracion = manifiesto.fechaGeneracion
    ? new Date(manifiesto.fechaGeneracion).toLocaleString('es-ES')
    : 'N/A'
  text(`Generado: ${fechaGeneracion}`, MARGIN_X + PAGE_WIDTH, currentY, PDF_FONTS.sizes.small, 'normal', 'right', PDF_COLORS.text.secondary)
  currentY += 5

  const gridHeight = 22
  doc.setFillColor(PDF_COLORS.background.pill)
  doc.setDrawColor(PDF_COLORS.border.normal)
  doc.rect(MARGIN_X, currentY, PAGE_WIDTH, gridHeight, 'FD')
  const colGap = 4
  const numCols = 4
  const colWidth = (PAGE_WIDTH - colGap * (numCols - 1) - 4) / numCols
  let colX = MARGIN_X + 2
  text('MANIFIESTO #', colX, currentY + 4, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(manifiesto.numeroManifiesto || 'N/A', colX, currentY + 8, PDF_FONTS.sizes.subtitle, 'normal')
  colX += colWidth + colGap
  text('AGENCIA / ENTIDAD', colX, currentY + 4, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  doc.setFontSize(PDF_FONTS.sizes.normal)
  doc.text(
    `${manifiesto.nombreAgencia || 'Todas'}${manifiesto.codigoAgencia ? ` (${manifiesto.codigoAgencia})` : ''}`,
    colX,
    currentY + 8,
    { maxWidth: colWidth - 2 }
  )
  colX += colWidth + colGap
  text('UBICACIÓN', colX, currentY + 4, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  text(manifiesto.cantonAgencia || '-', colX, currentY + 8, PDF_FONTS.sizes.subtitle, 'normal')
  colX += colWidth + colGap
  text('PERÍODO', colX, currentY + 4, PDF_FONTS.sizes.tiny, 'bold', 'left', PDF_COLORS.text.muted)
  doc.setFontSize(PDF_FONTS.sizes.normal)
  doc.text(periodoTexto, colX, currentY + 8, { maxWidth: colWidth - 2 })
  currentY += gridHeight + 5

  const warningHeight = 8
  doc.setFillColor(PDF_COLORS.background.warning)
  doc.setDrawColor(PDF_COLORS.warning.border)
  doc.rect(MARGIN_X, currentY, PAGE_WIDTH, warningHeight, 'FD')
  text(
    'Priorice la columna Observaciones para confirmar el destino. Si no hay observaciones, guíese por los datos de dirección regular.',
    MARGIN_X + PAGE_WIDTH / 2,
    currentY + 5,
    PDF_FONTS.sizes.normal,
    'normal',
    'center',
    PDF_COLORS.warning.text
  )
  currentY += warningHeight + 8

  text('Detalle de Sacas', MARGIN_X, currentY, PDF_FONTS.sizes.section, 'bold')
  currentY += 2
  doc.setDrawColor(PDF_COLORS.border.normal)
  doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
  currentY += 5

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
    { t: 'FIRMA', w: colFirma },
  ]

  const despachosOrdenados = getDespachosOrdenadosParaPDF(
    manifiesto.despachos || [],
    manifiesto.idAgencia == null,
    tipoFiltro
  )

  for (const despacho of despachosOrdenados) {
    const fechaDespacho = new Date(despacho.fechaDespacho).toLocaleDateString('es-ES')
    if (currentY > MARGIN_Y + 30) {
      doc.setFont(PDF_FONTS.family, 'bold')
      doc.setFontSize(PDF_FONTS.sizes.subtitle)
      doc.text(`Manifiesto ${despacho.numeroManifiesto} — ${fechaDespacho}`, MARGIN_X, currentY)
      currentY += 6
    }

    const sacas = [...(despacho.sacas || [])].sort((a, b) => a.numeroOrden - b.numeroOrden)
    for (const saca of sacas) {
      let sacaHeaderY = currentY
      const drawSacaSectionHeaders = () => {
        sacaHeaderY = currentY
        doc.setFillColor(PDF_COLORS.background.pill)
        doc.setDrawColor(PDF_COLORS.border.normal)
        doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, 7, 'FD')
        doc.setFont(PDF_FONTS.family, 'bold')
        doc.setFontSize(PDF_FONTS.sizes.normal)
        doc.text(
          `Saca #${saca.numeroOrden} ${saca.codigoQr ? `(${saca.codigoQr})` : ''}`,
          MARGIN_X + 2,
          sacaHeaderY + 4.5
        )
        doc.setFont(PDF_FONTS.family, 'normal')
        doc.setTextColor(PDF_COLORS.text.secondary)
        doc.text(
          `Tamaño: ${saca.tamano || '-'} | Paquetes: ${saca.cantidadPaquetes}`,
          MARGIN_X + PAGE_WIDTH - 2,
          sacaHeaderY + 4.5,
          { align: 'right' }
        )
        doc.setTextColor(PDF_COLORS.text.primary)
        currentY += 7

        let headerX = MARGIN_X + 2
        doc.setFont(PDF_FONTS.family, 'bold')
        doc.setFontSize(PDF_FONTS.sizes.tiny)
        doc.setTextColor(PDF_COLORS.text.secondary)
        cols.forEach((c) => {
          doc.text(c.t, headerX, currentY + 4)
          headerX += c.w
        })
        currentY += 6
        doc.setDrawColor(PDF_COLORS.border.normal)
        doc.line(MARGIN_X, currentY - 1, MARGIN_X + PAGE_WIDTH, currentY - 1)
        doc.setFont(PDF_FONTS.family, 'normal')
        doc.setTextColor(PDF_COLORS.text.primary)
      }

      drawSacaSectionHeaders()

      const paquetes = saca.paquetes || []
      if (paquetes.length === 0) {
        doc.text('Sin paquetes', MARGIN_X + PAGE_WIDTH / 2, currentY + 4, { align: 'center' })
        currentY += 8
      } else {
        for (const p of paquetes) {
          const d = [
            p.numeroGuia || '-',
            p.nombreClienteDestinatario || '-',
            p.direccionDestinatarioCompleta || '-',
            p.provinciaDestinatario || '-',
            p.cantonDestinatario || '-',
            p.telefonoDestinatario || '-',
            observacionesParaDespacho(p.observaciones),
          ]
          const dirLines = doc.splitTextToSize(String(d[2]), colDir - 2)
          const obsLines = doc.splitTextToSize(String(d[6]), colObs - 2)
          const destLines = doc.splitTextToSize(String(d[1]), colDest - 2)
          const maxLines = Math.max(dirLines.length, obsLines.length, destLines.length, 1)
          const rowHeight = Math.max(6, maxLines * 3 + 2)
          if (currentY + rowHeight > 195) {
            doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, currentY - sacaHeaderY)
            doc.addPage('a4', 'landscape')
            currentY = MARGIN_Y
            drawSacaSectionHeaders()
          }

          let x = MARGIN_X + 2
          doc.setFont('courier', 'normal')
          doc.text(String(d[0]), x, currentY + 3)
          x += colGuia
          doc.setFont(PDF_FONTS.family, 'normal')
          doc.text(destLines, x, currentY + 3)
          x += colDest
          doc.text(dirLines, x, currentY + 3)
          x += colDir
          doc.text(String(d[3]), x, currentY + 3)
          x += colCity
          doc.text(String(d[4]), x, currentY + 3)
          x += colCant
          doc.text(String(d[5]), x, currentY + 3)
          x += colTel
          doc.setTextColor(PDF_COLORS.text.secondary)
          doc.setFont(PDF_FONTS.family, 'italic')
          doc.text(obsLines, x, currentY + 3)
          doc.setTextColor(PDF_COLORS.text.primary)
          doc.setFont(PDF_FONTS.family, 'normal')
          currentY += rowHeight
          doc.setDrawColor(PDF_COLORS.border.light)
          doc.line(MARGIN_X, currentY, MARGIN_X + PAGE_WIDTH, currentY)
        }
      }
      doc.setDrawColor(PDF_COLORS.border.normal)
      doc.rect(MARGIN_X, sacaHeaderY, PAGE_WIDTH, currentY - sacaHeaderY)
      currentY += 8
    }
  }

  const nombreArchivo = `manifiesto-consolidado-${manifiesto.numeroManifiesto || manifiesto.idManifiestoConsolidado}.pdf`
  doc.save(nombreArchivo)
}
