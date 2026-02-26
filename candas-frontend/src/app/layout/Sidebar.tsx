import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  Users,
  ChevronLeft,
  Moon,
  Sun,
  Building2,
  MapPin,
  ClipboardCheck,
  Boxes,
  Truck,
  FileText,
  Home,
  Shield,
  Key,
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

const dashboardItem: NavigationItem = {
  name: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
  permission: null,
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Gestión',
    items: [
      { name: 'Paquetes', href: '/paquetes', icon: Package, permissions: [PERMISSIONS.PAQUETES.LISTAR, PERMISSIONS.PAQUETES.VER] },
      { name: 'Clientes', href: '/clientes', icon: Users, permissions: [PERMISSIONS.CLIENTES.LISTAR, PERMISSIONS.CLIENTES.VER] },
      { name: 'Destinatarios', href: '/destinatarios-directos', icon: Home, permissions: [PERMISSIONS.DESTINATARIOS_DIRECTOS.LISTAR, PERMISSIONS.DESTINATARIOS_DIRECTOS.VER] },
    ],
  },
  {
    title: 'Logística',
    items: [
      { name: 'Agencias', href: '/agencias', icon: Building2, permissions: [PERMISSIONS.AGENCIAS.LISTAR, PERMISSIONS.AGENCIAS.VER] },
      { name: 'Distribuidores', href: '/distribuidores', icon: Building2, permissions: [PERMISSIONS.DISTRIBUIDORES.LISTAR, PERMISSIONS.DISTRIBUIDORES.VER] },
      { name: 'Puntos Origen', href: '/puntos-origen', icon: MapPin, permissions: [PERMISSIONS.PUNTOS_ORIGEN.LISTAR, PERMISSIONS.PUNTOS_ORIGEN.VER] },
      { name: 'Lotes Recepción', href: '/lotes-recepcion', icon: Boxes, permissions: [PERMISSIONS.LOTES_RECEPCION.LISTAR, PERMISSIONS.LOTES_RECEPCION.VER] },
      { name: 'Sacas', href: '/sacas', icon: ClipboardCheck, permissions: [PERMISSIONS.SACAS.LISTAR, PERMISSIONS.SACAS.VER] },
      { name: 'Despachos', href: '/despachos', icon: Truck, permissions: [PERMISSIONS.DESPACHOS.LISTAR, PERMISSIONS.DESPACHOS.VER] },
      { name: 'Ensacado', href: '/ensacado', icon: Scan, permission: PERMISSIONS.ENSACADO.OPERAR },
    ],
  },
  {
    title: 'Operaciones',
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
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore()
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div
      className={cn(
        "group flex flex-col h-full bg-sidebar-background border-r border-sidebar-border/60 font-sans relative z-50 shrink-0 transition-[width] duration-200 ease-out",
        sidebarCollapsed ? "w-[52px]" : "w-[240px]"
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
          "relative flex items-center h-14 px-3 transition-colors hover:bg-sidebar-hover/60 cursor-pointer mx-2 mt-2 mb-1 rounded-xl",
          sidebarCollapsed ? "justify-center p-0" : "justify-start gap-3"
        )}
      >
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 shadow-sm">
          C
        </div>
        <div className={cn(
          "flex-1 overflow-hidden transition-all duration-200",
          sidebarCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
        )}>
          <div className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">Candas</div>
          <div className="text-[10px] text-sidebar-muted truncate mt-0.5">Sistema de Gestión</div>
        </div>

        <div
          className={cn(
            "text-sidebar-muted/40 transition-opacity duration-200",
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
            "flex items-center w-full text-[13px] text-sidebar-muted hover:bg-sidebar-hover/60 hover:text-sidebar-foreground rounded-lg transition-colors",
            sidebarCollapsed ? "justify-center h-8 w-8 mx-auto" : "px-3 py-1.5 gap-2.5 mx-1"
          )}
        >
          <Search className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Buscar</span>}
          {!sidebarCollapsed && (
            <kbd className="ml-auto text-[9px] font-mono text-sidebar-muted/50 bg-sidebar-hover/50 px-1.5 py-0.5 rounded-md border border-sidebar-border/30">⌘K</kbd>
          )}
        </button>
      </div>

      <div className="mx-3 mb-1 h-px bg-sidebar-border/30" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-1 px-2 min-h-0">
        <ul className="space-y-3">
          {/* Dashboard */}
          <li key={dashboardItem.name}>
            <Link
              to={dashboardItem.href}
              className={cn(
                "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 mx-1",
                sidebarCollapsed ? "justify-center h-8 w-8 mx-auto" : "px-3 py-1.5 gap-2.5",
                "text-sidebar-muted hover:bg-sidebar-hover/60 hover:text-sidebar-foreground"
              )}
              activeProps={{
                className: cn(
                  "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 mx-1",
                  sidebarCollapsed ? "justify-center h-8 w-8 mx-auto" : "px-3 py-1.5 gap-2.5",
                  "bg-primary/10 text-primary font-semibold"
                )
              }}
            >
              <dashboardItem.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{dashboardItem.name}</span>}
            </Link>
          </li>

          {/* Sections */}
          {navigationSections.map((section) => (
            <li key={section.title || 'untitled'}>
              {!sidebarCollapsed && section.title && (
                <div className="px-4 py-1 mt-1 text-[10px] font-bold text-sidebar-muted/50 truncate uppercase tracking-[0.12em]">
                  {section.title}
                </div>
              )}

              {sidebarCollapsed && section.title && (
                <div className="mx-2 my-1.5 h-px bg-sidebar-border/20" />
              )}

              <ul className="space-y-0.5 mt-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const linkContent = (
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 mx-1",
                        sidebarCollapsed ? "justify-center h-8 w-8 mx-auto p-0" : "px-3 py-1.5 gap-2.5",
                        "text-sidebar-muted hover:bg-sidebar-hover/60 hover:text-sidebar-foreground"
                      )}
                      activeProps={{
                        className: cn(
                          "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 mx-1",
                          sidebarCollapsed ? "justify-center h-8 w-8 mx-auto p-0" : "px-3 py-1.5 gap-2.5",
                          "bg-primary/10 text-primary font-semibold"
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
      <div className="shrink-0 border-t border-sidebar-border/30 p-2">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center w-full text-[13px] text-sidebar-muted hover:bg-sidebar-hover/60 hover:text-sidebar-foreground rounded-lg transition-colors",
            sidebarCollapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 py-2"
          )}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!sidebarCollapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>
      </div>

      {/* Collapse Toggle Pill */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 bg-background border border-border/60 shadow-sm rounded-full p-1 text-muted-foreground hover:text-foreground hover:shadow-md transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
          sidebarCollapsed && "opacity-0 hover:opacity-100"
        )}
        title="Toggle Sidebar"
      >
        {sidebarCollapsed ? <ChevronLeft className="w-3 h-3 rotate-180" /> : <ChevronsLeft className="w-3 h-3" />}
      </button>
    </div>
  )
}
