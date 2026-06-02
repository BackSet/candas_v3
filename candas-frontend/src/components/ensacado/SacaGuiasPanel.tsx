import { AppIcon } from '@/components/icons'
import { Card,CardContent } from '@/components/ui/card'
import { ENSACADO_SCAN } from '@/constants/ensacado'
import { cn } from '@/lib/utils'
import { CheckCircle2,Package } from 'lucide-react'

interface SacaGuiasPanelProps {
  ensacados: string[]
  pendientes: string[]
  className?: string
}

export function SacaGuiasPanel({ ensacados, pendientes, className }: SacaGuiasPanelProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      <GuiasListCard
        title="Guías ensacadas"
        guias={ensacados}
        variant="ensacado"
        icon={CheckCircle2}
      />
      <GuiasListCard
        title="Pendientes"
        guias={pendientes}
        variant="pendiente"
        icon={Package}
      />
    </div>
  )
}

function GuiasListCard({
  title,
  guias,
  variant,
  icon: Icon,
}: {
  title: string
  guias: string[]
  variant: 'ensacado' | 'pendiente'
  icon: typeof CheckCircle2
}) {
  const isEnsacado = variant === 'ensacado'

  return (
    <Card className="rounded-2xl border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <div
            className={cn(
              'flex size-6 items-center justify-center rounded-full',
              isEnsacado ? 'bg-success/15' : 'bg-muted'
            )}
          >
            <AppIcon
              icon={Icon}
              size="xs"
              className={isEnsacado ? 'text-success' : 'text-muted-foreground'}
            />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
          {guias.length > 0 ? (
            <span
              className={cn(
                'ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                isEnsacado ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
              )}
            >
              {guias.length}
            </span>
          ) : null}
        </div>

        {guias.length === 0 ? (
          <p className="py-3 text-center text-sm italic text-muted-foreground/60">
            {isEnsacado ? 'Ninguna aún' : 'No hay pendientes'}
          </p>
        ) : (
          <>
            <ul className="max-h-52 space-y-1.5 overflow-y-auto font-mono text-sm sm:max-h-72" role="list">
              {guias.slice(0, ENSACADO_SCAN.maxListItems).map((guia) => (
                <li
                  key={guia}
                  className={cn(
                    'truncate rounded-lg px-3 py-1.5 text-xs',
                    isEnsacado
                      ? 'border border-success/20 bg-success/10 text-success'
                      : 'border border-border/30 bg-muted/30'
                  )}
                >
                  {guia}
                </li>
              ))}
            </ul>
            {guias.length > ENSACADO_SCAN.maxListItems ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Mostrando {ENSACADO_SCAN.maxListItems} de {guias.length}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
