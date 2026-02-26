import type { AtencionPaquete } from '@/types/atencion-paquete'
import { getTipoProblemaLabel } from '@/types/atencion-paquete'
import type { Paquete } from '@/types/paquete'

/**
 * Genera un PDF imprimible con datos de paquetes y sus atenciones asociadas
 * @param atenciones Lista de atenciones de paquetes
 * @param paquetes Map o array de paquetes (keyed by idPaquete)
 * @param hijosMap Map opcional de paquetes hijos por idPaquetePadre (para CLEMENTINA)
 */
export function imprimirAtencionPaquetes(
   atenciones: AtencionPaquete[],
   paquetes: Map<number, Paquete> | Paquete[],
   hijosMap?: Map<number, Paquete[]>
): void {
   if (atenciones.length === 0) {
      alert('No hay atenciones para imprimir')
      return
   }

   // Convertir array a Map si es necesario
   const paquetesMap = paquetes instanceof Map
      ? paquetes
      : new Map(paquetes.map(p => [p.idPaquete!, p]))

   // Crear ventana de impresión
   const printWindow = window.open('', '_blank', 'width=1000,height=800')
   if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
      return
   }

   // Estilos de badges simplificados para impresión
   const getBadgeStyle = (tipo: string, category: 'problem' | 'status') => {
      const styles: Record<string, string> = {
         // Tipos de problema
         'INSTRUCCION_RETENCION': 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;',
         'DIRECCION_INCONSISTENTE': 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;',
         'DESTINATARIO_NO_IDENTIFICADO': 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;',
         'GUIA_REEMPLAZO': 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;',
         'CONFLICTO_NOTAS': 'background: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe;',
         'DATOS_ERRONEOS': 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;',
         'ERROR_ENVIO': 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;',
         'OTRO': 'background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;',

         // Estados
         'PENDIENTE': 'background: #fefce8; color: #a16207; border: 1px solid #fef08a;',
         'EN_REVISION': 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;',
         'RESUELTO': 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;',
         'CANCELADO': 'background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;',
      }

      return styles[tipo] || 'background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;'
   }

   const itemsHTML = atenciones.map((atencion, index) => {
      const paquete = paquetesMap.get(atencion.idPaquete)

      // Obtener paquetes hijos
      const paquetesHijos = (paquete?.tipoPaquete === 'CLEMENTINA' && paquete.idPaquete && hijosMap)
         ? hijosMap.get(paquete.idPaquete) || []
         : []
      const guiasHijas = paquetesHijos
         .map(hijo => hijo.numeroGuia)
         .filter((guia): guia is string => !!guia)

      // Construir dirección
      const direccionDestino = paquete?.direccionDestinatarioCompleta ||
         [
            paquete?.direccionDestinatario,
            paquete?.cantonDestinatario,
            paquete?.ciudadDestinatario
         ].filter(Boolean).join(', ') || ''

      const observacionesPaquete = paquete?.observaciones?.trim() || ''

      return `
      <div class="card">
        <div class="card-header">
           <div class="header-left">
              <span class="index-badge">#${index + 1}</span>
              <span class="guia-text">${paquete?.numeroGuia || atencion.numeroGuia || 'N/A'}</span>
           </div>
           <div class="header-right">
              <span class="package-id">ID: ${atencion.idPaquete}</span>
           </div>
        </div>
        
        <div class="card-body">
          <!-- Datos del Paquete -->
          <div class="section">
             <div class="section-title">Datos del Paquete</div>
             <div class="grid-2">
                <div class="field">
                   <div class="label">Destinatario</div>
                   <div class="value">${paquete?.nombreClienteDestinatario || '-'}</div>
                </div>
                <div class="field">
                   <div class="label">Teléfono</div>
                   <div class="value">${paquete?.telefonoDestinatario || '-'}</div>
                </div>
             </div>
             <div class="field">
                <div class="label">Dirección</div>
                <div class="value">${direccionDestino || '-'}</div>
             </div>
             
             ${paquete?.tipoPaquete === 'CLEMENTINA' && guiasHijas.length > 0 ? `
               <div class="field warning-box">
                  <div class="label">Guías Hijas (Clementina)</div>
                  <div class="value font-mono text-sm">${guiasHijas.join(', ')}</div>
               </div>
             ` : ''}

             ${observacionesPaquete ? `
               <div class="field">
                  <div class="label">Observaciones Paquete</div>
                  <div class="value">${observacionesPaquete}</div>
               </div>
             ` : ''}
          </div>

          <!-- Datos de Atención -->
          <div class="section border-l">
             <div class="section-title">Detalle de Atención</div>
             <div class="grid-2">
                 <div class="field">
                    <div class="label">Tipo Problema</div>
                    <div class="value">
                       <span style="${atencion.tipoProblema ? getBadgeStyle(atencion.tipoProblema, 'problem') : ''}" class="badge">
                          ${getTipoProblemaLabel(atencion.tipoProblema)}
                       </span>
                    </div>
                 </div>
                 <div class="field">
                    <div class="label">Estado</div>
                    <div class="value">
                       <span style="${atencion.estado ? getBadgeStyle(atencion.estado, 'status') : ''}" class="badge">
                          ${atencion.estado}
                       </span>
                    </div>
                 </div>
                 <div class="field">
                    <div class="label">Fecha Solicitud</div>
                    <div class="value">${atencion.fechaSolicitud ? new Date(atencion.fechaSolicitud).toLocaleDateString() : '-'}</div>
                 </div>
                 <div class="field">
                    <div class="label">Fecha Resolución</div>
                    <div class="value">${atencion.fechaResolucion ? new Date(atencion.fechaResolucion).toLocaleDateString() : '-'}</div>
                 </div>
             </div>
             
             <div class="field mt-2">
                <div class="label">Motivo</div>
                <div class="value text-wrap">${atencion.motivo || '-'}</div>
             </div>
             
             ${atencion.observacionesResolucion ? `
               <div class="field mt-2 bg-gray">
                  <div class="label">Resolución</div>
                  <div class="value text-wrap">${atencion.observacionesResolucion}</div>
               </div>
             ` : ''}
          </div>
        </div>
      </div>
    `
   }).join('')

   const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
   })

   const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte Atención Paquetes</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            color: #111;
            line-height: 1.4;
            background: #fff;
          }
          
          .document-header {
             border-bottom: 2px solid #000;
             padding-bottom: 15px;
             margin-bottom: 25px;
             display: flex;
             justify-content: space-between;
             align-items: flex-end;
          }
          
          .doc-title h1 {
             font-size: 18pt;
             font-weight: 700;
             margin: 0;
             text-transform: uppercase;
             letter-spacing: -0.5px;
          }
          .doc-title p {
             font-size: 10pt;
             color: #666;
             margin: 5px 0 0 0;
          }
          
          .doc-meta {
             text-align: right;
             font-size: 9pt;
             color: #444;
          }

          .summary-bar {
             display: flex;
             gap: 20px;
             margin-bottom: 20px;
             padding: 10px 15px;
             background: #f9fafb;
             border: 1px solid #e5e7eb;
             border-radius: 6px;
             font-size: 9pt;
          }
          
          .card {
             border: 1px solid #e5e7eb;
             border-radius: 6px;
             margin-bottom: 20px;
             page-break-inside: avoid;
             box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .card-header {
             background: #f3f4f6;
             border-bottom: 1px solid #e5e7eb;
             padding: 8px 15px;
             display: flex;
             justify-content: space-between;
             align-items: center;
          }
          
          .header-left {
             display: flex;
             align-items: center;
             gap: 10px;
          }
          
          .index-badge {
             font-weight: 700;
             color: #6b7280;
             font-size: 10pt;
          }
          
          .guia-text {
             font-weight: 600;
             font-family: monospace;
             font-size: 11pt;
             color: #111;
          }
          
          .package-id {
             font-size: 8pt;
             color: #6b7280;
          }
          
          .card-body {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 0;
          }
          
          .section {
             padding: 15px;
          }
          
          .border-l {
             border-left: 1px solid #e5e7eb;
          }
          
          .section-title {
             font-size: 8pt;
             text-transform: uppercase;
             letter-spacing: 0.5px;
             color: #6b7280;
             font-weight: 600;
             margin-bottom: 10px;
             border-bottom: 1px solid #e5e7eb;
             padding-bottom: 4px;
          }
          
          .field {
             margin-bottom: 8px;
          }
          
          .label {
             font-size: 7.5pt;
             color: #6b7280;
             font-weight: 500;
             margin-bottom: 1px;
          }
          
          .value {
             font-size: 9pt;
             color: #111;
             font-weight: 400;
          }
          
          .text-wrap {
             white-space: pre-wrap;
          }
          
          .grid-2 {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 10px;
          }
          
          .badge {
             display: inline-block;
             padding: 2px 6px;
             border-radius: 4px;
             font-size: 7.5pt;
             font-weight: 600;
             text-transform: uppercase;
          }
          
          .warning-box {
             background: #fffbeb;
             padding: 8px;
             border: 1px solid #fecaca;
             border-radius: 4px;
          }
          
          .bg-gray {
             background: #f9fafb;
             padding: 8px;
             border-radius: 4px;
             border: 1px solid #e5e7eb;
          }
          
          .mt-2 { margin-top: 10px; }
          .font-mono { font-family: monospace; }
          .text-sm { font-size: 8.5pt; }

          .doc-logo {
            height: 45px !important;
            max-height: 45px !important;
            width: auto !important;
            max-width: 200px !important;
            object-fit: contain !important;
            flex-shrink: 0 !important;
          }

          @media print {
             .card { break-inside: avoid; }
             .header { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="document-header">
           <div class="header-left">
              <img src="/logo.png" class="doc-logo" alt="Logo" />
              <div class="doc-title">
                  <h1>Reporte de Atención</h1>
                  <p>Listado de incidencias y resoluciones</p>
              </div>
           </div>
           <div class="doc-meta">
              <div>Generado el: ${fecha}</div>
              <div>Total Registros: ${atenciones.length}</div>
           </div>
        </div>
        
        ${itemsHTML}
        
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
