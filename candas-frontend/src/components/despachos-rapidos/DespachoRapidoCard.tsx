import { CopyActionButton } from '@/components/ui/copy-action-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DespachoRapido } from '@/types/despacho-rapido'
import { ESTADO_DESPACHO_RAPIDO_LABEL } from '@/types/despacho-rapido'
import { construirResumenDespachoRapido } from '@/utils/despachoRapidoCopy'
import { formatearFechaRelativa } from '@/utils/fechas'
import { Building2, MapPin, Package, ShieldCheck, Truck } from 'lucide-react'

const ESTADO_BADGE_VARIANT: Record<DespachoRapido['estado'], 'secondary' | 'info' | 'warning' | 'success'> = {
  BORRADOR: 'secondary',
  EN_ENSACADO: 'info',
  LISTO_PARA_GUIA: 'warning',
  FINALIZADO: 'success',
}

interface DespachoRapidoCardProps {
  despacho: DespachoRapido
  onFinalizar?: (despacho: DespachoRapido) => void
}

/** Tarjeta de un despacho rápido en el tablero de escritorio: resumen, copiar y finalizar. */
export function DespachoRapidoCard({ despacho, onFinalizar }: DespachoRapidoCardProps) {
  const destino = despacho.nombreAgencia ?? despacho.nombreDestinatarioDirecto
  const sinPresinto = despacho.sacas.some((s) => !s.codigoPresinto?.trim())

  return (
    <div className="surface-panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold">
            {despacho.numeroManifiesto ?? `Despacho #${despacho.idDespacho}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {despacho.fechaDespacho ? formatearFechaRelativa(despacho.fechaDespacho) : '—'}
            {despacho.usuarioRegistro ? ` · ${despacho.usuarioRegistro}` : ''}
          </p>
        </div>
        <Badge variant={ESTADO_BADGE_VARIANT[despacho.estado]}>
          {ESTADO_DESPACHO_RAPIDO_LABEL[despacho.estado]}
        </Badge>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-sm">
        {despacho.nombreAgencia ? (
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{destino ?? 'Sin destino'}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Package className="size-3.5" />
          {despacho.totalSacas} saca(s) · {despacho.totalPaquetes} paquete(s)
        </span>
        {despacho.nombreDistribuidor ? (
          <span className="flex items-center gap-1">
            <Truck className="size-3.5" />
            {despacho.nombreDistribuidor}
          </span>
        ) : null}
      </div>

      {sinPresinto ? (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <ShieldCheck className="size-3.5" />
          Hay sacas sin presinto registrado
        </p>
      ) : null}

      <div className="flex items-center gap-2 border-t border-border/30 pt-3">
        <CopyActionButton
          textToCopy={construirResumenDespachoRapido(despacho)}
          successMessage="Resumen copiado"
          title="Copiar resumen del despacho"
          className="flex-1"
        >
          Copiar resumen
        </CopyActionButton>
        {onFinalizar && despacho.estado === 'LISTO_PARA_GUIA' ? (
          <Button type="button" size="sm" className="flex-1" onClick={() => onFinalizar(despacho)}>
            Finalizar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
