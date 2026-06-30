import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DespachoRapido } from '@/types/despacho-rapido'
import { ESTADO_DESPACHO_RAPIDO_LABEL } from '@/types/despacho-rapido'
import { ClipboardList, PackagePlus, RefreshCw } from 'lucide-react'

interface DespachosRapidosMobileListProps {
  despachos: DespachoRapido[]
  activeDespachoId: number | null
  loading?: boolean
  refreshing?: boolean
  creating?: boolean
  onCrear: () => void
  onSeleccionar: (idDespacho: number) => void
  onRefresh: () => void
}

const ESTADO_VARIANT: Record<DespachoRapido['estado'], 'secondary' | 'info' | 'warning' | 'success'> = {
  BORRADOR: 'secondary',
  EN_ENSACADO: 'info',
  LISTO_PARA_GUIA: 'warning',
  FINALIZADO: 'success',
}

export function DespachosRapidosMobileList({
  despachos,
  activeDespachoId,
  loading = false,
  refreshing = false,
  creating = false,
  onCrear,
  onSeleccionar,
  onRefresh,
}: DespachosRapidosMobileListProps) {
  const activos = despachos.filter((despacho) => despacho.estado !== 'FINALIZADO')

  return (
    <section className="surface-panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="size-4 text-primary" />
            Despachos tipeados
          </h2>
          <p className="text-xs text-muted-foreground">
            Continua un despacho abierto o crea uno nuevo.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          title="Actualizar"
          aria-label="Actualizar"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
        </Button>
      </div>

      <Button type="button" className="w-full gap-2" onClick={onCrear} disabled={creating}>
        <PackagePlus className="size-4" />
        {creating ? 'Creando...' : 'Crear despacho nuevo'}
      </Button>

      {loading ? (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
          Cargando despachos...
        </p>
      ) : activos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
          No hay despachos abiertos.
        </p>
      ) : (
        <div className="space-y-2">
          {activos.map((despacho) => (
            <button
              key={despacho.idDespacho}
              type="button"
              className={cn(
                'w-full rounded-lg border border-border/60 bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeDespachoId === despacho.idDespacho && 'border-primary/60 bg-primary/5'
              )}
              onClick={() => onSeleccionar(despacho.idDespacho)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-foreground">
                    {despacho.numeroManifiesto ?? `Despacho #${despacho.idDespacho}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {despacho.nombreAgencia ?? despacho.nombreDestinatarioDirecto ?? 'Sin destino'}
                  </p>
                </div>
                <Badge variant={ESTADO_VARIANT[despacho.estado]} className="shrink-0">
                  {ESTADO_DESPACHO_RAPIDO_LABEL[despacho.estado]}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{despacho.totalSacas} sacas</span>
                <span>{despacho.totalPaquetes} paquetes</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
