import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  UserRound,
  MapPinned,
  Store,
  Warehouse,
  MapPin,
  Inbox,
  Sparkles,
  Truck,
  BaggageClaim,
  ScanBarcode,
  Headset,
  FileStack,
  Users,
  Shield,
  KeyRound,
  SlidersHorizontal,
  MessageCircle,
} from 'lucide-react'

/** Identificadores de módulos del sistema (fuente única para iconografía). */
export type ModuleId =
  | 'dashboard'
  | 'paquetes'
  | 'clientes'
  | 'destinatarios'
  | 'agencias'
  | 'distribuidores'
  | 'puntosOrigen'
  | 'lotesRecepcion'
  | 'lotesEspeciales'
  | 'despachos'
  | 'sacas'
  | 'ensacado'
  | 'atencionPaquetes'
  | 'manifiestos'
  | 'usuarios'
  | 'roles'
  | 'permisos'
  | 'parametros'
  | 'whatsappDespacho'

export interface ModuleIconConfig {
  icon: LucideIcon
  /** Título corto para accesibilidad / tooltips */
  title: string
}

export const MODULE_ICONS: Record<ModuleId, ModuleIconConfig> = {
  dashboard: { icon: LayoutDashboard, title: 'Dashboard' },
  paquetes: { icon: Package, title: 'Paquetes' },
  clientes: { icon: UserRound, title: 'Clientes' },
  destinatarios: { icon: MapPinned, title: 'Destinatarios directos' },
  agencias: { icon: Store, title: 'Agencias' },
  distribuidores: { icon: Warehouse, title: 'Distribuidores' },
  puntosOrigen: { icon: MapPin, title: 'Puntos de origen' },
  lotesRecepcion: { icon: Inbox, title: 'Lotes de recepción' },
  lotesEspeciales: { icon: Sparkles, title: 'Lotes especiales' },
  despachos: { icon: Truck, title: 'Despachos' },
  sacas: { icon: BaggageClaim, title: 'Sacas' },
  ensacado: { icon: ScanBarcode, title: 'Ensacado' },
  atencionPaquetes: { icon: Headset, title: 'Atención de paquetes' },
  manifiestos: { icon: FileStack, title: 'Manifiestos consolidados' },
  usuarios: { icon: Users, title: 'Usuarios' },
  roles: { icon: Shield, title: 'Roles' },
  permisos: { icon: KeyRound, title: 'Permisos' },
  parametros: { icon: SlidersHorizontal, title: 'Parámetros del sistema' },
  whatsappDespacho: { icon: MessageCircle, title: 'WhatsApp despacho' },
}

export function getModuleIcon(moduleId: ModuleId): LucideIcon {
  return MODULE_ICONS[moduleId].icon
}
