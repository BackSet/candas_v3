import type { Saca } from '@/types/saca'
import type { Despacho } from '@/types/despacho'
import type { Agencia } from '@/types/agencia'
import type { Distribuidor } from '@/types/distribuidor'
import QRCode from 'qrcode'
import { PRINT_CSS_BASE } from './printTheme'

// Función auxiliar para generar HTML de una etiqueta individual
export function generarEtiquetaHTML(
  saca: Saca,
  despacho: Despacho,
  agencia: Agencia | undefined,
  distribuidor: Distribuidor | undefined,
  orden: number,
  totalSacas: number,
  qrDataURL: string,
  mostrarLeyendaManifiesto: boolean = false,
  nombreAgenciaOrigen?: string
): string {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'

  const ordenTexto = `${orden}/${totalSacas}`
  const numeroPaquetes = saca.idPaquetes?.length || 0

  // Determinar si es destinatario directo o agencia
  const esDestinatarioDirecto = despacho.despachoDirecto?.destinatarioDirecto !== undefined

  let destinoLabel: string
  let destinoNombre: string
  let destinoTelefono: string
  let destinoEncargado: string = ''

  if (esDestinatarioDirecto) {
    const dd = despacho.despachoDirecto!.destinatarioDirecto!
    destinoLabel = 'Destinatario:'
    destinoNombre = dd.nombreDestinatario || 'N/A'
    destinoTelefono = dd.telefonoDestinatario || 'N/A'
    // No hay encargado para destinatario directo
  } else {
    destinoLabel = 'Agencia:'
    destinoNombre = agencia?.nombre ? `${agencia.nombre}${agencia.canton ? ` - ${agencia.canton}` : ''}` : 'N/A'
    destinoTelefono = agencia?.telefonos?.find(t => t.principal)?.numero ||
      agencia?.telefonos?.[0]?.numero || 'N/A'
    destinoEncargado = agencia?.nombrePersonal || ''
  }

  // Datos de agencia de distribución
  const nombreDistribuidor = distribuidor?.nombre || 'N/A'
  const numeroGuiaAgenciaDistribucion = despacho.numeroGuiaAgenciaDistribucion || 'N/A'

  return `
    <div class="etiqueta-wrapper">
      ${mostrarLeyendaManifiesto ? '<div class="leyenda-manifiesto">MANIFIESTO IMPRESO</div>' : ''}
      
      <div class="column-left">
         <div class="qr-box">
            <img src="${qrDataURL}" alt="QR" />
         </div>
      </div>
      
      <div class="column-center">
         <div class="header-row">
            <img src="/logo.png" class="logo-img" alt="Logo" />
            <div class="header-text">
               <strong>${tituloOrigen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>
            </div>
         </div>
         
         <div class="info-group">
            <div class="line">
               <span class="label">${destinoLabel}</span>
               <span class="value lg">${destinoNombre}</span>
            </div>
            ${destinoEncargado ? `
            <div class="line">
               <span class="label">Encargado:</span>
               <span class="value">${destinoEncargado}</span>
            </div>` : ''}
            <div class="line">
               <span class="label">Teléfono:</span>
               <span class="value">${destinoTelefono}</span>
            </div>
            <div class="splitter"></div>
            <div class="line">
               <span class="label">Distribuidor:</span>
               <span class="value">${nombreDistribuidor}</span>
            </div>
            <div class="line">
               <span class="label">Guía:</span>
               <span class="value font-mono">${numeroGuiaAgenciaDistribucion}</span>
            </div>
         </div>
      </div>
      
      <div class="column-right">
         <div class="counter-box">
            <div class="counter-main">${ordenTexto}</div>
            <div class="counter-sub">${numeroPaquetes} paq</div>
         </div>
      </div>
    </div>
  `
}

