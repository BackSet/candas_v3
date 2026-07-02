import { AppIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PaqueteEnsacadoInfo, SacaEnsacadoInfo } from '@/types/ensacado'
import {
  calcularMetricasLlenadoSaca,
  formatearTamanoSaca,
  obtenerDestino,
  obtenerLabelDestino,
} from '@/utils/ensacado'
import { formatearFechaRelativa } from '@/utils/fechas'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Hash,
  MapPin,
  Package,
  Scale,
  Truck,
} from 'lucide-react'

interface PaqueteInfoCardProps {
  info: PaqueteEnsacadoInfo
  saca?: SacaEnsacadoInfo | null
  /** Resalta brevemente tras ensacar correctamente */
  highlightSuccess?: boolean
}

export function PaqueteInfoCard({ info, saca = null, highlightSuccess = false }: PaqueteInfoCardProps) {
  const enSaca = info.enSaca !== false
  const destino = obtenerDestino(info)
  const metricas = calcularMetricasLlenadoSaca(info, saca)

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300',
            info.yaEnsacado || highlightSuccess
              ? 'border-success/40 ring-2 ring-success/20'
              : 'border-border/50',
            highlightSuccess && 'animate-in fade-in duration-300'
          )}
        >
          <div
            className={cn(
              'absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl',
              info.yaEnsacado ? 'bg-success' : 'bg-primary'
            )}
          />

          <div className="space-y-4 pl-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Paquete
                </p>
                <p className="font-mono text-xl font-bold tracking-tight sm:text-2xl">{info.numeroGuia}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {info.yaEnsacado ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Ya ensacado
                    </Badge>
                  ) : null}
                  {info.sacaLlena ? (
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="size-3" />
                      Saca llena
                    </Badge>
                  ) : null}
                  {info.despachoLleno ? (
                    <Badge variant="info">Despacho completo</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <AppIcon icon={Package} size="md" className="text-primary" />
              </div>
            </div>

            {enSaca ? (
              <div className="flex flex-wrap items-center gap-4 border-t border-border/40 pt-3">
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Saca
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Hash className="size-3.5 text-muted-foreground" />
                    <span>#{info.numeroOrdenSaca}</span>
                    {info.tamanoSaca ? (
                      <span className="text-xs text-muted-foreground">
                        · {formatearTamanoSaca(info.tamanoSaca)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{info.codigoQrSaca}</p>
                </div>
                <div className="hidden h-8 w-px bg-border/50 sm:block" />
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Despacho
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>{info.fechaDespacho ? formatearFechaRelativa(info.fechaDespacho) : '—'}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{info.numeroManifiesto}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {enSaca ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-info/60" />
            <div className="pl-3">
              <div className="mb-2 flex items-start justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {obtenerLabelDestino(info)}
                </p>
                <AppIcon icon={Truck} size="sm" className="text-muted-foreground" />
              </div>
              <p className="text-lg font-bold leading-tight">{destino ?? 'Sin destino'}</p>
              {info.direccionDestinatarioCompleta ? (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="line-clamp-2">{info.direccionDestinatarioCompleta}</span>
                </div>
              ) : null}
              {info.observaciones ? (
                <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 p-2.5 text-sm text-warning">
                  {info.observaciones}
                </div>
              ) : null}
              {info.pesoPaquete == null ? (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-xs text-blue-600">
                  <Scale className="size-4 shrink-0 text-blue-500" />
                  <span>Peso no registrado en el paquete</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {enSaca ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ProgressStat
            label="Progreso ensacado"
            value={`${metricas.pctPorPaquetes}%`}
            sub={`${metricas.ensacados} de ${metricas.totalAsignados} paquetes`}
            percent={metricas.pctPorPaquetes}
            tone={metricas.pctPorPaquetes >= 100 ? 'success' : 'primary'}
          />
          <ProgressStat
            label="Llenado por peso"
            value={info.pesoPaquete == null ? '—' : `${metricas.pctPorPeso}%`}
            sub={info.pesoPaquete == null ? 'Peso no registrado' : `${(info.pesoActualSaca ?? 0).toFixed(1)} / ${(info.capacidadMaximaSaca ?? 0).toFixed(1)} kg`}
            percent={info.pesoPaquete == null ? undefined : metricas.pctPorPeso}
            icon={Scale}
            tone={metricas.pctPorPeso >= 100 ? 'success' : 'muted'}
          />
          <ProgressStat
            label="Faltan en saca"
            value={String(metricas.pendientes)}
            sub={info.mensajeAlerta ?? 'Por ensacar en bodega'}
            tone={metricas.pendientes === 0 ? 'success' : 'muted'}
          />
        </div>
      ) : null}
    </div>
  )
}

function ProgressStat({
  label,
  value,
  sub,
  percent,
  tone = 'muted',
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  percent?: number
  tone?: 'primary' | 'success' | 'muted'
  icon?: typeof Scale
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon ? <AppIcon icon={Icon} size="xs" className="text-muted-foreground" /> : null}
      </div>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'primary' && 'text-primary'
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
      {percent != null ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percent >= 100 ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
