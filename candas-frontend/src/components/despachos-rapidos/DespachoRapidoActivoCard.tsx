import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DespachoRapido } from '@/types/despacho-rapido'
import { ESTADO_DESPACHO_RAPIDO_LABEL } from '@/types/despacho-rapido'
import { ArrowLeftRight, MapPin, PackageCheck, ScanLine, Trash2 } from 'lucide-react'

interface DespachoRapidoActivoCardProps {
  despacho: DespachoRapido
  onCambiarDespacho: () => void
  onEliminar?: () => void
  eliminando?: boolean
}

const ESTADO_VARIANT: Record<DespachoRapido['estado'], 'secondary' | 'info' | 'warning' | 'success'> = {
  BORRADOR: 'secondary',
  EN_ENSACADO: 'info',
  LISTO_PARA_GUIA: 'warning',
  FINALIZADO: 'success',
}

export function DespachoRapidoActivoCard({
  despacho,
  onCambiarDespacho,
  onEliminar,
  eliminando = false,
}: DespachoRapidoActivoCardProps) {
  const destino = despacho.nombreAgencia ?? despacho.nombreDestinatarioDirecto ?? 'Sin destino'

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b border-border/40 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <ScanLine className="size-3.5" />
              Despacho activo
            </p>
            <h2 className="mt-1 truncate font-mono text-lg font-bold leading-tight text-foreground">
              {despacho.numeroManifiesto ?? `#${despacho.idDespacho}`}
            </h2>
          </div>
          <Badge variant={ESTADO_VARIANT[despacho.estado]} className="shrink-0">
            {ESTADO_DESPACHO_RAPIDO_LABEL[despacho.estado]}
          </Badge>
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="min-w-0 break-words">{destino}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/40">
        <Metric label="Sacas" value={String(despacho.totalSacas)} />
        <Metric label="Paquetes" value={String(despacho.totalPaquetes)} />
        <div className="flex items-center justify-center gap-0.5 p-3">
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={onCambiarDespacho}>
            <ArrowLeftRight className="size-3.5" />
            Cambiar
          </Button>
          {onEliminar ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={onEliminar}
              disabled={eliminando}
              title="Eliminar despacho"
              aria-label="Eliminar despacho"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3">
      <PackageCheck className="size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-base font-bold tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
