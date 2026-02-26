import type { Paquete } from '@/types/paquete'

/** Escapa HTML para evitar rotura en celdas. */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Construye el HTML completo del documento de lote especial para impresión.
 * Misma implementación que buildDocumentoManifiestoHTML en imprimirDespacho: ventana con HTML + window.print().
 */
export function buildDocumentoLoteEspecialHTML(contenido: string, titulo: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${esc(titulo)}</title>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @page { size: A4 portrait; margin: 10mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; font-size: 8pt; line-height: 1.2; color: #111; background: #fff; }
      html, body { height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 5px; margin-bottom: 5px; border-bottom: 1px solid #000; }
      .header-left-group { display: flex; align-items: center; gap: 15px; }
      .doc-logo { height: 45px !important; max-height: 45px !important; width: auto !important; max-width: 200px !important; object-fit: contain !important; flex-shrink: 0 !important; }
      .doc-title h1 { font-size: 11pt; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: -0.3px; }
      .doc-title h2 { font-size: 8pt; font-weight: 500; color: #555; margin: 0; text-transform: uppercase; }
      .doc-tipo { font-size: 9pt; font-weight: 600; margin: 4px 0 0 0; color: #111; }
      .doc-meta { text-align: right; font-size: 7pt; }
      .guias-columnas { column-width: 14em; column-gap: 1.2em; column-fill: auto; font-size: 8pt; margin-top: 8px; }
      .guias-columnas .item { break-inside: avoid; padding: 4px 6px; margin-bottom: 2px; font-family: monospace; border-bottom: 1px solid #eee; }
      .guias-columnas .item:nth-child(even) { background: #fafafa; }
      .guias-columnas .item-guia { font-weight: 500; }
      .guias-columnas .item-tipo { font-size: 7pt; color: #555; font-weight: normal; font-family: inherit; display: block; }
      .guias-columnas-titulo { font-size: 7pt; font-weight: 600; color: #444; text-transform: uppercase; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #ccc; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { height: auto; }
      }
    </style>
  </head>
  <body>
    ${contenido}
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

/** Etiqueta de tipo por paquete para el imprimible. */
function labelTipoPaquete(ref: string | null | undefined): string {
  if (ref == null || ref.trim() === '') return 'Sin etiqueta'
  if (ref === 'VARIAS') return 'Varias listas'
  return ref.trim()
}

/**
 * Genera el contenido HTML del lote especial: guías en columnas que se ajustan al ancho (column-width CSS).
 * Si es "Todos", cada ítem muestra guía y tipo.
 */
export function generarContenidoLoteEspecialHTML(
  paquetes: Paquete[],
  numeroRecepcion: string,
  tipo: string
): string {
  const total = paquetes.length
  const esTodos = !tipo || tipo.toUpperCase() === 'TODOS'

  const items = paquetes.map((p) => {
    const guia = esc(p.numeroGuia ?? '-')
    if (esTodos) {
      const tipoPaq = esc(labelTipoPaquete(p.ref))
      return `<div class="item"><span class="item-guia">${guia}</span><span class="item-tipo">${tipoPaq}</span></div>`
    }
    return `<div class="item item-guia">${guia}</div>`
  })

  const tipoLabel = tipo && tipo !== 'TODOS' ? (tipo === 'SIN_ETIQUETA' ? 'Sin etiqueta' : tipo) : 'Todos'
  const emptyMsg = '<div class="item" style="text-align:center; color:#999; padding:12px;">Sin paquetes</div>'

  return `
    <div class="doc-header">
      <div class="header-left-group">
        <img src="/logo.png" class="doc-logo" alt="Logo" />
        <div class="doc-title">
          <h1>Lote Especial</h1>
          <h2>Recepción: ${esc(numeroRecepcion || '-')}</h2>
          <p class="doc-tipo">Tipo de paquetes: <strong>${esc(tipoLabel)}</strong></p>
        </div>
      </div>
      <div class="doc-meta">
        <div class="meta-item"><span class="meta-label">Total:</span> <span class="meta-value">${total} paquete${total !== 1 ? 's' : ''}</span></div>
      </div>
    </div>

    <div class="guias-columnas-titulo">Nº de guía</div>
    <div class="guias-columnas">
      ${items.length ? items.join('') : emptyMsg}
    </div>
  `
}

/**
 * Imprime el lote especial abriendo una ventana con HTML y disparando window.print().
 * Misma implementación que imprimirDespacho (HTML en ventana + print), misma librería de enfoque.
 */
export async function imprimirLoteEspecial(
  paquetes: Paquete[],
  numeroRecepcion: string,
  tipo: string
): Promise<void> {
  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }
  const titulo = `Lote especial ${numeroRecepcion || ''} - ${tipo || 'TODOS'}`
  const contenido = generarContenidoLoteEspecialHTML(paquetes, numeroRecepcion, tipo)
  const htmlContent = buildDocumentoLoteEspecialHTML(contenido, titulo)
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

/**
 * @deprecated Usar imprimirLoteEspecial (HTML como imprimirDespacho). Se mantiene por compatibilidad.
 * Abre una ventana con el PDF del lote especial y dispara el diálogo de impresión.
 */
export function imprimirPdfEnVentana(blob: Blob, titulo: string): void {
  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }
  const url = URL.createObjectURL(blob)
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    <meta charset="UTF-8">
    <style>
      html, body { margin: 0; padding: 0; height: 100%; }
      iframe { width: 100%; height: 100%; border: none; }
    </style>
  </head>
  <body>
    <iframe src="${url}"></iframe>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        }, 500);
      };
    </script>
  </body>
</html>`
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(url))
}
