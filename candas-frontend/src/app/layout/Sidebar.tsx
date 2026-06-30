import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { AppIcon,getModuleIcon } from '@/components/icons'
import { NAVIGATION_SECTIONS } from '@/config/navigation'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { Link } from '@tanstack/react-router'
import { ChevronLeft,ChevronsLeft,Monitor,Moon,Search,Sun,X } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    theme,
    resolvedTheme,
    toggleTheme,
  } = useUIStore()
  const [isHovering, setIsHovering] = useState(false)
  const isDesktop = useIsDesktop()

  // En móvil el drawer siempre se muestra expandido (el colapsado es solo de escritorio).
  const collapsed = isDesktop ? sidebarCollapsed : false

  const closeOnMobileNav = () => {
    if (!isDesktop) setMobileSidebarOpen(false)
  }

  return (
    <>
      {/* Backdrop para el drawer en móvil */}
      {!isDesktop && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          'group z-50 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background font-sans text-sidebar-foreground transition-all duration-200 ease-out',
          'fixed inset-y-0 left-0 lg:static',
          isDesktop ? 'translate-x-0 shadow-none' : mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          collapsed ? 'w-[56px]' : 'w-64'
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <button
          type="button"
          onClick={() => (isDesktop ? toggleSidebar() : setMobileSidebarOpen(false))}
          aria-label={
            isDesktop ? (sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar') : 'Cerrar menú'
          }
          title={isDesktop ? (sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar') : 'Cerrar menú'}
          className={cn(
            'relative mx-2 mb-1 mt-2 flex h-12 cursor-pointer items-center rounded-xl px-3 transition-colors hover:bg-muted/60',
            collapsed ? 'justify-center p-0' : 'justify-start gap-3'
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border/50">
            <img src="/logo-candas.svg" alt="Candas" className="size-6 object-contain" />
          </div>
          <div
            className={cn(
              'flex-1 overflow-hidden transition-[width,opacity] duration-200',
              collapsed ? 'hidden w-0 opacity-0' : 'block w-auto opacity-100'
            )}
          >
            <div className="truncate text-sm font-semibold leading-tight text-foreground">Candas</div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">Sistema de Gestión</div>
          </div>

          <div
            className={cn(
              'text-muted-foreground/50 transition-opacity duration-200',
              collapsed ? 'absolute right-1 top-1/2 -translate-y-1/2' : '',
              !isHovering && !collapsed && isDesktop && 'opacity-0'
            )}
            aria-hidden
          >
            {!isDesktop ? (
              <X className="size-4" />
            ) : collapsed ? (
              <ChevronLeft className="size-4 rotate-180" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </div>
        </button>

        <div className="mb-1 px-2">
          <button
            type="button"
            onClick={() => {
              useUIStore.getState().setCommandPaletteOpen(true)
              closeOnMobileNav()
            }}
            className={cn(
              'mx-1 flex w-full items-center rounded-lg border border-border/40 bg-muted/30 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
              collapsed ? 'mx-auto size-8 justify-center border-0 bg-transparent' : 'gap-2.5 px-3 py-1.5'
            )}
          >
            <Search className="size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            {!collapsed && <span className="truncate">Buscar</span>}
            {!collapsed && (
              <kbd className="ml-auto rounded-md border border-border/40 bg-background px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/60">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        <div className="mx-3 mb-1 h-px bg-border/50" />

        <nav className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-1">
          <ul className="space-y-3">
            {NAVIGATION_SECTIONS.map((section) => (
              <li key={section.title ?? 'inicio'}>
                {!collapsed && section.title ? (
                  <div className="mt-1 truncate px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    {section.title}
                  </div>
                ) : null}

                {collapsed && section.title ? (
                  <div className="mx-2 my-1.5 h-px bg-border/40" />
                ) : null}

                <ul className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = getModuleIcon(item.moduleId)
                    const linkContent = (
                      <Link
                        to={item.href}
                        preload="intent"
                        onClick={closeOnMobileNav}
                        className={cn(
                          'mx-1 flex items-center rounded-lg text-[13px] font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-hover hover:text-foreground',
                          collapsed ? 'mx-auto size-8 justify-center p-0' : 'gap-2.5 px-3 py-1.5'
                        )}
                        activeProps={{
                          className: cn(
                            'mx-1 flex items-center rounded-lg border-l-2 border-l-primary bg-sidebar-active text-[13px] font-semibold text-sidebar-active-foreground transition-colors duration-150',
                            collapsed ? 'mx-auto size-8 justify-center border-l-0 p-0' : 'gap-2.5 px-3 py-1.5'
                          ),
                        }}
                        title={collapsed ? item.name : undefined}
                      >
                        <AppIcon icon={Icon} size="sm" className="opacity-90" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    )

                    return (
                      <li key={item.href}>
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

        <div className="shrink-0 border-t border-border/50 p-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'flex w-full items-center rounded-lg text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
              collapsed ? 'mx-auto size-9 justify-center' : 'gap-2.5 px-3 py-2'
            )}
            title="Cambiar tema: Claro / Oscuro / Sistema"
          >
            {theme === 'system' ? (
              <Monitor className="size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            ) : (
              <Sun className="size-4 shrink-0" strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
            )}
            {!collapsed && (
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
    </>
  )
}
