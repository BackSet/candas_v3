import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  Users,
  ChevronLeft,
  Moon,
  Sun,
  Monitor,
  Building2,
  MapPin,
  ClipboardCheck,
  Boxes,
  Truck,
  FileText,
  Home,
  Shield,
  Key,
  Settings,
  Scan,
  ChevronsLeft,
  Search,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
  permission?: string | null
  permissions?: string[]
}

interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Inicio',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
    ],
  },
  {
    title: 'Maestros',
    items: [
      { name: 'Paquetes', href: '/paquetes', icon: Package, permissions: [PERMISSIONS.PAQUETES.LISTAR, PERMISSIONS.PAQUETES.VER] },
      { name: 'Clientes', href: '/clientes', icon: Users, permissions: [PERMISSIONS.CLIENTES.LISTAR, PERMISSIONS.CLIENTES.VER] },
      { name: 'Destinatarios', href: '/destinatarios-directos', icon: Home, permissions: [PERMISSIONS.DESTINATARIOS_DIRECTOS.LISTAR, PERMISSIONS.DESTINATARIOS_DIRECTOS.VER] },
      { name: 'Agencias', href: '/agencias', icon: Building2, permissions: [PERMISSIONS.AGENCIAS.LISTAR, PERMISSIONS.AGENCIAS.VER] },
      { name: 'Distribuidores', href: '/distribuidores', icon: Building2, permissions: [PERMISSIONS.DISTRIBUIDORES.LISTAR, PERMISSIONS.DISTRIBUIDORES.VER] },
      { name: 'Puntos Origen', href: '/puntos-origen', icon: MapPin, permissions: [PERMISSIONS.PUNTOS_ORIGEN.LISTAR, PERMISSIONS.PUNTOS_ORIGEN.VER] },
    ],
  },
  {
    title: 'Operación',
    items: [
      { name: 'Lotes Recepción', href: '/lotes-recepcion', icon: Boxes, permissions: [PERMISSIONS.LOTES_RECEPCION.LISTAR, PERMISSIONS.LOTES_RECEPCION.VER] },
      { name: 'Sacas', href: '/sacas', icon: ClipboardCheck, permissions: [PERMISSIONS.SACAS.LISTAR, PERMISSIONS.SACAS.VER] },
      { name: 'Despachos', href: '/despachos', icon: Truck, permissions: [PERMISSIONS.DESPACHOS.LISTAR, PERMISSIONS.DESPACHOS.VER] },
      { name: 'Ensacado', href: '/ensacado', icon: Scan, permission: PERMISSIONS.ENSACADO.OPERAR },
    ],
  },
  {
    title: 'Seguimiento',
    items: [
      { name: 'Atención', href: '/atencion-paquetes', icon: ClipboardCheck, permissions: [PERMISSIONS.ATENCION_PAQUETES.LISTAR, PERMISSIONS.ATENCION_PAQUETES.VER] },
      { name: 'Manifiestos', href: '/manifiestos-consolidados', icon: FileText, permissions: [PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.LISTAR, PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER] },
    ],
  },
  {
    title: 'Admin',
    items: [
      { name: 'Usuarios', href: '/usuarios', icon: Users, permissions: [PERMISSIONS.USUARIOS.LISTAR, PERMISSIONS.USUARIOS.VER] },
      { name: 'Roles', href: '/roles', icon: Shield, permissions: [PERMISSIONS.ROLES.LISTAR, PERMISSIONS.ROLES.VER] },
      { name: 'Permisos', href: '/permisos', icon: Key, permissions: [PERMISSIONS.PERMISOS.LISTAR, PERMISSIONS.PERMISOS.VER] },
      { name: 'Parámetros', href: '/parametros-sistema', icon: Settings, permissions: [PERMISSIONS.PARAMETROS_SISTEMA.VER] },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, resolvedTheme, toggleTheme } = useUIStore()
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div
      className={cn(
        "group flex h-full shrink-0 flex-col border-r border-border/50 bg-background font-sans relative z-50 transition-[width] duration-200 ease-out",
        sidebarCollapsed ? "w-[56px]" : "w-[248px]"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Workspace Header */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        className={cn(
          "relative mx-2 mb-1 mt-2 flex h-12 items-center rounded-xl px-3 transition-colors hover:bg-muted/60 cursor-pointer",
          sidebarCollapsed ? "justify-center p-0" : "justify-start gap-3"
        )}
      >
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 shadow-sm">
          C
        </div>
        <div className={cn(
          "flex-1 overflow-hidden transition-[width,opacity] duration-200",
          sidebarCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
        )}>
          <div className="text-sm font-semibold text-foreground truncate leading-tight">Candas</div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">Sistema de Gestión</div>
        </div>

        <div
          className={cn(
            "text-muted-foreground/50 transition-opacity duration-200",
            sidebarCollapsed ? "absolute right-1 top-1/2 -translate-y-1/2" : "",
            !isHovering && !sidebarCollapsed && "opacity-0"
          )}
          aria-hidden="true"
        >
          {sidebarCollapsed ? (
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          ) : (
            <ChevronsLeft className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Search */}
      <div className="px-2 mb-1">
        <button
          onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
          className={cn(
            "mx-1 flex w-full items-center rounded-lg border border-border/40 bg-muted/30 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            sidebarCollapsed ? "h-8 w-8 justify-center border-0 bg-transparent" : "gap-2.5 px-3 py-1.5"
          )}
        >
          <Search className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Buscar</span>}
          {!sidebarCollapsed && (
            <kbd className="ml-auto rounded-md border border-border/40 bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground/60">⌘K</kbd>
          )}
        </button>
      </div>

      <div className="mx-3 mb-1 h-px bg-border/50" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-1 px-2 min-h-0">
        <ul className="space-y-3">
          {/* Sections */}
          {navigationSections.map((section) => (
            <li key={section.title || 'untitled'}>
              {!sidebarCollapsed && section.title && (
                <div className="mt-1 truncate px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  {section.title}
                </div>
              )}

              {sidebarCollapsed && section.title && (
                <div className="mx-2 my-1.5 h-px bg-border/40" />
              )}

              <ul className="space-y-0.5 mt-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const linkContent = (
                    <Link
                      to={item.href}
                      className={cn(
                        "mx-1 flex items-center rounded-lg text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground",
                        sidebarCollapsed ? "justify-center h-8 w-8 mx-auto p-0" : "px-3 py-1.5 gap-2.5",
                      )}
                      activeProps={{
                        className: cn(
                          "mx-1 flex items-center rounded-lg border border-border/60 bg-muted text-[13px] font-semibold text-foreground transition-colors duration-150",
                          sidebarCollapsed ? "justify-center h-8 w-8 mx-auto p-0" : "px-3 py-1.5 gap-2.5",
                        )
                      }}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  )

                  return (
                    <li key={item.name}>
                      {item.permissions ? (
                        <ProtectedByPermission permissions={item.permissions} fallback={null}>
                          {linkContent}
                        </ProtectedByPermission>
                      ) : item.permission ? (
                        <ProtectedByPermission permission={item.permission} fallback={null}>
                          {linkContent}
                        </ProtectedByPermission>
                      ) : (
                        linkContent
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/50 p-2">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex w-full items-center rounded-lg text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            sidebarCollapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 py-2"
          )}
          title="Cambiar tema: Claro / Oscuro / Sistema"
          type="button"
        >
          {theme === 'system'
            ? <Monitor className="w-4 h-4 shrink-0" />
            : resolvedTheme === 'dark'
              ? <Moon className="w-4 h-4 shrink-0" />
              : <Sun className="w-4 h-4 shrink-0" />}
          {!sidebarCollapsed && (
            <span>
              {theme === 'system'
                ? 'Tema del Sistema'
                : theme === 'dark'
                  ? 'Modo Oscuro'
                  : 'Modo Claro'}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
