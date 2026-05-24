import type { ModuleId } from '@/components/icons/module-icons'

export interface ParametroModuleItem {
  id: string
  to: string
  label: string
  moduleId: ModuleId
  description: string
}

/** Módulos de parámetros con implementación en backend y UI. */
export const PARAMETROS_MODULES: readonly ParametroModuleItem[] = [
  {
    id: 'whatsapp-despacho',
    to: '/parametros-sistema/whatsapp-despacho',
    label: 'Mensaje de despacho WhatsApp',
    moduleId: 'whatsappDespacho',
    description: 'Plantilla y variables del mensaje enviado al crear un despacho',
  },
]
