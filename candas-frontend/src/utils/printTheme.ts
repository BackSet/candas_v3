export const PRINT_CSS_BASE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@page {
  margin: 10mm;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
  background: #ffffff;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 8pt;
  line-height: 1.4;
  color: #171717;
}

/* Page Breaks */
.page-break-after {
  page-break-after: always !important;
  break-after: page !important;
}

.avoid-break {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* Header */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.doc-logo {
  height: 32px !important;
  max-height: 32px !important;
  width: auto !important;
  max-width: 160px !important;
  object-fit: contain !important;
  flex-shrink: 0 !important;
}

.doc-title h1 {
  font-size: 14pt;
  font-weight: 600;
  margin: 0 0 2px 0;
  letter-spacing: -0.02em;
  color: #171717;
}

.doc-title h2 {
  font-size: 9pt;
  font-weight: 500;
  color: #737373;
  margin: 0;
}

.doc-meta {
  text-align: right;
  font-size: 8pt;
  color: #737373;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-item {
  margin: 0;
}

.meta-label {
  color: #a3a3a3;
}

.meta-value {
  font-weight: 500;
  color: #171717;
}

/* Bloques de estadística destacados en la cabecera (jerarquía clara) */
.doc-stats {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.doc-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  text-align: right;
  padding: 3px 9px;
  border-radius: 5px;
  background: #f5f5f5;
  min-width: 50px;
}

.doc-stat .stat-label {
  font-size: 6pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: #a3a3a3;
  line-height: 1.15;
}

.doc-stat .stat-value {
  font-size: 13pt;
  font-weight: 700;
  color: #171717;
  line-height: 1.1;
}

.doc-stat .stat-value.is-code {
  font-size: 9pt;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.doc-stat.accent {
  background: #eef4ff;
}

.doc-stat.accent .stat-value {
  color: #1d4ed8;
}

/* Pills / Badges */
.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 16px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #525252;
  font-size: 7.5pt;
}

.meta-pill strong {
  color: #171717;
  font-weight: 500;
}

/* Pills por tipo de destino (identificación rápida por color) */
.meta-pill.tipo-agencia {
  background: #eef4ff;
  color: #1d4ed8;
  border: 1px solid #c7dbff;
}

.meta-pill.tipo-agencia strong {
  color: #1d4ed8;
  font-weight: 700;
}

.meta-pill.tipo-directo {
  background: #f3effe;
  color: #7c3aed;
  border: 1px solid #ddd0fb;
}

.meta-pill.tipo-directo strong {
  color: #7c3aed;
  font-weight: 700;
}

/* Info Grid (Minimalist) */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 12px;
  margin-bottom: 20px;
  padding: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 7pt;
  text-transform: uppercase;
  color: #a3a3a3;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 8.5pt;
  font-weight: 400;
  color: #171717;
}

.info-value.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8pt;
}

/* Color por tipo de destino en la cuadrícula de info */
.info-label.tipo-agencia { color: #1d4ed8; }
.info-label.tipo-directo { color: #7c3aed; }

/* Warnings */
.warning-box {
  padding: 8px 12px;
  margin-bottom: 16px;
  border-left: 2px solid #f59e0b;
  background: #fffbeb;
  color: #92400e;
  font-size: 7.5pt;
  border-radius: 0 4px 4px 0;
}

/* Sections */
.section-title {
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 16px 0 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #171717;
  color: #171717;
}

/* Blocks */
.saca-block {
  margin-bottom: 14px;
  break-inside: auto;
  page-break-inside: auto;
}

.saca-header {
  padding: 5px 8px;
  font-size: 8pt;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #171717;
  background: #f0f0f0;
  border-left: 3px solid #1d4ed8;
  border-radius: 3px;
  margin-bottom: 0;
}

.saca-header-meta {
  font-weight: 500;
  color: #525252;
}

/* Tables */
.paquetes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7.5pt;
  table-layout: fixed;
}

.paquetes-table thead {
  display: table-header-group;
}

.paquetes-table tbody {
  display: table-row-group;
}

.paquetes-table th {
  text-align: left;
  padding: 5px 4px;
  font-weight: 700;
  color: #525252;
  background: #fafafa;
  border-bottom: 1.5px solid #d4d4d4;
  text-transform: uppercase;
  font-size: 6.5pt;
  letter-spacing: 0.02em;
}

.paquetes-table td {
  padding: 5px 4px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
  color: #404040;
}

/* Filas zebra para lectura de tablas densas */
.paquetes-table tbody tr:nth-child(even) td {
  background: #fafafa;
}

.paquetes-table tr:last-child td {
  border-bottom: none;
}

/* Resalta la guía (identificador principal de cada fila) */
.paquetes-table .col-guia {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #171717;
}

/* Print Specific */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`

export const PDF_COLORS = {
  text: {
    primary: '#171717',
    secondary: '#737373',
    muted: '#a3a3a3',
  },
  border: {
    light: '#f5f5f5',
    normal: '#e5e5e5',
    dark: '#d4d4d4',
  },
  background: {
    pill: '#f5f5f5',
    warning: '#fffbeb',
  },
  warning: {
    text: '#92400e',
    border: '#f59e0b',
  }
}

export const PDF_FONTS = {
  family: 'helvetica',
  sizes: {
    title: 14,
    subtitle: 9,
    section: 10,
    normal: 8,
    small: 7.5,
    tiny: 6.5,
  }
}

export const PDF_MARGINS = {
  x: 10,
  y: 10,
}
