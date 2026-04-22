/**
 * Mensajes estandarizados del sistema de notificaciones.
 *
 * Convención de verbos:
 * - Acciones puntuales completadas con éxito → "<Recurso> <acción en pasado> exitosamente".
 * - Procesos de generación / descarga finalizados → "<Documento> generado correctamente".
 * - Errores → "No se pudo <verbo en infinitivo> el <recurso>".
 * - Inicios de proceso largo → "Generando ..." / "Preparando ...".
 */

export const NOTIFY_MESSAGES = {
  // Genéricos
  unexpectedError: 'Ocurrió un error inesperado. Inténtalo nuevamente.',
  networkError: 'Error de red. Verifica tu conexión.',

  // Procesos largos
  preparing: 'Preparando descarga…',
  generating: 'Generando documento…',
  printing: 'Preparando impresión…',
  exporting: 'Generando archivo…',
  importing: 'Procesando archivo…',

  // Resultados
  pdfDownloaded: 'PDF descargado correctamente',
  excelDownloaded: 'Excel descargado correctamente',
  printSent: 'Documento enviado a impresión',
} as const

export type NotifyMessageKey = keyof typeof NOTIFY_MESSAGES
