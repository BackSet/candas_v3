import type { Paquete } from '@/types/paquete'

const REF_SERVICIO = 'CATEGORIA B'
const COURIER = 'PEDIDOS EXPRESS'
const IDENTIFICADOR_MVS = 'MVS'

const ZEBRA_STYLES = `
  @page { size: 101mm 152mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; background: #fff; color: #000; }
  .zebra-paquete-label {
    width: 101mm;
    min-height: 152mm;
    padding: 2mm 3mm;
    border: 1px solid #ccc;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center; /* Center everything by default */
    text-align: center;
  }
  .zebra-paquete-label:last-child { page-break-after: auto; }
  
  .zebra-remitente {
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.2;
    text-transform: uppercase;
    margin-bottom: 1mm;
  }
  .zebra-remitente-addr { font-size: 9pt; font-weight: 400; line-height: 1.1; margin-bottom: 0.5mm; }
  .zebra-remitente-tel { font-size: 9pt; font-weight: 400; margin-bottom: 2mm; }

  .zebra-envio-info { 
    width: 100%; 
    text-align: left; 
    font-size: 10pt; 
    font-weight: 700; 
    padding-left: 2mm;
    margin-bottom: 0mm;
  }

  .zebra-barcode-wrap { 
    width: 100%; 
    margin: 0mm 0 1mm 0; 
    display: flex; 
    justify-content: center; 
  }
  .zebra-barcode-wrap svg { 
    width: 95%; 
    height: 22mm; 
  }
  
  .zebra-numero-guia { 
    font-size: 26pt; 
    font-weight: 800; 
    letter-spacing: -1px; 
    margin-bottom: 3mm; 
    line-height: 1;
  }

  .zebra-data-block {
    display: flex;
    flex-direction: column;
    gap: 0.5mm;
    width: 100%;
    margin-bottom: 3mm;
  }
  .zebra-line { font-size: 9pt; font-weight: 400; }
  .zebra-line .zebra-valor-bold { font-weight: 700; }
  .zebra-line.small { font-size: 8pt; }
  .zebra-contenido { 
    font-size: 8pt; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    max-width: 100%; 
    padding: 0 2mm;
  }

  .zebra-servicio { 
    margin: 2mm 0; 
    width: 100%;
    padding: 1.5mm 0;
  }
  .zebra-servicio-ref { font-size: 10pt; font-weight: 700; }
  .zebra-servicio-courier { font-size: 9pt; font-weight: 700; margin-top: 0.5mm; }

  .zebra-destino { 
    font-size: 15pt; 
    font-weight: 800; 
    text-transform: uppercase; 
    margin: 2mm 0 4mm 0; 
    line-height: 1.1;
  }

  .zebra-destinatario-block {
    display: flex;
    flex-direction: column;
    gap: 1mm;
    width: 100%;
  }
  .zebra-dest-name { font-size: 10pt; font-weight: 400; text-transform: uppercase; }
  .zebra-dest-addr { font-size: 9pt; font-weight: 400; text-transform: uppercase; }
  .zebra-dest-tel { font-size: 9pt; font-weight: 400; }
  .zebra-dest-id { font-size: 10pt; font-weight: 700; margin-top: 1mm; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .zebra-paquete-label { border: none; }
  }
`

function getDatosEtiqueta(paquete: Paquete) {
  const remitenteNombre =
    paquete.nombrePuntoOrigen ||
    paquete.nombreClienteRemitente ||
    paquete.clienteRemitente?.nombre ||
    'ECUASHOP' // Fallback to ECUASHOP if empty, per image style preference
  
  const remitenteDir =
    paquete.direccionRemitenteCompleta || paquete.direccionRemitente || '444 LIVINGSTON RD Linden, New Jersey (07036).'
  
  // Note: Paquete type usually doesn't have phone for sender, using placeholder if needed or empty
  const remitenteTel = '+19733460374' 

  const numeroGuia = paquete.numeroGuia || paquete.idPaquete?.toString() || '—'
  const ref = paquete.ref || '—'
  const fechaRegistro = paquete.fechaRegistro
    ? new Date(paquete.fechaRegistro).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)
  
  const lb = paquete.pesoLibras != null ? paquete.pesoLibras.toFixed(2) : '0.00'
  const kg = paquete.pesoKilos != null ? paquete.pesoKilos.toFixed(2) : '0.00'
  const usfob = paquete.valor != null ? paquete.valor.toFixed(2) : '0.00'
  
  // Medidas formatting: L: 1.00 W: 1.00 H: 1.00 (sin espacio tras dos puntos, como en imagen)
  const medidas = paquete.medidas || 'L: 1.00 W: 1.00 H: 1.00'
  
  const contenido = paquete.descripcion || 'Contenido...'
  
  const destino = [paquete.ciudadDestinatario, paquete.paisDestinatario || 'Ecuador', paquete.cantonDestinatario]
    .filter(Boolean)
    .join(' - ') || '—'
    
  const nombreDest = paquete.nombreClienteDestinatario || '—'
  const lineaEntrega =
    paquete.etiquetaDestinatario ||
    paquete.direccionDestinatarioCompleta ||
    paquete.direccionDestinatario ||
    '—'
  const telefono = paquete.telefonoDestinatario || '—'
  const documento = paquete.documentoDestinatario
    ? `CEDULA DE CIUDADANIA - ${paquete.documentoDestinatario}`
    : '—'

  return {
    remitenteNombre,
    remitenteDir,
    remitenteTel,
    numeroGuia,
    ref,
    fechaRegistro,
    lb,
    kg,
    usfob,
    medidas,
    contenido,
    destino,
    nombreDest,
    lineaEntrega,
    telefono,
    documento,
  }
}

