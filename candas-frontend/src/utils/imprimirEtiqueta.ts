import type { Paquete } from '@/types/paquete'

// Estilos compartidos para impresión
const STYLES = `
  @page {
    size: A4;
    margin: 0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #fff;
  }
  .etiquetas-container {
    display: flex;
    flex-direction: column;
    width: 210mm;
    height: 297mm;
    padding: 0;
    page-break-after: always;
  }
  .etiqueta-wrapper {
    width: 210mm;
    height: 49.5mm; /* 297mm / 6 */
    border-bottom: 1px dashed #ccc;
    padding: 4mm 8mm;
    display: flex;
    flex-direction: row;
    gap: 4mm;
    background-color: #fff;
    page-break-inside: avoid;
    position: relative;
    overflow: hidden;
  }
  .etiqueta-wrapper:last-child {
    border-bottom: none;
  }
  
  /* Agencia Header - Floating Top Right or Center */
  .agencia-header {
    position: absolute;
    top: 3mm;
    right: 8mm;
    font-size: 10pt;
    font-weight: 700;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Left Column: Barcode & Guide */
  .etiqueta-left {
    flex: 0 0 45%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-right: 4mm;
    border-right: 1px solid #eee;
  }
  .barcode-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 1mm;
  }
  .barcode-svg {
    width: 100%;
    max-width: 260px;
    height: auto;
  }
  .numero-guia {
    font-size: 24pt;
    font-weight: 800;
    font-family: 'Courier New', monospace;
    text-align: center;
    color: #000;
    letter-spacing: -0.5px;
    line-height: 1;
  }
  .numero-master {
     font-size: 8pt;
     color: #666;
     margin-top: 2mm;
  }

  /* Right Column: Destination Info */
  .etiqueta-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding-left: 2mm;
    text-align: left;
  }
  
  .destinatario-label {
    font-size: 7pt;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5mm;
  }
  
  .destinatario-nombre {
    font-size: 11pt;
    font-weight: 700;
    color: #000;
    margin-bottom: 1mm;
    line-height: 1.2;
    text-transform: uppercase;
  }
  
  .destinatario-direccion {
    font-size: 9pt;
    line-height: 1.3;
    color: #333;
    margin-bottom: 2mm;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .destinatario-contacto {
    font-size: 9pt;
    color: #000;
    margin-bottom: 2mm;
    font-weight: 500;
  }
  
  .destinatario-ubicacion {
    font-size: 10pt;
    font-weight: 700;
    color: #000;
    text-transform: uppercase;
    margin-top: auto;
    border-top: 1px solid #eee;
    padding-top: 1mm;
    width: 100%;
  }
  
  .destinatario-ci {
    font-size: 8pt;
    color: #666;
    margin-top: 1mm;
  }

  @media print {
    * {
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }
    body { margin: 0; }
    .etiqueta-wrapper {
        border-bottom: 1px dashed #ccc;
    }
  }
`

// Helper para obtener datos limpios
function getEtiquetaData(paquete: Paquete) {
  const direccionDestinatario = [
    paquete.ciudadDestinatario,
    paquete.paisDestinatario,
    paquete.cantonDestinatario
  ].filter(Boolean).join(' - ')

  const nombreDestinatario = paquete.nombreClienteDestinatario || 'N/A'
  const direccionCompleta = paquete.direccionDestinatarioCompleta || paquete.direccionDestinatario || ''
  const telefono = paquete.telefonoDestinatario || ''
  const documento = paquete.documentoDestinatario || ''

  const agenciaOficina = paquete.nombreAgenciaDestino || paquete.nombrePuntoOrigen || 'N/A'
  const cantonAgencia = paquete.cantonAgenciaDestino || ''
  const nombreAgencia = agenciaOficina && agenciaOficina !== 'N/A'
    ? `${agenciaOficina}${cantonAgencia ? ` - ${cantonAgencia}` : ''}`
    : ''

  const numeroGuia = paquete.numeroGuia || paquete.idPaquete?.toString() || ''
  const master = paquete.numeroMaster ? `MASTER: ${paquete.numeroMaster}` : ''

  return {
    nombreDestinatario,
    direccionCompleta,
    telefono,
    direccionDestinatario, // Ciudad - Pais - Canton
    documento,
    nombreAgencia,
    numeroGuia,
    master
  }
}

// Genera el HTML de una sola etiqueta
function generarEtiquetaHTML(paquete: Paquete, index: number): string {
  const data = getEtiquetaData(paquete)

  return `
    <div class="etiqueta-wrapper">
      ${data.nombreAgencia ? `<div class="agencia-header">${data.nombreAgencia}</div>` : ''}
      
      <div class="etiqueta-left">
        <div class="barcode-container">
          <svg id="barcode-${index}" class="barcode-svg"></svg>
        </div>
        <div class="numero-guia">${data.numeroGuia}</div>
        ${data.master ? `<div class="numero-master">${data.master}</div>` : ''}
      </div>

      <div class="etiqueta-right">
        <div class="destinatario-label">DESTINATARIO</div>
        <div class="destinatario-nombre">${data.nombreDestinatario}</div>
        
        ${data.direccionCompleta ? `<div class="destinatario-direccion">${data.direccionCompleta}</div>` : ''}
        
        ${data.telefono ? `<div class="destinatario-contacto">Telf: ${data.telefono}</div>` : ''}
        
        <div class="destinatario-ubicacion">
            ${data.direccionDestinatario}
        </div>
        
        ${data.documento ? `<div class="destinatario-ci">C.I.: ${data.documento}</div>` : ''}
      </div>
    </div>
  `
}

function openPrintWindow(content: string, numerosGuia: string[]) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Etiquetas</title>
          <meta charset="UTF-8">
          <style>${STYLES}</style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          ${content}
          <script>
            (function() {
              const numerosGuia = ${JSON.stringify(numerosGuia)};
              if (typeof JsBarcode !== 'undefined') {
                numerosGuia.forEach(function(numeroGuia, index) {
                  if (numeroGuia) {
                    const svg = document.getElementById('barcode-' + index);
                    if (svg) {
                      try {
                        JsBarcode(svg, numeroGuia, {
                          format: 'CODE128',
                          width: 3,
                          height: 60,
                          displayValue: false,
                          margin: 0
                        });
                      } catch (e) { console.error(e); }
                    }
                  }
                });
              }
              
              setTimeout(function() {
                window.print();
                // Opcional: window.close(); 
              }, 800);
            })();
          </script>
        </body>
      </html>
    `
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

export function imprimirEtiqueta(paquete: Paquete) {
  const content = `
    <div class="etiquetas-container">
        ${generarEtiquetaHTML(paquete, 0)}
    </div>
  `
  openPrintWindow(content, [paquete.numeroGuia || ''])
}

export function imprimirEtiquetasMultiples(paquetes: Paquete[]) {
  if (paquetes.length === 0) {
    alert('No hay paquetes para imprimir')
    return
  }

  // Agrupar de 6 en 6
  let content = ''
  paquetes.forEach((paquete, index) => {
    const esInicio = index % 6 === 0
    const esFin = (index + 1) % 6 === 0 || index === paquetes.length - 1

    if (esInicio) content += '<div class="etiquetas-container">'
    content += generarEtiquetaHTML(paquete, index)
    if (esFin) content += '</div>'
  })

  const numerosGuia = paquetes.map(p => p.numeroGuia || '')
  openPrintWindow(content, numerosGuia)
}
