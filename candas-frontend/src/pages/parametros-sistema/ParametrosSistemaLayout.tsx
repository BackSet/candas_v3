import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ModulePageIcon } from '@/components/icons'
import { Link,Outlet,useLocation } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PARAMETROS_MODULES } from './submenuItems'

export default function ParametrosSistemaLayout() {
  const { pathname } = useLocation()
  const isIndexPage =
    pathname === '/parametros-sistema' || pathname.endsWith('/parametros-sistema')

  const currentModule = PARAMETROS_MODULES.find((m) => pathname.includes(m.id))

  const title = isIndexPage
    ? 'Parámetros del sistema'
    : (currentModule?.label ?? 'Parámetros del sistema')

  const subtitle = isIndexPage
    ? 'Configuración global: elija qué desea ajustar'
    : (currentModule?.description ?? '')

  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      icon={
        <ModulePageIcon
          module={isIndexPage ? 'parametros' : (currentModule?.moduleId ?? 'parametros')}
        />
      }
      width="xl"
      spacing="6"
      className="py-2"
    >
      <div className="space-y-4">
        {!isIndexPage && (
          <Link
            to="/parametros-sistema"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Todas las configuraciones
          </Link>
        )}
        <Outlet />
      </div>
    </StandardPageLayout>
  )
}
