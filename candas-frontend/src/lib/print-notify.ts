import { notify } from '@/lib/notify'

/** Mensajes unificados para flujos de impresión (ventanas emergentes, listas vacías). */
export const printNotify = {
  popupBlocked: () =>
    notify.warning(
      'No se pudo abrir la ventana de impresión. Permite las ventanas emergentes en el navegador.'
    ),
  nothingToPrint: (message: string) => notify.warning(message),
  error: (message: string) => notify.error(message),
}
