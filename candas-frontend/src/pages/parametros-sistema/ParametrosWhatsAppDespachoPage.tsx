import { MensajeWhatsAppDespachoSection } from './MensajeWhatsAppDespachoSection'

/**
 * Página de la sección "Mensaje de despacho WhatsApp" dentro de Parámetros del sistema.
 * El layout padre (ParametrosSistemaLayout) muestra el submenú y este contenido.
 */
export default function ParametrosWhatsAppDespachoPage() {
  return (
    <div className="space-y-6">
      <MensajeWhatsAppDespachoSection />
    </div>
  )
}
