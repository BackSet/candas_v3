import { Badge, type BadgeProps } from '@/components/ui/badge'
import type {
  DespachoMasivoDespachoLote,
  DespachoMasivoEstado,
} from '@/types/despacho-masivo-session'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Pencil } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Metadatos visuales por estado de despacho del lote (texto + icono, no solo color). */
const LOTE_ESTADO_META: Record<
  DespachoMasivoEstado,
  { label: string; variant: BadgeProps['variant']; icon: LucideIcon }
> = {
  en_edicion: { label: 'En edición', variant: 'secondary', icon: Pencil },
  creando: { label: 'Creando…', variant: 'info', icon: Loader2 },
  creado: { label: 'Creado', variant: 'success', icon: CheckCircle2 },
  error: { label: 'Error', variant: 'error', icon: AlertTriangle },
}

export interface DespachoBatchReviewProps {
  despachos: DespachoMasivoDespachoLote[]
}

/** Lista de despachos creados (o con error) en el lote masivo actual. */
export function DespachoBatchReview({ despachos }: DespachoBatchReviewProps) {
  if (despachos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aún no hay despachos en este lote. Crea el primero desde el builder.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border/60 rounded-md border border-border">
      {despachos.map((despacho) => {
        const meta = LOTE_ESTADO_META[despacho.estado]
        const Icon = meta.icon
        return (
          <li key={despacho.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {despacho.numeroManifiesto ?? despacho.destinoResumen ?? 'Despacho'}
                </span>
                <Badge variant={meta.variant} className="gap-1">
                  <Icon
                    className={`size-3 ${despacho.estado === 'creando' ? 'animate-spin' : ''}`}
                    aria-hidden
                  />
                  {meta.label}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {despacho.destinoResumen ? `${despacho.destinoResumen} · ` : ''}
                {despacho.totalSacas ?? 0} saca(s) · {despacho.totalPaquetes ?? 0} paquete(s)
              </p>
              {despacho.estado === 'error' && despacho.error && (
                <p role="alert" className="text-xs text-error-content">
                  {despacho.error}
                </p>
              )}
            </div>
            {despacho.estado === 'creado' && despacho.idDespacho != null && (
              <Link
                to="/despachos/$id"
                params={{ id: String(despacho.idDespacho) }}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver <ExternalLink className="size-3" />
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
