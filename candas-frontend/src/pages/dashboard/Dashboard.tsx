import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ModulePageIcon } from '@/components/icons'
import { LoadingState } from '@/components/states/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAtencionPaquetesPendientes } from '@/hooks/useAtencionPaquetes'
import { useDespachos } from '@/hooks/useDespachos'
import { useLotesRecepcion } from '@/hooks/useLotesRecepcion'
import { usePaquetesEstadisticas } from '@/hooks/usePaquetes'
import { cn } from '@/lib/utils'
import { getTipoProblemaLabel } from '@/types/atencion-paquete'
import { useNavigate } from '@tanstack/react-router'
import {
AlertCircle,
ArrowRight,
Box,
Boxes,
CheckCircle2,Clock,
Inbox,
Package,
TrendingUp,
Truck
} from 'lucide-react'
import { useMemo } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: paquetesStats, isLoading: loadingPaquetes } = usePaquetesEstadisticas()
  const { data: atencionesPendientes, isLoading: loadingAtenciones, refetch: refetchAtenciones } = useAtencionPaquetesPendientes()
  const { data: despachosData, isLoading: loadingDespachos, refetch: refetchDespachos } = useDespachos({ page: 0, size: 10 })
  const { data: lotesRecepcionData, isLoading: loadingLotes, refetch: refetchLotes } = useLotesRecepcion({ page: 0, size: 10 })

  const isLoading = loadingPaquetes || loadingAtenciones || loadingDespachos || loadingLotes

  const estadisticasPaquetes = useMemo(() => {
    return {
      total: paquetesStats?.total ?? 0,
      registrados: paquetesStats?.registrados ?? 0,
      recibidos: paquetesStats?.recibidos ?? 0,
      ensacados: paquetesStats?.ensacados ?? 0,
      despachados: paquetesStats?.despachados ?? 0,
    }
  }, [paquetesStats])

  const atencionesRecientes = useMemo(() => {
    return (atencionesPendientes || []).slice(0, 5)
  }, [atencionesPendientes])

  const despachosRecientes = useMemo(() => {
    return (despachosData?.content || []).slice(0, 5)
  }, [despachosData])

  const lotesRecientes = useMemo(() => {
    return (lotesRecepcionData?.content || []).slice(0, 5)
  }, [lotesRecepcionData])

  return (
    <StandardPageLayout
      title="Dashboard"
      subtitle="Resumen de operaciones en tiempo real"
      icon={<ModulePageIcon module="dashboard" />}
    >
      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <LoadingState label="Cargando información..." />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-6 space-y-8">

            {/* KPI Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              <MetricCard
                label="Total Paquetes"
                value={estadisticasPaquetes.total}
                icon={Package}
                color="blue"
              />
              <MetricCard
                label="Atenciones Pendientes"
                value={atencionesPendientes?.length || 0}
                icon={AlertCircle}
                color="red"
                alert={!!atencionesPendientes?.length}
              />
              <MetricCard
                label="Despachos"
                value={despachosData?.totalElements || 0}
                icon={Truck}
                color="amber"
              />
              <MetricCard
                label="Lotes Recepción"
                value={lotesRecepcionData?.totalElements || 0}
                icon={Boxes}
                color="emerald"
              />
            </div>

            {/* Three Column Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">

              {/* Column 1: Pipeline */}
              <div className="surface-panel elevate elevate-hover overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-info/10 flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 text-info" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Pipeline de Paquetes</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 rounded-md text-muted-foreground hover:text-foreground" onClick={() => navigate({ to: '/paquetes' })}>
                      Ver todo <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/20">
                  <PipelineRow label="Registrados" value={estadisticasPaquetes.registrados} icon={Clock} color="slate" />
                  <PipelineRow label="Recibidos" value={estadisticasPaquetes.recibidos} icon={Inbox} color="blue" />
                  <PipelineRow label="Ensacados" value={estadisticasPaquetes.ensacados} icon={Box} color="amber" />
                  <PipelineRow label="Despachados" value={estadisticasPaquetes.despachados} icon={CheckCircle2} color="emerald" />
                </div>
              </div>

              {/* Column 2: Atenciones Pendientes */}
              <div className="surface-panel elevate elevate-hover overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-error/10 flex items-center justify-center">
                        <AlertCircle className="h-3.5 w-3.5 text-error" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Atenciones Pendientes</h3>
                        {(atencionesPendientes?.length || 0) > 0 && (
                          <p className="text-[10px] text-error font-medium">{atencionesPendientes?.length} pendiente{(atencionesPendientes?.length || 0) !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 rounded-md text-muted-foreground hover:text-foreground" onClick={() => navigate({ to: '/atencion-paquetes' })}>
                      Ver todo <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="p-3">
                  {atencionesRecientes.length === 0 ? (
                    <EmptyPanel text="Sin atenciones pendientes" icon={CheckCircle2} />
                  ) : (
                    <div className="space-y-1">
                      {atencionesRecientes.map(item => (
                        <div
                          key={item.idAtencion}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate({ to: `/atencion-paquetes/${item.idAtencion}` })}
                          onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: `/atencion-paquetes/${item.idAtencion}` }) }}
                          className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all cursor-pointer border border-transparent hover:border-border/30"
                        >
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-error shrink-0 animate-pulse" />
                          <div className="space-y-1 overflow-hidden flex-1">
                            <p className="font-semibold text-sm leading-none group-hover:text-primary transition-colors">
                              {item.numeroGuia || `ID: ${item.idPaquete}`}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{getTipoProblemaLabel(item.tipoProblema)}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary mt-1 shrink-0 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Recent Activity */}
              <div className="space-y-6">
                {/* Despachos */}
                <div className="surface-panel elevate elevate-hover overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Truck className="h-3.5 w-3.5 text-warning" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Últimos Despachos</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 rounded-md text-muted-foreground hover:text-foreground" onClick={() => navigate({ to: '/despachos' })}>
                        Ver todo <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3">
                    {despachosRecientes.length === 0 ? (
                      <EmptyPanel text="Sin despachos recientes" icon={Truck} />
                    ) : (
                      <div className="space-y-1">
                        {despachosRecientes.map(item => (
                          <div
                            key={item.idDespacho}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate({ to: `/despachos/${item.idDespacho}` })}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: `/despachos/${item.idDespacho}` }) }}
                            className="group flex flex-col p-3 rounded-xl hover:bg-muted/40 transition-all cursor-pointer border border-transparent hover:border-border/30"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {item.numeroManifiesto || `#${item.idDespacho}`}
                              </span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md border-0 font-mono bg-muted/50 text-muted-foreground">
                                {item.fechaDespacho ? new Date(item.fechaDespacho).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {item.nombreAgencia || item.nombreDistribuidor || 'Sin destino'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lotes */}
                <div className="surface-panel elevate elevate-hover overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
                          <Inbox className="h-3.5 w-3.5 text-success" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Lotes Recientes</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 rounded-md text-muted-foreground hover:text-foreground" onClick={() => navigate({ to: '/lotes-recepcion' })}>
                        Ver todo <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3">
                    {lotesRecientes.length === 0 ? (
                      <EmptyPanel text="Sin lotes recientes" icon={Inbox} />
                    ) : (
                      <div className="space-y-1">
                        {lotesRecientes.map(item => (
                          <div
                            key={item.idLoteRecepcion}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate({ to: `/lotes-recepcion/${item.idLoteRecepcion}` })}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: `/lotes-recepcion/${item.idLoteRecepcion}` }) }}
                            className="group flex flex-col p-3 rounded-xl hover:bg-muted/40 transition-all cursor-pointer border border-transparent hover:border-border/30"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {item.numeroRecepcion || `#${item.idLoteRecepcion}`}
                              </span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md border-0 font-mono bg-muted/50 text-muted-foreground">
                                {item.fechaRecepcion ? new Date(item.fechaRecepcion).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {item.nombreAgencia || 'Sin agencia'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardPageLayout>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────── */

const colorMap = {
  blue: { bg: 'bg-info/10', text: 'text-info', badge: 'bg-info/15 text-info border-0' },
  red: { bg: 'bg-error/10', text: 'text-error', badge: 'bg-error/15 text-error border-0' },
  amber: { bg: 'bg-warning/10', text: 'text-warning', badge: 'bg-warning/15 text-warning border-0' },
  emerald: { bg: 'bg-success/10', text: 'text-success', badge: 'bg-success/15 text-success border-0' },
  slate: { bg: 'bg-muted', text: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground border-0' },
} as const

type ColorKey = keyof typeof colorMap

function MetricCard({ label, value, icon: Icon, color, alert }: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: ColorKey
  alert?: boolean
}) {
  const c = colorMap[color]
  return (
    <div className={cn(
      "surface-panel elevate elevate-hover group p-5",
      alert && "border-error/30 bg-error/5"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110", c.bg)}>
          <Icon className={cn("h-4 w-4", c.text)} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className={cn(
        "text-3xl font-bold tracking-tight tabular-nums",
        alert ? "text-error" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}

function PipelineRow({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: ColorKey
}) {
  const c = colorMap[color]
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", c.bg)}>
          <Icon className={cn("h-3.5 w-3.5", c.text)} />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <Badge variant="secondary" className={cn("text-[11px] px-2.5 py-0.5 rounded-md border-0 font-bold tabular-nums", c.badge)}>
        {value}
      </Badge>
    </div>
  )
}

function EmptyPanel({ text, icon: Icon }: {
  text: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
      <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground/20" />
      </div>
      <p className="text-xs text-muted-foreground/60">{text}</p>
    </div>
  )
}
