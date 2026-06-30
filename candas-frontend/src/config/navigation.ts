import type { ModuleId } from '@/components/icons/module-icons'
import { PERMISSIONS } from '@/types/permissions'

export interface NavigationItem {
  name: string
  href: string
  moduleId: ModuleId
  permission?: string | null
  permissions?: string[]
}

export interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    title: 'Inicio',
    items: [{ name: 'Dashboard', href: '/dashboard', moduleId: 'dashboard', permission: null }],
  },
  {
    title: 'Maestros',
    items: [
      {
        name: 'Paquetes',
        href: '/paquetes',
        moduleId: 'paquetes',
        permissions: [PERMISSIONS.PAQUETES.LISTAR, PERMISSIONS.PAQUETES.VER],
      },
      {
        name: 'Clientes',
        href: '/clientes',
        moduleId: 'clientes',
        permissions: [PERMISSIONS.CLIENTES.LISTAR, PERMISSIONS.CLIENTES.VER],
      },
      {
        name: 'Destinatarios',
        href: '/destinatarios-directos',
        moduleId: 'destinatarios',
        permissions: [
          PERMISSIONS.DESTINATARIOS_DIRECTOS.LISTAR,
          PERMISSIONS.DESTINATARIOS_DIRECTOS.VER,
        ],
      },
      {
        name: 'Agencias',
        href: '/agencias',
        moduleId: 'agencias',
        permissions: [PERMISSIONS.AGENCIAS.LISTAR, PERMISSIONS.AGENCIAS.VER],
      },
      {
        name: 'Distribuidores',
        href: '/distribuidores',
        moduleId: 'distribuidores',
        permissions: [PERMISSIONS.DISTRIBUIDORES.LISTAR, PERMISSIONS.DISTRIBUIDORES.VER],
      },
      {
        name: 'Puntos Origen',
        href: '/puntos-origen',
        moduleId: 'puntosOrigen',
        permissions: [PERMISSIONS.PUNTOS_ORIGEN.LISTAR, PERMISSIONS.PUNTOS_ORIGEN.VER],
      },
    ],
  },
  {
    title: 'Operación',
    items: [
      {
        name: 'Lotes Recepción',
        href: '/lotes-recepcion',
        moduleId: 'lotesRecepcion',
        permissions: [PERMISSIONS.LOTES_RECEPCION.LISTAR, PERMISSIONS.LOTES_RECEPCION.VER],
      },
      {
        name: 'Despachos',
        href: '/despachos',
        moduleId: 'despachos',
        permissions: [PERMISSIONS.DESPACHOS.LISTAR, PERMISSIONS.DESPACHOS.VER],
      },
      {
        name: 'Despacho masivo',
        href: '/despachos/masivo',
        moduleId: 'despachosMasivo',
        permission: PERMISSIONS.DESPACHOS.CREAR,
      },
      {
        name: 'Despachos rápidos',
        href: '/despachos/rapidos',
        moduleId: 'despachos',
        permissions: [PERMISSIONS.DESPACHOS.LISTAR, PERMISSIONS.DESPACHOS.VER],
      },
      {
        name: 'Despacho rápido (móvil)',
        href: '/despachos/rapidos/mobile',
        moduleId: 'despachos',
        permission: PERMISSIONS.DESPACHOS.CREAR,
      },
      {
        name: 'Ensacado',
        href: '/ensacado',
        moduleId: 'ensacado',
        permission: PERMISSIONS.ENSACADO.OPERAR,
      },
      {
        name: 'Lector móvil',
        href: '/ensacado/lector-movil',
        moduleId: 'ensacado',
        permission: PERMISSIONS.ENSACADO.OPERAR,
      },
    ],
  },
  {
    title: 'Seguimiento',
    items: [
      {
        name: 'Atención',
        href: '/atencion-paquetes',
        moduleId: 'atencionPaquetes',
        permissions: [
          PERMISSIONS.ATENCION_PAQUETES.LISTAR,
          PERMISSIONS.ATENCION_PAQUETES.VER,
        ],
      },
      {
        name: 'Manifiestos',
        href: '/manifiestos-consolidados',
        moduleId: 'manifiestos',
        permissions: [
          PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.LISTAR,
          PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER,
        ],
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        name: 'Usuarios',
        href: '/usuarios',
        moduleId: 'usuarios',
        permissions: [PERMISSIONS.USUARIOS.LISTAR, PERMISSIONS.USUARIOS.VER],
      },
      {
        name: 'Roles',
        href: '/roles',
        moduleId: 'roles',
        permissions: [PERMISSIONS.ROLES.LISTAR, PERMISSIONS.ROLES.VER],
      },
      {
        name: 'Permisos',
        href: '/permisos',
        moduleId: 'permisos',
        permissions: [PERMISSIONS.PERMISOS.LISTAR, PERMISSIONS.PERMISOS.VER],
      },
      {
        name: 'Parámetros',
        href: '/parametros-sistema',
        moduleId: 'parametros',
        permissions: [PERMISSIONS.PARAMETROS_SISTEMA.VER],
      },
    ],
  },
]

/** Ítems planos para Command Palette y referencias cruzadas. */
export function flattenNavigation(): NavigationItem[] {
  return NAVIGATION_SECTIONS.flatMap((section) => section.items)
}
