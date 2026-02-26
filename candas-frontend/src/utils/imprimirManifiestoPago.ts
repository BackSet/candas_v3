import type {
  ManifiestoConsolidadoDetalle,
  DespachoDetalle,
  SacaDetalle,
} from '@/types/manifiesto-consolidado'
import { observacionesParaDespacho } from '@/utils/observacionesDespacho'

export function imprimirManifiestoConsolidado(
  manifiesto: ManifiestoConsolidadoDetalle,
  nombreAgenciaOrigen?: string
) {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Manifiesto de Pago - ${manifiesto.numeroManifiesto || 'Reporte'}</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { 
             size: A4 landscape; 
             margin: 10mm; 
          }
          
          * {
             box-sizing: border-box;
          }
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            font-size: 8pt; 
            line-height: 1.3; 
            color: #111;
            background-color: #fff;
          }

          /* Header Styles */
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 12px;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .doc-logo {
            height: 45px !important;
            max-height: 45px !important;
            width: auto !important;
            max-width: 200px !important;
            object-fit: contain !important;
            flex-shrink: 0 !important;
          }

          .doc-title h1 {
            font-size: 14pt;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: -0.3px;
          }
          
          .doc-title h2 {
            font-size: 9pt;
            font-weight: 500;
            color: #555;
            margin: 3px 0 0 0;
            text-transform: uppercase;
          }

          .doc-subtitle {
             font-size: 8pt;
             color: #666;
          }

          /* Info Grid */
          .info-grid {
             display: grid;
             grid-template-columns: repeat(4, 1fr);
             gap: 15px;
             margin-bottom: 20px;
             padding: 10px;
             background: #f9fafb;
             border: 1px solid #e5e7eb;
             border-radius: 4px;
          }

          .info-item {
             display: flex;
             flex-direction: column;
             gap: 2px;
          }

          .info-label {
             font-size: 7pt;
             text-transform: uppercase;
             color: #6b7280;
             font-weight: 600;
          }

          .info-value {
             font-size: 9pt;
             font-weight: 500;
          }

          /* Totales */
          .totales-section {
             display: flex;
             gap: 20px;
             padding: 8px 12px;
             margin-bottom: 20px;
             border: 1px solid #000;
             border-radius: 4px;
             background: #fff;
          }

          .total-item {
             font-size: 9pt; 
             font-weight: 600;
          }

          .warning-box {
             padding: 8px 12px;
             margin-bottom: 15px;
             border: 1px solid #e5e7eb;
             background: #fffbeb;
             color: #92400e;
             font-size: 8pt;
             border-radius: 4px;
             text-align: center;
          }

          /* Content Sections */
          .agencia-group {
             margin-bottom: 20px;
             page-break-inside: avoid;
          }

          .agencia-header {
             font-size: 10pt;
             font-weight: 700;
             padding: 6px 0;
             border-bottom: 1px solid #000;
             margin-bottom: 10px;
             display: flex;
             justify-content: space-between;
             align-items: center;
          }
          
          .agencia-stats {
             font-size: 8pt;
             font-weight: normal;
             color: #444;
          }

          .despacho-block {
             margin-bottom: 15px;
             border: 1px solid #e5e7eb;
             border-radius: 4px;
             overflow: hidden;
          }

          .despacho-header {
             background: #f3f4f6;
             padding: 5px 10px;
             font-size: 8pt;
             font-weight: 600;
             border-bottom: 1px solid #e5e7eb;
             display: flex;
             flex-wrap: wrap;
             gap: 12px;
          }
          
          .dh-item { display: flex; gap: 4px; }
          .dh-label { color: #666; }

          .saca-block { border-top: 1px solid #e5e7eb; }
          .saca-block:first-child { border-top: none; }

          .saca-header {
             padding: 4px 10px;
             background: #fafafa;
             font-size: 7.5pt;
             font-weight: 600;
             color: #444;
             border-bottom: 1px solid #e5e7eb;
             display: flex;
             justify-content: space-between;
          }

          /* Table */
          .paquetes-table {
             width: 100%;
             border-collapse: collapse;
             font-size: 7pt;
          }

          .paquetes-table th {
             text-align: left;
             padding: 4px 8px;
             font-weight: 600;
             color: #444;
             border-bottom: 1px solid #e5e7eb;
             background: #fff;
             text-transform: uppercase;
          }

          .paquetes-table td {
             padding: 4px 8px;
             border-bottom: 1px solid #f3f4f6;
             vertical-align: top;
          }

          .paquetes-table tr:last-child td {
             border-bottom: none;
          }
          
          .col-firma {
             width: 10%;
             border: 1px dashed #ccc;
             min-width: 80px;
          }

          @media print {
             .agencia-group { page-break-inside: auto; }
             .despacho-block { page-break-inside: avoid; }
             .doc-header { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
           <div class="header-left">
              <img src="/logo.png" class="doc-logo" alt="Logo" />
              <div class="doc-title">
                  <h1>${manifiesto.idAgencia == null ? 'Manifiesto de Pago - Global' : 'Manifiesto de Pago'}</h1>
                  <h2>${tituloOrigen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
              </div>
           </div>
           <div class="doc-subtitle">
              Generado: ${fechaGeneracion}
           </div>
        </div>

        <div class="info-grid">
           <div class="info-item">
              <span class="info-label">Manifiesto #</span>
              <span class="info-value font-mono">${manifiesto.numeroManifiesto || '-'}</span>
           </div>
           <div class="info-item">
              <span class="info-label">Agencia/Entidad</span>
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

        <div class="totales-section">
           <div class="total-item">Despachos: ${manifiesto.totales.totalDespachos}</div>
           <div class="total-item">Sacas: ${manifiesto.totales.totalSacas}</div>
           <div class="total-item">Paquetes: ${manifiesto.totales.totalPaquetes}</div>
        </div>

        <div class="warning-box">
           ⚠️ Priorice la columna Observaciones para confirmar el destino. Si no hay observaciones, guíese por los datos de dirección regular.
        </div>

        ${generarHTMLDespachos(manifiesto.despachos, manifiesto.idAgencia == null)}

        <script>
           window.onload = () => {
              setTimeout(() => {
                 window.print();
                 window.onafterprint = () => window.close();
              }, 500);
           }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

// Back-compat: algunos hooks todavía importan "imprimirManifiestoPago"
// (en realidad imprime el mismo formato consolidado).
export function imprimirManifiestoPago(manifiesto: any, nombreAgenciaOrigen?: string) {
  imprimirManifiestoConsolidado(manifiesto as ManifiestoConsolidadoDetalle, nombreAgenciaOrigen)
}

function formatearPeriodo(manifiesto: ManifiestoConsolidadoDetalle): string {
  if (manifiesto.fechaInicio && manifiesto.fechaFin) {
    const inicio = new Date(manifiesto.fechaInicio).toLocaleDateString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
    const fin = new Date(manifiesto.fechaFin).toLocaleDateString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
    return `${inicio} - ${fin}`
  } else if (manifiesto.mes && manifiesto.anio) {
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${meses[manifiesto.mes]} ${manifiesto.anio}`
  }
  return '-'
}

function generarHTMLDespachos(despachos: DespachoDetalle[], agruparPorAgencia: boolean): string {
  if (agruparPorAgencia) {
    const despachosPorAgencia = new Map<string, DespachoDetalle[]>()
    for (const despacho of despachos) {
      const nombreAgencia = despacho.nombreAgencia || 'Sin Agencia'
      const cantonAgencia = despacho.cantonAgencia || ''
      const keyAgencia = `${nombreAgencia}${cantonAgencia ? ` - ${cantonAgencia}` : ''}`
      if (!despachosPorAgencia.has(keyAgencia)) despachosPorAgencia.set(keyAgencia, [])
      despachosPorAgencia.get(keyAgencia)!.push(despacho)
    }

    let html = ''
    for (const [keyAgencia, despachosAgencia] of despachosPorAgencia.entries()) {
      const stats = {
        despachos: despachosAgencia.length,
        sacas: despachosAgencia.reduce((acc, d) => acc + (d.totalSacas || 0), 0),
        paquetes: despachosAgencia.reduce((acc, d) => acc + (d.totalPaquetes || 0), 0)
      }

      html += `
        <div class="agencia-group">
          <div class="agencia-header">
             <span>${keyAgencia}</span>
             <span class="agencia-stats">
                Desp: ${stats.despachos} | Sacas: ${stats.sacas} | Paq: ${stats.paquetes}
             </span>
          </div>
      `
      html += despachosAgencia.map(d => generarHTMLDespacho(d, false)).join('')
      html += '</div>'
    }
    return html
  } else {
    return `<div class="agencia-group">${despachos.map(d => generarHTMLDespacho(d, false)).join('')}</div>`
  }
}

function generarHTMLDespacho(despacho: DespachoDetalle, mostrarAgencia: boolean): string {
  const fecha = new Date(despacho.fechaDespacho).toLocaleDateString()

  let html = `
    <div class="despacho-block">
      <div class="despacho-header">
         ${mostrarAgencia ? `<div class="dh-item"><span class="dh-label">Agencia:</span><span>${despacho.nombreAgencia}</span></div>` : ''}
         <div class="dh-item"><span class="dh-label">Manifiesto:</span><span style="font-family:monospace">${despacho.numeroManifiesto}</span></div>
         <div class="dh-item"><span class="dh-label">Fecha:</span><span>${fecha}</span></div>
         ${despacho.nombreDistribuidor ? `<div class="dh-item"><span class="dh-label">Dist:</span><span>${despacho.nombreDistribuidor}</span></div>` : ''}
         <div class="dh-item" style="margin-left: auto"><span class="dh-label">Total:</span><span>${despacho.totalPaquetes} paq / ${despacho.totalSacas} sacas</span></div>
      </div>
  `

  if (despacho.sacas?.length) {
    for (const saca of despacho.sacas) {
      html += generarHTMLSaca(saca)
    }
  }

  html += '</div>'
  return html
}

function generarHTMLSaca(saca: SacaDetalle): string {
  let html = `
    <div class="saca-block">
      <div class="saca-header">
         <span>Saca #${saca.numeroOrden}</span>
         <span>Total: ${saca.cantidadPaquetes}</span>
      </div>

      <table class="paquetes-table">
        <thead>
          <tr>
            <th style="width:10%">Guía</th>
            <th style="width:15%">Destinatario</th>
            <th style="width:20%">Dirección</th>
            <th style="width:8%">Ciudad</th>
            <th style="width:8%">Provincia</th>
            <th style="width:8%">Cantón</th>
            <th style="width:10%">Teléfono</th>
            <th style="width:11%">Observaciones</th>
            <th style="width:10%">Firma</th>
          </tr>
        </thead>
        <tbody>
  `

  if (saca.paquetes && saca.paquetes.length > 0) {
    for (const p of saca.paquetes) {
      html += `
        <tr>
          <td>${p.numeroGuia || '-'}</td>
          <td>${p.nombreClienteDestinatario || '-'}</td>
          <td>${p.direccionDestinatarioCompleta || '-'}</td>
          <td>${p.ciudadDestinatario || '-'}</td>
          <td>${p.paisDestinatario || '-'}</td>
          <td>${p.cantonDestinatario || '-'}</td>
          <td>${p.telefonoDestinatario || '-'}</td>
          <td style="font-style:italic; color:#555">${observacionesParaDespacho(p.observaciones)}</td>
          <td class="col-firma"></td>
        </tr>
      `
    }
  } else {
    html += '<tr><td colspan="9" style="text-align:center; padding:8px; color:#999;">Sin paquetes</td></tr>'
  }

  html += `
        </tbody>
      </table>
    </div>
  `

  return html
}
