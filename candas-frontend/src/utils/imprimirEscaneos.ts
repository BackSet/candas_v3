interface EscaneoResultado {
  numeroGuia: string
  etiqueta: string | null
  fecha: Date
}

/**
 * Genera un PDF imprimible con los resultados de escaneo de guías
 * @param historial Lista de resultados de escaneo
 * @param gruposFiltro Lista opcional de grupos/etiquetas a incluir en la impresión
 */
export function imprimirEscaneos(historial: EscaneoResultado[], gruposFiltro?: string[]): void {
  if (historial.length === 0) {
    alert('No hay escaneos para imprimir')
    return
  }

  // Filtrar historial según grupos seleccionados si se proporciona filtro
  let historialFiltrado = historial
  if (gruposFiltro && gruposFiltro.length > 0) {
    const gruposFiltroSet = new Set(gruposFiltro)
    historialFiltrado = historial.filter(item => {
      const grupo = item.etiqueta || 'Sin etiqueta'
      return gruposFiltroSet.has(grupo)
    })
  }

  if (historialFiltrado.length === 0) {
    alert('No hay escaneos para imprimir con los grupos seleccionados')
    return
  }

  // Crear ventana de impresión
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.')
    return
  }

  // Agrupar por etiqueta para el resumen
  const historialPorEtiqueta = historialFiltrado.reduce((acc, item) => {
    const key = item.etiqueta || 'Sin etiqueta'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<string, EscaneoResultado[]>)

  // Generar resumen
  const resumenHTML = Object.entries(historialPorEtiqueta)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([etiqueta, items]) => {
      const isSinEtiqueta = etiqueta === 'Sin etiqueta'
      return `
        <div class="resumen-item">
          <span class="badge-etiqueta" style="${isSinEtiqueta
          ? 'background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;'
          : 'background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;'
        }">
            ${etiqueta}
          </span>
          <span class="resumen-count">${items.length}</span>
        </div>
      `
    })
    .join('')

  // Generar tabla de escaneos
  const tablaHTML = historialFiltrado
    .map((item) => {
      const fechaHora = item.fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      const etiqueta = item.etiqueta

      return `
        <tr class="${etiqueta ? 'row-found' : 'row-not-found'}">
          <td class="guia-cell">
            ${item.numeroGuia}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e9e9e7;">
            ${etiqueta ? `
              <span class="badge-etiqueta" style="background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;">
                ${etiqueta}
              </span>
            ` : `
              <span class="sin-etiqueta">Sin etiqueta</span>
            `}
          </td>

          <td style="padding: 8px 12px; border-bottom: 1px solid #e9e9e7; font-size: 9pt; color: #787774;">
            ${fechaHora}
          </td>
        </tr>
      `
    })
    .join('')

  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Calculate stats
  const total = historialFiltrado.length
  const conEtiqueta = historialFiltrado.filter(i => i.etiqueta).length
  const sinEtiqueta = total - conEtiqueta

  // Detectar si es un único grupo
  const grupos = Object.keys(historialPorEtiqueta)
  const esUnicoGrupo = grupos.length === 1
  const grupoUnico = esUnicoGrupo ? grupos[0] : null

  // Obtener color para el grupo único
  let estiloGrupoUnico = ''
  if (esUnicoGrupo && grupoUnico) {
    const isSinEtiqueta = grupoUnico === 'Sin etiqueta'
    estiloGrupoUnico = isSinEtiqueta
      ? 'background-color: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;'
      : 'background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;'
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Escaneos de Guías - ${fecha}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 12mm 12mm;
          }
          * {
            box-sizing: border-box;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            margin: 0; 
            padding: 0; 
            font-size: 10pt; 
            line-height: 1.5; 
            color: #37352f; 
            background-color: #ffffff;
          }
          
          /* Header */
          .header { 
            margin-bottom: 24px; 
            padding-bottom: 12px;
            border-bottom: 1px solid #e9e9e7;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
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
          .title-group h1 { 
            margin: 0; 
            font-size: 18pt; 
            font-weight: 600; 
            color: #37352f; 
            letter-spacing: -0.5px;
          }
          .title-group h2 { 
            margin: 4px 0 0 0; 
            font-size: 9pt; 
            color: #787774; 
            font-weight: 400; 
          }
          .meta-info {
            text-align: right;
            font-size: 8pt;
            color: #9b9a97;
          }

          /* General Layout */
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 10pt;
            font-weight: 600;
            color: #37352f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title::after {
            content: "";
            flex: 1;
            height: 1px;
            background-color: #e9e9e7;
          }
          
          /* Info Grid (Stats) */
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 12px; 
            margin-bottom: 24px;
          }
          .stat-card { 
            padding: 12px;
            border: 1px solid #e9e9e7;
            border-radius: 4px;
            background-color: #fff;
          }
          .stat-label { 
            font-size: 8pt; 
            color: #787774; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: 16pt;
            font-weight: 500;
            color: #37352f;
          }
          .stat-value.highlight { color: #37352f; }

          /* Unified Summary */
          .single-summary {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: #f9fafb;
            border: 1px solid #e9e9e7;
            border-radius: 8px;
            margin-bottom: 24px;
          }
          .single-badge {
            font-size: 14pt;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 6px;
          }
          .single-count {
            font-size: 14pt;
            color: #37352f;
          }

          /* Groups Summary */
          .resumen-items {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .resumen-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border: 1px solid #e9e9e7;
            border-radius: 4px;
            background-color: #f7f7f5;
            font-size: 9pt;
          }
          .resumen-count {
            font-weight: 500;
            color: #787774;
          }

          /* Table */
          .table-container {
            border: 1px solid #e9e9e7;
            border-radius: 4px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          th {
            padding: 10px 12px;
            text-align: left;
            font-weight: 500;
            font-size: 8pt;
            text-transform: uppercase;
            color: #787774;
            background-color: #f7f7f5;
            border-bottom: 1px solid #e9e9e7;
          }
          td {
            padding: 8px 12px;
            border-bottom: 1px solid #e9e9e7;
            color: #37352f;
          }
          tr:last-child td {
            border-bottom: none;
          }
          
          /* Cell Styles */
          .guia-cell {
            font-family: 'SF Mono', 'Segoe UI Mono', 'Roboto Mono', monospace;
            color: #37352f;
            padding: 8px 12px;
            border-bottom: 1px solid #e9e9e7;
            font-weight: 500;
          }
          .badge-etiqueta {
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 500;
            line-height: normal;
          }
          .sin-etiqueta {
            color: #9b9a97;
            font-style: italic;
          }
          .estado-encontrado {
            color: #2e7c31; /* Green roughly */
            font-weight: 500;
            font-size: 8pt;
          }
          .estado-no-encontrado {
            color: #d32f2f; /* Red roughly */
            font-weight: 500;
            font-size: 8pt;
          }

          /* Footer */
          .footer {
            margin-top: 32px;
            padding-top: 12px;
            border-top: 1px solid #e9e9e7;
            text-align: center;
            font-size: 8pt;
            color: #9b9a97;
          }

          @media print {
            .header, .stats-grid, .section {
              break-inside: avoid;
            }
            .stat-card {
              border: 1px solid #e9e9e7 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="/logo.png" class="doc-logo" alt="Logo" onerror="this.style.display='none'" />
            <div class="title-group">
              <h1>Escaneos de Guías</h1>
              <h2>Reporte de Escaneo y Etiquetado</h2>
            </div>
          </div>
          <div class="meta-info">
            <div>${fecha}</div>
            <div>Candas v3.0</div>
          </div>
        </div>
        
        ${esUnicoGrupo ? `
        <div class="single-summary">
           <span class="single-badge" style="${estiloGrupoUnico}">
              ${grupoUnico}
           </span>
           <span class="single-count">
              <strong>${total}</strong> guías escaneadas
           </span>
        </div>
        ` : `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Escaneos</div>
            <div class="stat-value">${total}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Con Etiqueta</div>
            <div class="stat-value highlight">${conEtiqueta}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Sin Etiqueta</div>
            <div class="stat-value" style="color: #d32f2f;">${sinEtiqueta}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Resumen por Grupo</div>
          <div class="resumen-items">
            ${resumenHTML}
          </div>
        </div>
        `}

        <div class="section">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 40%">Número de Guía</th>
                  <th style="width: 30%">Etiqueta</th>
                  <th style="width: 30%">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                ${tablaHTML}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          Documento generado automáticamente por sistema Candas
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Optional: window.close() after print if desired, but user might want to keep it open
            }, 500);
          };
        </script>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
