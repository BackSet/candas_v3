import { ModulePageIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { ArrowRight,Settings2 } from 'lucide-react'
import { PARAMETROS_MODULES } from './submenuItems'

/**
 * Hub de parámetros: lista las configuraciones disponibles para abrir cada una.
 */
export default function ParametrosSistemaIndexPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Elija una configuración para ver o modificar sus valores. Solo se muestran opciones
        disponibles en el sistema.
      </p>

      <ul className="grid gap-3 sm:grid-cols-1" role="list">
        {PARAMETROS_MODULES.map((item) => (
            <li key={item.id}>
              <Link
                to={item.to}
                className={cn(
                  'group flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all',
                  'hover:border-primary/30 hover:bg-card hover:shadow-md',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <ModulePageIcon
                  module={item.moduleId}
                  variant="tile"
                  className="transition-colors group-hover:bg-primary/15"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                    {item.label}
                  </span>
                  <span className="block text-xs text-muted-foreground leading-snug">
                    {item.description}
                  </span>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            </li>
        ))}
      </ul>

      {PARAMETROS_MODULES.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <Settings2 className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No hay configuraciones disponibles.</p>
        </div>
      )}
    </div>
  )
}