export function generarEtiquetaZebraPaqueteHTML(
  paquete: Paquete,
  index: number,
  orden: number,
  total: number
): string {
  const d = getDatosEtiqueta(paquete)
  const ordenTexto = `${orden} de ${total} ${IDENTIFICADOR_MVS}`

  return `
  <div class="zebra-paquete-label">
    <div class="zebra-remitente">${escapeHtml(d.remitenteNombre)}</div>
    <div class="zebra-remitente-addr">${escapeHtml(d.remitenteDir)}</div>
    <div class="zebra-remitente-tel">TEL: ${escapeHtml(d.remitenteTel)}</div>

    <div class="zebra-envio-info">${escapeHtml(ordenTexto)}</div>
    
    <div class="zebra-barcode-wrap"><svg id="barcode-zebra-${index}"></svg></div>
    <div class="zebra-numero-guia">${escapeHtml(d.numeroGuia)}</div>

    <div class="zebra-data-block">
      <div class="zebra-line">Ref : <span class="zebra-valor-bold">${escapeHtml(d.ref)}</span></div>
      <div class="zebra-line">Date: ${d.fechaRegistro}</div>
      <div class="zebra-line">Lb: <span class="zebra-valor-bold">${d.lb}</span> | Kg: <span class="zebra-valor-bold">${d.kg}</span> | USFOB: <span class="zebra-valor-bold">${d.usfob}</span></div>
      <div class="zebra-line">${formatMedidasConBold(d.medidas)}</div>
      <div class="zebra-contenido">Contenido: ${escapeHtml(d.contenido)}</div>
    </div>

    <div class="zebra-servicio">
      <div class="zebra-servicio-ref">REF.SERVICIO : ${REF_SERVICIO}</div>
      <div class="zebra-servicio-courier">COURIER : ${COURIER}</div>
    </div>

    <div class="zebra-destino">${escapeHtml(d.destino)}</div>

    <div class="zebra-destinatario-block">
      <div class="zebra-dest-name">${escapeHtml(d.nombreDest)}</div>
      <div class="zebra-dest-addr">${escapeHtml(d.lineaEntrega)}</div>
      <div class="zebra-dest-tel">${escapeHtml(d.telefono)}-</div>
      <div class="zebra-dest-id">${escapeHtml(d.documento)}</div>
    </div>
  </div>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Envuelve los valores numéricos (ej. 1.00) de la línea de medidas en negrita, como en la imagen. */
function formatMedidasConBold(medidas: string): string {
  const escaped = escapeHtml(medidas)
  return escaped.replace(/(\d+\.\d+)/g, '<span class="zebra-valor-bold">$1</span>')
}

function openPrintWindowZebra(content: string, numerosGuia: string[]) {
  const printWindow = window.open('', '_blank', 'width=420,height=640')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Etiquetas Zebra - Paquetes</title>
  <meta charset="UTF-8">
  <style>${ZEBRA_STYLES}</style>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
</head>
<body>
  ${content}
  <script>
    (function() {
      var numerosGuia = ${JSON.stringify(numerosGuia)};
      if (typeof JsBarcode !== 'undefined') {
        numerosGuia.forEach(function(numeroGuia, index) {
          if (numeroGuia && numeroGuia !== '—') {
            var svg = document.getElementById('barcode-zebra-' + index);
            if (svg) {
              try {
                JsBarcode(svg, numeroGuia, {
                  format: 'CODE128',
                  width: 3,
                  height: 70,
                  displayValue: false,
                  margin: 0
                });
              } catch (e) { console.error(e); }
            }
          }
        });
      }
      setTimeout(function() { window.print(); }, 800);
    })();
  </script>
</body>
</html>
  `
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

export function imprimirEtiquetaZebraPaquete(paquete: Paquete): void {
  const content = generarEtiquetaZebraPaqueteHTML(paquete, 0, 1, 1)
  const numeroGuia = paquete.numeroGuia || paquete.idPaquete?.toString() || ''
  openPrintWindowZebra(content, [numeroGuia])
}

export function imprimirEtiquetasZebraPaquetes(paquetes: Paquete[]): void {
  if (paquetes.length === 0) {
    return
  }
  const total = paquetes.length
  let content = ''
  paquetes.forEach((p, index) => {
    content += generarEtiquetaZebraPaqueteHTML(p, index, index + 1, total)
  })
  const numerosGuia = paquetes.map(
    (p) => p.numeroGuia || p.idPaquete?.toString() || ''
  )
  openPrintWindowZebra(content, numerosGuia)
}
