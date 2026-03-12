import { Link } from '@tanstack/react-router'
import { ArrowRightCircle, Settings2 } from 'lucide-react'
import { PARAMETROS_MODULES } from './submenuItems'
import { cn } from '@/lib/utils'

/**
 * Página índice de Parámetros del sistema: lista todos los submenús.
 * Al entrar en /parametros-sistema se muestra esta vista; cada ítem lleva a su sección.
 */
export default function ParametrosSistemaIndexPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Introducción */}
      <section className="rounded-2xl border border-border/70 bg-muted/20 px-6 py-7 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Settings2 className="size-5" />
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Elija qué desea configurar
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Seleccione uno de los parámetros siguientes. Aquí se irán integrando más opciones según se necesiten.
            </p>
          </div>
        </div>
      </section>

      {/* Lista de parámetros */}
      <section aria-label="Parámetros disponibles">
        <h3 className="sr-only">Parámetros disponibles</h3>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {PARAMETROS_MODULES.map((item) => {
            const Icon = item.icon
            const isActive = item.status === 'active'
            const statusLabel = item.status === 'coming_soon' ? 'Próximamente' : item.status === 'beta' ? 'Beta' : null
            return (
              <li key={item.to}>
                {isActive ? (
                  <Link
                    to={item.to}
                    className={cn(
                      'group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-200',
                      'hover:border-primary/25 hover:bg-card hover:shadow-md',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="size-6" />
                      </div>
                      <ArrowRightCircle className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <span className="block text-base font-semibold text-foreground group-hover:text-primary">
                        {item.label}
                      </span>
                      <span className="block text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                    <span className="mt-auto text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Configurar →
                    </span>
                  </Link>
                ) : (
                  <div
                    className={cn(
                      'flex h-full flex-col gap-4 rounded-2xl border border-dashed border-border/80 bg-card/50 p-5 text-left shadow-sm',
                      'opacity-80'
                    )}
                    aria-disabled="true"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Icon className="size-6" />
                      </div>
                      {statusLabel && (
                        <span className="rounded-md border border-border bg-muted/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <span className="block font-semibold text-foreground">
                        {item.label}
                      </span>
                      <span className="block text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
