import { Link, Outlet } from '@tanstack/react-router'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { Settings, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Ítems del submenú de Parámetros del sistema (fácil de extender con más secciones). */
const SUBMENU_ITEMS = [
  { to: '/parametros-sistema/whatsapp-despacho', label: 'Mensaje de despacho WhatsApp', icon: MessageSquare },
  // Futuro: { to: '/parametros-sistema/preferencias', label: 'Preferencias', icon: Sliders },
  // Futuro: { to: '/parametros-sistema/notificaciones', label: 'Notificaciones', icon: Bell },
] as const

export default function ParametrosSistemaLayout() {
  return (
    <StandardPageLayout
      title="Parámetros del sistema"
      subtitle="Configuración y preferencias para el operario"
      icon={<Settings className="size-5" />}
      width="lg"
      spacing="6"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav
          className="shrink-0 lg:w-[220px]"
          aria-label="Submenú de parámetros"
        >
          <ul className="flex flex-row gap-1 overflow-x-auto py-1 lg:flex-col lg:overflow-visible lg:py-0">
            {SUBMENU_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    activeProps={{
                      className: cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        'bg-primary/10 text-primary'
                      ),
                    }}
                    activeOptions={{ exact: false }}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </StandardPageLayout>
  )
}
