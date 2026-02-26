import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useAtencionPaquetesPendientes } from '@/hooks/useAtencionPaquetes'
import { useDespachos } from '@/hooks/useDespachos'
import { useLotesRecepcion } from '@/hooks/useLotesRecepcion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EstadoPaquete } from '@/types/paquete'
import { getTipoProblemaLabel } from '@/types/atencion-paquete'
import {
  Package, AlertCircle, Truck, Inbox, ArrowRight,
  CheckCircle2, Clock, Box, LayoutDashboard, Activity,
  TrendingUp, Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: paquetesData, isLoading: loadingPaquetes } = usePaquetes(0, 1000)
  const { data: atencionesPendientes, isLoading: loadingAtenciones } = useAtencionPaquetesPendientes()
  const { data: despachosData, isLoading: loadingDespachos } = useDespachos(0, 10)
  const { data: lotesRecepcionData, isLoading: loadingLotes } = useLotesRecepcion(0, 10)

  const estadisticasPaquetes = useMemo(() => {
    const paquetes = paquetesData?.content || []
    return {
      total: paquetes.length,
      registrados: paquetes.filter(p => p.estado === EstadoPaquete.REGISTRADO).length,
      recibidos: paquetes.filter(p => p.estado === EstadoPaquete.RECIBIDO).length,
      ensacados: paquetes.filter(p => p.estado === EstadoPaquete.ENSACADO).length,
      despachados: paquetes.filter(p => p.estado === EstadoPaquete.DESPACHADO).length,
    }
  }, [paquetesData])

  const atencionesRecientes = useMemo(() => {
    return (atencionesPendientes || []).slice(0, 5)
  }, [atencionesPendientes])

  const despachosRecientes = useMemo(() => {
    return (despachosData?.content || []).slice(0, 5)
  }, [despachosData])

  const lotesRecientes = useMemo(() => {
    return (lotesRecepcionData?.content || []).slice(0, 5)
  }, [lotesRecepcionData])

  const isLoading = loadingPaquetes || loadingAtenciones || loadingDespachos || loadingLotes

  return (
    <PageContainer width="full" spacing="0" className="w-full flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0">
        <PageHeader
          className="pb-0 border-b-0"
          icon={
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary" />
            </div>
          }
          title="Dashboard"
          subtitle="Resumen de operaciones en tiempo real"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando información...</span>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-6 space-y-8">

            {/* KPI Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {/* Column 1: Pipeline */}
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
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
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Atenciones Pendientes</h3>
                        {(atencionesPendientes?.length || 0) > 0 && (
                          <p className="text-[10px] text-red-500 font-medium">{atencionesPendientes?.length} pendiente{(atencionesPendientes?.length || 0) !== 1 ? 's' : ''}</p>
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
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
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
                <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Truck className="h-3.5 w-3.5 text-amber-500" />
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
                <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Inbox className="h-3.5 w-3.5 text-emerald-500" />
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
    </PageContainer>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────── */

const colorMap = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100/80 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', badge: 'bg-slate-100/80 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400' },
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
      "border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm p-5 transition-all hover:shadow-sm hover:border-border/60",
      alert && "border-red-500/20 bg-red-500/[0.03]"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", c.bg)}>
          <Icon className={cn("h-3.5 w-3.5", c.text)} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className={cn(
        "text-3xl font-bold tracking-tight",
        alert ? "text-red-600 dark:text-red-400" : "text-foreground"
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
