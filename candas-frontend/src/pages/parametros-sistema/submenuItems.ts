import type { LucideIcon } from 'lucide-react'
import { Bell, MessageSquare, Sliders } from 'lucide-react'
import { PERMISSIONS } from '@/types/permissions'

export type ParametroModuleStatus = 'active' | 'coming_soon' | 'beta'

export interface ParametroModuleItem {
  id: string
  to: string
  label: string
  icon: LucideIcon
  description: string
  status: ParametroModuleStatus
  requiredPermission?: string
}

/** Registro tipado de módulos de parámetros (single source of truth para índice y menú lateral). */
export const PARAMETROS_MODULES: readonly ParametroModuleItem[] = [
  {
    id: 'whatsapp-despacho',
    to: '/parametros-sistema/whatsapp-despacho',
    label: 'Mensaje de despacho WhatsApp',
    icon: MessageSquare,
    description: 'Plantilla y variables del mensaje de WhatsApp al crear despacho',
    status: 'active',
    requiredPermission: PERMISSIONS.PARAMETROS_SISTEMA.VER,
  },
  {
    id: 'preferencias-operativas',
    to: '/parametros-sistema/preferencias-operativas',
    label: 'Preferencias operativas',
    icon: Sliders,
    description: 'Ajustes de operación y comportamiento general del sistema',
    status: 'coming_soon',
    requiredPermission: PERMISSIONS.PARAMETROS_SISTEMA.VER,
  },
  {
    id: 'notificaciones',
    to: '/parametros-sistema/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
    description: 'Reglas de notificación y canales para eventos del sistema',
    status: 'coming_soon',
    requiredPermission: PERMISSIONS.PARAMETROS_SISTEMA.VER,
  },
]

export const PARAMETROS_ACTIVE_MODULES = PARAMETROS_MODULES.filter((m) => m.status === 'active')
