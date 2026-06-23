import { DespachoMasivoCopyActions } from '@/components/despacho-masivo/DespachoMasivoCopyActions'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type {
  DespachoMasivoDespachoLote,
  DespachoMasivoEstado,
} from '@/types/despacho-masivo-session'
import { construirListaGuias } from '@/utils/despachoMasivoCopy'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pencil,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

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
  const [expandido, setExpandido] = useState<string | null>(null)

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
        const abierto = expandido === despacho.id
        const tieneDetalle =
          (despacho.sacasDetalle?.length ?? 0) > 0 || (despacho.numerosGuia?.length ?? 0) > 0
        return (
          <li key={despacho.id} className="px-3 py-2.5 text-sm">
            <div className="flex items-start gap-3">
              {tieneDetalle ? (
                <button
                  type="button"
                  onClick={() => setExpandido(abierto ? null : despacho.id)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-expanded={abierto}
                  aria-label={abierto ? 'Ocultar detalle' : 'Ver detalle'}
                >
                  {abierto ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              ) : (
                <span className="mt-0.5 w-4 shrink-0" aria-hidden />
              )}

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
                  Ver despacho <ExternalLink className="size-3" />
                </Link>
              )}
            </div>

            {abierto && (
              <div className="ml-7 mt-2 space-y-3 border-l border-border/60 pl-3">
                {despacho.nombreDistribuidor && (
                  <p className="text-xs text-muted-foreground">
                    Distribuidor: <span className="text-foreground">{despacho.nombreDistribuidor}</span>
                    {despacho.numeroGuiaTransporte ? ` · Guía: ${despacho.numeroGuiaTransporte}` : ''}
                  </p>
                )}
                {despacho.observaciones && (
                  <p className="text-xs text-muted-foreground">
                    Obs: <span className="text-foreground">{despacho.observaciones}</span>
                  </p>
                )}

                {despacho.sacasDetalle && despacho.sacasDetalle.length > 0 && (
                  <ul className="space-y-1.5">
                    {despacho.sacasDetalle.map((saca) => (
                      <li key={saca.numero} className="text-xs">
                        <span className="font-medium">Saca {saca.numero}</span> —{' '}
                        {formatearTamanoSaca(saca.tamano)} · {saca.totalPaquetes} paquete(s)
                        {saca.pesoEstimado
                          ? ` · ${saca.pesoEstimado.toFixed(2).replace(/\.?0+$/, '')} kg`
                          : ''}
                        {saca.codigoPresinto ? ` · Presinto ${saca.codigoPresinto}` : ''}
                        {saca.numerosGuia.length > 0 && (
                          <span className="block truncate font-mono text-muted-foreground">
                            {saca.numerosGuia.join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <DespachoMasivoCopyActions
                  resumenText={despacho.resumenCopiable}
                  guiasText={
                    despacho.numerosGuia && despacho.numerosGuia.length > 0
                      ? construirListaGuias(despacho.numerosGuia)
                      : undefined
                  }
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
