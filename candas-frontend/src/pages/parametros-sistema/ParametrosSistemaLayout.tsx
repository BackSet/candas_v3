import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { Settings, ArrowLeft } from 'lucide-react'

export default function ParametrosSistemaLayout() {
  const { pathname } = useLocation()
  const isIndexPage = pathname === '/parametros-sistema' || pathname.endsWith('/parametros-sistema')

  return (
    <StandardPageLayout
      title="Parámetros del sistema"
      subtitle="Configuración y preferencias para el operario"
      icon={<Settings className="size-5" />}
      width="lg"
      spacing="6"
    >
      <div className="space-y-4">
        {!isIndexPage && (
          <Link
            to="/parametros-sistema"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Ver todos los parámetros
          </Link>
        )}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </StandardPageLayout>
  )
}