/** Genera un token de seguridad único basado en los datos del despacho y la saca. */
export function generarTokenSeguridad(saca: Saca, despacho: Despacho): string {
  const seed = `${despacho.idDespacho}-${saca.idSaca}-${despacho.fechaDespacho}-${saca.numeroOrden}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return `SEA-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

/** Genera HTML de una etiqueta Zebra (layout compacto térmico) con un diseño ultra-optimizado. */
export function generarEtiquetaZebraHTML(
  saca: Saca,
  despacho: Despacho,
  agencia: Agencia | undefined,
  distribuidor: Distribuidor | undefined,
  orden: number,
  totalSacas: number,
  qrDataURL: string,
  codigoPresinto: string,
  mostrarLeyendaManifiesto: boolean = false,
  nombreAgenciaOrigen?: string
): string {
  const tituloOrigen = nombreAgenciaOrigen?.trim() || 'MV Services - Quito Sur'
  const ordenTexto = `${orden}/${totalSacas}`
  const numeroPaquetes = saca.idPaquetes?.length || 0
  const esDestinatarioDirecto = despacho.despachoDirecto?.destinatarioDirecto !== undefined

  let destinoNombre: string
  let destinoProvincia: string = ''
  let destinoTelefono: string
  let destinoEncargado: string = ''
  let destinoEmpresa: string = ''
  let destinoDireccion: string = ''

  if (esDestinatarioDirecto) {
    const dd = despacho.despachoDirecto!.destinatarioDirecto!
    destinoNombre = dd.nombreDestinatario || 'N/A'
    destinoTelefono = dd.telefonoDestinatario || 'N/A'
    destinoEmpresa = dd.nombreEmpresa || ''
    destinoDireccion = dd.direccionDestinatario || ''
    destinoProvincia = dd.provincia || ''
  } else {
    destinoNombre = agencia?.nombre || 'N/A'
    destinoProvincia = agencia?.provincia || ''
    destinoTelefono = agencia?.telefonos?.find(t => t.principal)?.numero || agencia?.telefonos?.[0]?.numero || 'N/A'
    destinoEncargado = agencia?.nombrePersonal || ''
  }

  const nombreDistribuidor = distribuidor?.nombre || 'N/A'
  const numeroGuia = despacho.numeroGuiaAgenciaDistribucion || 'N/A'

  return `
    <div class="zebra-label">
      <div class="zebra-inner-wrap ${mostrarLeyendaManifiesto ? 'has-manifiesto' : ''}">
        ${mostrarLeyendaManifiesto ? '<div class="manifiesto-bar">MANIFIESTO IMPRESO</div>' : ''}
        
        <!-- Top Section: Minimal Logo -->
        <div class="zebra-top-grid">
          <div class="zebra-logo-area">
            <img src="/logo.png" class="zebra-logo" alt="Logo" />
            <div class="zebra-brand">
              <span class="brand-main">${tituloOrigen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
            </div>
          </div>
        </div>

        <div class="zebra-main-content">
          <!-- Destination Section -->
          <div class="zebra-dest-box">
            <div class="zebra-tag">DESTINO</div>
            
            <div class="zebra-dest-name-container">
              ${destinoEmpresa && !esDestinatarioDirecto ? `<div class="zebra-company">${destinoEmpresa}</div>` : ''}
              <div class="zebra-dest-name ${destinoNombre.length > 35 ? 'tiny-font' : destinoNombre.length > 20 ? 'small-font' : ''}">
                ${destinoNombre}
              </div>
            </div>

            <div class="zebra-dest-footer">
              ${destinoProvincia ? `<div class="zebra-dest-city-badge">${destinoProvincia}</div>` : ''}
            </div>
          </div>

          <!-- Data Grid -->
          <div class="zebra-info-grid">
            <div class="info-item">
              <span class="info-lbl">TELÉFONO</span>
              <span class="info-val">${destinoTelefono}</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">${esDestinatarioDirecto ? (destinoEmpresa ? 'EMPRESA' : '') : 'ENCARGADO'}</span>
              <span class="info-val">${esDestinatarioDirecto ? destinoEmpresa : (destinoEncargado || '—')}</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">DISTRIBUIDOR</span>
              <span class="info-val">${nombreDistribuidor}</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">GUÍA</span>
              <span class="info-val mono">${numeroGuia}</span>
            </div>
          </div>

          <!-- Stats & QR -->
          <div class="zebra-stats-row">
            <div class="stat-box">
              <span class="stat-lbl">SACA</span>
              <span class="stat-val">${ordenTexto}</span>
            </div>
            <div class="stat-box">
              <span class="stat-lbl">PAQUETES</span>
              <span class="stat-val">${numeroPaquetes}</span>
            </div>
            <div class="stat-box qr-stat">
              <img src="${qrDataURL}" alt="QR" />
            </div>
          </div>
        </div>

        <!-- Footer: Security & Seals -->
        <div class="zebra-footer-compact">
          <div class="zebra-cut-indicator">
            <span>TIJERA PARA SELLO</span>
          </div>

          <div class="zebra-seal-box">
            <span class="seal-lbl">PRECINTO SEGURIDAD — NO REPRODUCIR</span>
            <span class="seal-code">${codigoPresinto}</span>
          </div>
        </div>
      </div>
    </div>
  `
}


/** Construye el HTML completo del documento de etiquetas normales (estilos + contenido). Usado por imprimirEtiquetaSaca, imprimirEtiquetasSacas e imprimirEtiquetasMultiplesDespachos. */
function buildEtiquetasNormalesDocument(etiquetasHTML: string, titulo: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${titulo}</title>
    <meta charset="UTF-8">
    <style>
      ${PRINT_CSS_BASE}
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; background: #fff; }
      .etiquetas-container { display: flex; flex-direction: column; width: 100%; }
      .etiqueta-wrapper {
        width: 210mm;
        height: 49.5mm;
        border-bottom: 1px dashed #e5e5e5;
        padding: 3mm 5mm;
        display: flex;
        align-items: center;
        position: relative;
        background: #fff;
        page-break-inside: avoid;
      }
      .etiqueta-wrapper:last-child { border-bottom: none; }
      .column-left { width: 40mm; display: flex; justify-content: center; align-items: center; }
      .qr-box img { width: 32mm; height: 32mm; display: block; }
      .column-center { flex: 1; padding: 0 5mm; display: flex; flex-direction: column; justify-content: center; }
      .header-row { display: flex; align-items: center; border-bottom: 1px solid #f5f5f5; margin-bottom: 3mm; padding-bottom: 1mm; gap: 3mm; }
      .logo-img { height: 8mm !important; width: auto !important; object-fit: contain !important; }
      .header-text { font-size: 10pt; font-weight: 600; text-transform: uppercase; line-height: 1; color: #171717; }
      .info-group { display: flex; flex-direction: column; gap: 1.5mm; }
      .line { display: flex; align-items: baseline; gap: 2mm; font-size: 8.5pt; line-height: 1.1; }
      .label { font-weight: 600; color: #737373; font-size: 7.5pt; min-width: 18mm; text-transform: uppercase; letter-spacing: 0.05em; }
      .value { font-weight: 500; color: #171717; }
      .value.lg { font-weight: 600; font-size: 9.5pt; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: -0.5px; }
      .splitter { height: 1px; background: #f5f5f5; margin: 1mm 0; }
      .column-right { width: 45mm; display: flex; justify-content: center; align-items: center; }
      .counter-box { border: 1px solid #e5e5e5; border-radius: 6px; width: 100%; padding: 3mm 0; text-align: center; background: #fcfcfc; }
      .counter-main { font-size: 22pt; font-weight: 700; line-height: 1; margin-bottom: 1mm; color: #171717; }
      .counter-sub { font-size: 10pt; font-weight: 500; color: #737373; text-transform: uppercase; }
      .leyenda-manifiesto {
        position: absolute; top: 2mm; right: 2mm; font-size: 7pt; font-weight: 600;
        background: #171717; color: #fff; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
      }
      @media print {
        .etiqueta-wrapper { page-break-inside: avoid; }
        .leyenda-manifiesto { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="etiquetas-container">
      ${etiquetasHTML}
    </div>
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

export async function imprimirEtiquetaSaca(
  saca: Saca,
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  totalSacas?: number,
  nombreAgenciaOrigen?: string,
  mostrarLeyendaManifiesto: boolean = false
) {
  const total = totalSacas || despacho.sacas?.length || 1
  const orden = saca.numeroOrden || 1

  const idSaca = saca.codigoQr || saca.idSaca?.toString() || ''

  // Generar QR code como data URL
  let qrDataURL = ''
  try {
    qrDataURL = await QRCode.toDataURL(idSaca, {
      width: 150,
      margin: 0,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
  } catch (error) {
    alert('Error generando código QR')
    return
  }

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  const etiquetaHTML = generarEtiquetaHTML(
    saca,
    despacho,
    agencia,
    distribuidor,
    orden,
    total,
    qrDataURL,
    mostrarLeyendaManifiesto,
    nombreAgenciaOrigen
  )
  const htmlContent = buildEtiquetasNormalesDocument(etiquetaHTML, 'Etiqueta Saca')
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

export async function imprimirEtiquetasSacas(
  sacas: Saca[],
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  indiceSacaConLeyenda?: number,
  nombreAgenciaOrigen?: string
) {
  if (sacas.length === 0) {
    alert('No hay sacas para imprimir')
    return
  }

  const totalSacas = sacas.length
  // Ordenar sacas por numeroOrden
  const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))

  // Determinar el índice de la saca con leyenda (por defecto la última)
  const indiceLeyenda = indiceSacaConLeyenda !== undefined
    ? indiceSacaConLeyenda
    : sacasOrdenadas.length - 1

  const idsSacas = sacasOrdenadas.map(s => s.codigoQr || s.idSaca?.toString() || '')

  let qrDataURLs: string[] = []
  try {
    qrDataURLs = await Promise.all(
      idsSacas.map(idSaca =>
        QRCode.toDataURL(idSaca, {
          width: 150,
          margin: 0,
          color: { dark: '#000000', light: '#FFFFFF' }
        })
      )
    )
  } catch (error) {
    alert('Error generando códigos QR')
    return
  }

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  const etiquetasHTML = sacasOrdenadas.map((saca, index) => {
    const orden = saca.numeroOrden || index + 1
    const mostrarLeyenda = index === indiceLeyenda
    return generarEtiquetaHTML(saca, despacho, agencia, distribuidor, orden, totalSacas, qrDataURLs[index], mostrarLeyenda, nombreAgenciaOrigen)
  }).join('')

  const htmlContent = buildEtiquetasNormalesDocument(etiquetasHTML, `Etiquetas Sacas - ${sacas.length} saca(s)`)
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

const ZEBRA_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

  @page { 
    size: 100mm 100mm; 
    margin: 0; 
  }
  
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  
  body { 
    font-family: 'Inter', sans-serif; 
    margin: 0; padding: 0; background: #fff; color: #000;
  }

  .zebra-labels-container { 
    display: flex; flex-direction: column; align-items: center;
  }

  .zebra-label { 
    width: 100mm; 
    height: 100mm; 
    padding: 0;
    page-break-after: always;
    background: #fff;
    position: relative;
    overflow: hidden;
  }

  .zebra-inner-wrap {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 2.5mm; /* Reduced padding slightly */
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
  }

  /* When manifiesto is present, slightly reduce gaps to fit everything */
  .zebra-inner-wrap.has-manifiesto {
    gap: 1.5mm;
  }

  .zebra-label:last-child { page-break-after: auto; }

  /* Top Grid: Logo & QR */
  .zebra-top-grid {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #000;
    padding-bottom: 1.2mm;
    flex-shrink: 0;
  }

  .zebra-logo-area {
    display: flex;
    align-items: center;
    gap: 2mm;
  }

  .zebra-logo {
    height: 6mm;
    width: auto;
    object-fit: contain;
  }

  .zebra-brand {
    display: flex;
    flex-direction: column;
    line-height: 1.05;
  }

  .brand-main {
    font-size: 10.5pt;
    font-weight: 800;
    color: #000;
  }

  .brand-sub {
    font-size: 8pt;
    font-weight: 600;
    color: #555;
    letter-spacing: 0.1px;
  }

  .manifiesto-bar {
    background: #000;
    color: #fff;
    font-size: 8.5pt;
    font-weight: 900;
    text-align: center;
    padding: 1.5mm 0;
    margin: -3.1mm -3.1mm 0.5mm -3.1mm;
    letter-spacing: 2.5px;
    -webkit-print-color-adjust: exact;
  }

  /* Main Content: Flexible but safe */
  .zebra-main-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
    overflow: hidden;
  }

  .zebra-dest-box {
    margin-bottom: 0.5mm;
  }

  .zebra-tag {
    font-size: 6.5pt;
    font-weight: 700;
    color: #666;
    letter-spacing: 1px;
    margin-bottom: 0.5mm;
  }

  .zebra-dest-box {
    margin-bottom: 2mm;
    border-left: 2mm solid #000;
    padding-left: 3mm;
  }

  .zebra-dest-name-container {
    max-height: 12mm;
    overflow: hidden;
    margin-bottom: 1mm;
  }

  .zebra-company {
    font-size: 10pt;
    font-weight: 700;
    color: #444;
    text-transform: uppercase;
    margin-bottom: 0.5mm;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .zebra-dest-name {
    font-size: 15.5pt;
    font-weight: 950;
    line-height: 1;
    text-transform: uppercase;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .zebra-dest-name.small-font {
    font-size: 12.5pt;
    -webkit-line-clamp: 3;
  }

  .zebra-dest-name.tiny-font {
    font-size: 10pt;
    -webkit-line-clamp: 2;
  }

  .zebra-dest-footer {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-top: 1.5mm;
  }

  .zebra-dest-city-badge {
    font-size: 11pt;
    font-weight: 800;
    color: #fff;
    background: #000;
    padding: 0.5mm 3mm;
    border-radius: 1mm;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Info Grid 2x2 */
  .zebra-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1mm 2.5mm;
    background: #f9f9f9;
    padding: 1.2mm;
    border-radius: 3px;
    border: 1px solid #eee;
    flex-shrink: 0;
    max-height: 18mm; /* Tight constraint */
    overflow: hidden;
  }

  .info-item { display: flex; flex-direction: column; gap: 0.1mm; min-width: 0; }
  .info-lbl { font-size: 5.5pt; font-weight: 700; color: #666; text-transform: uppercase; }
  .info-val { font-size: 9.5pt; font-weight: 800; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .info-val.mono { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; }

  /* Stats & QR Row */
  .zebra-stats-row {
    flex-shrink: 0;
    height: 16mm; /* Fixed height to prevent overlap */
    display: flex;
    gap: 1.5mm;
    margin-top: 0.5mm;
    overflow: hidden;
  }

  .stat-box {
    flex: 1;
    border: 1.5px solid #000;
    padding: 1mm;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  .stat-lbl { font-size: 7.5pt; font-weight: 700; color: #444; }
  .stat-val { font-size: 20pt; font-weight: 900; line-height: 1; margin-top: 0.5mm; }

  .qr-stat {
    padding: 1mm !important;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .qr-stat img {
    height: 100%;
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  /* Footer Section */
  .zebra-footer-compact {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1mm;
  }

  .viaje-box {
    text-align: center;
    padding: 1mm;
    background: #f0f0f0;
    border-radius: 2px;
  }

  .viaje-lbl { font-size: 5.5pt; font-weight: 700; color: #666; }
  .viaje-val { font-family: 'JetBrains Mono', monospace; font-size: 9.5pt; font-weight: 700; }

  .zebra-cut-indicator {
    border-top: 1px dashed #444;
    text-align: center;
    height: 2mm;
    position: relative;
    margin-top: 0.2mm;
  }

  .zebra-cut-indicator span {
    background: #fff;
    padding: 0 2mm;
    font-size: 4pt;
    font-weight: 800;
    position: absolute;
    top: -1.6mm;
    left: 50%;
    transform: translateX(-50%);
  }

  .zebra-seal-box {
    background: #000;
    color: #fff;
    padding: 0.8mm 1.5mm;
    text-align: center;
    border-radius: 2px;
  }

  .seal-lbl { 
    font-size: 4.2pt; 
    font-weight: 700; 
    opacity: 0.7; 
    letter-spacing: 0.5px; 
    display: block; 
    margin-bottom: 0.2mm; 
    text-transform: uppercase;
  }
  .seal-code { 
    font-family: 'JetBrains Mono', monospace; 
    font-size: 8.5pt; 
    font-weight: 800; 
    letter-spacing: 1.2px; 
  }

  .zebra-leyenda {
    display: none;
  }
`

function buildZebraPrintDocument(etiquetasHTML: string, title: string): string {
  return `<!DOCTYPE html><html><head><title>${title}</title><meta charset="UTF-8"><style>${ZEBRA_STYLES}</style></head><body><div class="zebra-labels-container">${etiquetasHTML}</div><script>window.onload=function(){setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},500);};</script></body></html>`
}

export async function imprimirEtiquetaZebraSaca(
  saca: Saca,
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  totalSacas?: number,
  nombreAgenciaOrigen?: string,
  mostrarLeyendaManifiesto: boolean = false
) {
  const total = totalSacas ?? despacho.sacas?.length ?? 1
  const orden = saca.numeroOrden ?? 1
  const codigoPresinto = despacho.codigoPresinto ?? ''
  const idSaca = saca.codigoQr || saca.idSaca?.toString() || ''
  let qrDataURL = ''
  try {
    qrDataURL = await QRCode.toDataURL(idSaca, { width: 150, margin: 0, color: { dark: '#000000', light: '#FFFFFF' } })
  } catch {
    alert('Error generando código QR')
    return
  }
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.')
    return
  }
  const etiquetaHTML = generarEtiquetaZebraHTML(
    saca,
    despacho,
    agencia,
    distribuidor,
    orden,
    total,
    qrDataURL,
    codigoPresinto,
    mostrarLeyendaManifiesto,
    nombreAgenciaOrigen
  )
  printWindow.document.write(buildZebraPrintDocument(etiquetaHTML, 'Etiqueta Zebra Saca'))
  printWindow.document.close()
}

export async function imprimirEtiquetasZebraSacas(
  sacas: Saca[],
  despacho: Despacho,
  agencia?: Agencia,
  distribuidor?: Distribuidor,
  indiceSacaConLeyenda?: number,
  nombreAgenciaOrigen?: string
) {
  if (sacas.length === 0) {
    alert('No hay sacas para imprimir')
    return
  }
  const codigoPresinto = despacho.codigoPresinto ?? ''
  const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden ?? 0) - (b.numeroOrden ?? 0))
  const totalSacas = sacasOrdenadas.length
  const indiceLeyenda = indiceSacaConLeyenda !== undefined ? indiceSacaConLeyenda : totalSacas - 1
  const idsSacas = sacasOrdenadas.map(s => s.codigoQr || s.idSaca?.toString() || '')
  let qrDataURLs: string[] = []
  try {
    qrDataURLs = await Promise.all(idsSacas.map(id => QRCode.toDataURL(id, { width: 150, margin: 0, color: { dark: '#000000', light: '#FFFFFF' } })))
  } catch {
    alert('Error generando códigos QR')
    return
  }
  const etiquetasHTML = sacasOrdenadas.map((saca, index) => {
    const orden = saca.numeroOrden ?? index + 1
    const mostrarLeyenda = index === indiceLeyenda
    return generarEtiquetaZebraHTML(saca, despacho, agencia, distribuidor, orden, totalSacas, qrDataURLs[index], codigoPresinto, mostrarLeyenda, nombreAgenciaOrigen)
  }).join('')
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.')
    return
  }
  printWindow.document.write(buildZebraPrintDocument(etiquetasHTML, `Etiquetas Zebra - ${totalSacas} saca(s)`))
  printWindow.document.close()
}

/** Imprime etiquetas Zebra para múltiples despachos (todas las sacas en un solo documento). */
export async function imprimirEtiquetasZebraMultiplesDespachos(
  datosDespachos: DatosDespachoImpresion[],
  nombreAgenciaOrigen?: string
) {
  if (datosDespachos.length === 0) {
    alert('No hay despachos para imprimir')
    return
  }

  const todosLosItems: Array<{
    saca: Saca
    despacho: Despacho
    agencia?: Agencia
    distribuidor?: Distribuidor
    mostrarLeyenda: boolean
    ordenSaca: number
    totalSacasDespacho: number
    codigoPresinto: string
  }> = []

  datosDespachos.forEach(({ sacas, despacho, agencia, distribuidor, indiceSacaConLeyenda }) => {
    const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden ?? 0) - (b.numeroOrden ?? 0))
    const totalSacasDespacho = sacasOrdenadas.length
    const indiceLeyenda =
      indiceSacaConLeyenda !== undefined ? indiceSacaConLeyenda : totalSacasDespacho - 1
    const codigoPresinto = despacho.codigoPresinto ?? ''
    sacasOrdenadas.forEach((saca, index) => {
      const ordenSaca = saca.numeroOrden ?? index + 1
      todosLosItems.push({
        saca,
        despacho,
        agencia,
        distribuidor,
        mostrarLeyenda: index === indiceLeyenda,
        ordenSaca,
        totalSacasDespacho,
        codigoPresinto
      })
    })
  })

  const idsSacas = todosLosItems.map(
    ({ saca }) => saca.codigoQr || saca.idSaca?.toString() || ''
  )
  let qrDataURLs: string[] = []
  try {
    qrDataURLs = await Promise.all(
      idsSacas.map(id =>
        QRCode.toDataURL(id, {
          width: 150,
          margin: 0,
          color: { dark: '#000000', light: '#FFFFFF' }
        })
      )
    )
  } catch {
    alert('Error generando códigos QR')
    return
  }

  const etiquetasHTML = todosLosItems
    .map((item, index) =>
      generarEtiquetaZebraHTML(
        item.saca,
        item.despacho,
        item.agencia,
        item.distribuidor,
        item.ordenSaca,
        item.totalSacasDespacho,
        qrDataURLs[index],
        item.codigoPresinto,
        item.mostrarLeyenda,
        nombreAgenciaOrigen
      )
    )
    .join('')

  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.')
    return
  }
  printWindow.document.write(
    buildZebraPrintDocument(etiquetasHTML, `Etiquetas Zebra - ${todosLosItems.length} etiqueta(s)`)
  )
  printWindow.document.close()
}

// Interfaz para los datos de un despacho en impresión múltiple
interface DatosDespachoImpresion {
  sacas: Saca[]
  despacho: Despacho
  agencia?: Agencia
  distribuidor?: Distribuidor
  indiceSacaConLeyenda?: number
}

export async function imprimirEtiquetasMultiplesDespachos(
  datosDespachos: DatosDespachoImpresion[],
  nombreAgenciaOrigen?: string
) {
  if (datosDespachos.length === 0) {
    alert('No hay despachos para imprimir')
    return
  }

  // Recopilar todas las sacas de todos los despachos
  const todasLasSacas: Array<{
    saca: Saca
    despacho: Despacho
    agencia?: Agencia
    distribuidor?: Distribuidor
    mostrarLeyenda: boolean
    ordenSaca: number
    totalSacasDespacho: number
  }> = []

  // Procesar cada despacho
  datosDespachos.forEach(({ sacas, despacho, agencia, distribuidor, indiceSacaConLeyenda }) => {
    const sacasOrdenadas = [...sacas].sort((a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0))
    const totalSacasDespacho = sacasOrdenadas.length
    const indiceLeyenda = indiceSacaConLeyenda !== undefined
      ? indiceSacaConLeyenda
      : sacasOrdenadas.length - 1

    sacasOrdenadas.forEach((saca, index) => {
      // Usar el numeroOrden original de la saca, o el índice + 1 si no tiene numeroOrden
      const ordenSaca = saca.numeroOrden || (index + 1)

      todasLasSacas.push({
        saca,
        despacho,
        agencia,
        distribuidor,
        mostrarLeyenda: index === indiceLeyenda,
        ordenSaca,
        totalSacasDespacho
      })
    })
  })

  // Generar todos los QR codes antes de abrir la ventana
  const idsSacas = todasLasSacas.map(({ saca }) => saca.codigoQr || saca.idSaca?.toString() || '')
  let qrDataURLs: string[] = []
  try {
    qrDataURLs = await Promise.all(
      idsSacas.map(idSaca =>
        QRCode.toDataURL(idSaca, {
          width: 150,
          margin: 0,
          color: { dark: '#000000', light: '#FFFFFF' }
        })
      )
    )
  } catch (error) {
    alert('Error generando códigos QR')
    return
  }

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  const etiquetasHTML = todasLasSacas.map(({ saca, despacho, agencia, distribuidor, mostrarLeyenda, ordenSaca, totalSacasDespacho }, index) => {
    return generarEtiquetaHTML(
      saca,
      despacho,
      agencia,
      distribuidor,
      ordenSaca,
      totalSacasDespacho,
      qrDataURLs[index],
      mostrarLeyenda,
      nombreAgenciaOrigen
    )
  }).join('')

  const htmlContent = buildEtiquetasNormalesDocument(
    etiquetasHTML,
    `Etiquetas Múltiples Despachos - ${todasLasSacas.length} etiqueta(s)`
  )
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
