import { EnsacadoLayoutHeader } from '@/components/ensacado/EnsacadoLayoutHeader'
import { SacaGuiasPanel } from '@/components/ensacado/SacaGuiasPanel'
import { AppIcon,ModulePageIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { ENSACADO_POLL } from '@/constants/ensacado'
import { useInfoDespacho,useSessionEnsacado } from '@/hooks/useEnsacado'
import { cn } from '@/lib/utils'
import { formatearTamanoSaca,obtenerDestino,obtenerLabelDestino } from '@/utils/ensacado'
import { formatearFechaRelativa } from '@/utils/fechas'
import {
CheckCircle2,
Loader2,
RefreshCw,
Smartphone,
WifiOff,
} from 'lucide-react'

interface VistaEnsacadoSoloLecturaProps {
  onVolver: () => void
}

export function VistaEnsacadoSoloLectura({ onVolver }: VistaEnsacadoSoloLecturaProps) {
  const {
    data: session,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useSessionEnsacado()

  const lastPaqueteInfo = session?.lastPaqueteInfo ?? null

  const { data: despachoInfo } = useInfoDespacho(lastPaqueteInfo?.idDespacho, {
    refetchInterval: ENSACADO_POLL.despachoMs,
    enabled: !!lastPaqueteInfo?.idDespacho,
  })

  const sacaActual =
    despachoInfo?.sacas?.find((s) => s.idSaca === lastPaqueteInfo?.idSacaAsignada) ?? null

  const syncLabel = session?.lastUpdated
    ? `Actualizado ${formatearFechaRelativa(session.lastUpdated)}`
    : dataUpdatedAt
      ? `Consultado ${formatearFechaRelativa(new Date(dataUpdatedAt).toISOString())}`
      : 'Sin datos aún'

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      <EnsacadoLayoutHeader
        title="Ensacado en curso"
        subtitle={syncLabel}
        onBack={onVolver}
        trailing={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => void refetch()}
              title="Actualizar ahora"
            >
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            </Button>
            <SyncPulse active={!isError && !!lastPaqueteInfo} fetching={isFetching} />
          </div>
        }
      />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Conectando con la sesión…</p>
          </div>
        ) : null}

        {!isLoading && isError ? (
          <div className="flex max-w-sm flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-error/10">
              <WifiOff className="size-10 text-error" />
            </div>
            <h2 className="text-xl font-bold">No se pudo sincronizar</h2>
            <p className="text-sm text-muted-foreground">
              Verifica la conexión y que hayas iniciado sesión con el mismo usuario en el dispositivo de
              escaneo.
            </p>
            <Button type="button" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && !lastPaqueteInfo ? (
          <div className="flex max-w-md flex-1 flex-col items-center justify-center gap-6 text-center animate-in fade-in">
            <ModulePageIcon module="ensacado" variant="empty" className="size-16" />
            <div>
              <h2 className="mb-2 text-xl font-bold">Esperando escaneo</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                En el equipo principal elige <strong>Escanear paquetes</strong> y lee una guía. Los datos
                aparecerán aquí en unos segundos.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/80 p-4 text-left text-sm">
              <AppIcon icon={Smartphone} size="md" className="mt-0.5 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                Debes usar la <strong>misma cuenta de usuario</strong> en ambos dispositivos. La sincronización
                se actualiza cada {ENSACADO_POLL.sessionMs / 1000} segundos.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && lastPaqueteInfo ? (
          <div className="w-full max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="overflow-hidden rounded-2xl border-border/40 bg-card/80 shadow-sm">
                <CardContent className="flex flex-col items-center p-6 text-center sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Saca actual
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-6xl font-black tabular-nums tracking-tighter sm:text-8xl">
                      {lastPaqueteInfo.numeroOrdenSaca ?? 0}
                    </span>
                    <span className="text-2xl font-light text-muted-foreground sm:text-3xl">
                      / {lastPaqueteInfo.totalSacas ?? '?'}
                    </span>
                  </div>
                  {lastPaqueteInfo.tamanoSaca ? (
                    <span className="mt-2 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-xs font-semibold">
                      {formatearTamanoSaca(lastPaqueteInfo.tamanoSaca)}
                    </span>
                  ) : null}
                  <p className="mt-4 font-mono text-lg font-semibold">{lastPaqueteInfo.numeroGuia}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card className="rounded-2xl border-border/40 bg-card/80">
                  <CardContent className="flex h-28 flex-col items-center justify-center p-4 text-center">
                    <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Estado
                    </span>
                    {lastPaqueteInfo.yaEnsacado ? (
                      <div className="flex flex-col items-center gap-1 text-success">
                        <CheckCircle2 className="size-8" strokeWidth={1.75} />
                        <span className="text-sm font-bold">Ensacado</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Loader2 className="size-8 animate-spin opacity-50" />
                        <span className="text-sm font-medium">Pendiente</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/40 bg-card/80">
                  <CardContent className="flex h-28 flex-col items-center justify-center p-4 text-center">
                    <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Faltan en saca
                    </span>
                    <span className="text-3xl font-black tabular-nums">
                      {lastPaqueteInfo.paquetesFaltantesSaca ?? 0}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="rounded-2xl border-border/40 bg-card/80">
              <CardContent className="p-5 sm:p-6">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {obtenerLabelDestino(lastPaqueteInfo)}
                </p>
                <p className="text-2xl font-bold break-words sm:text-3xl">
                  {obtenerDestino(lastPaqueteInfo) ?? 'Sin destino'}
                </p>
                {lastPaqueteInfo.direccionDestinatarioCompleta ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {lastPaqueteInfo.direccionDestinatarioCompleta}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <SacaGuiasPanel
              ensacados={sacaActual?.paquetesEnsacados ?? []}
              pendientes={sacaActual?.paquetesPendientes ?? []}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SyncPulse({ active, fetching }: { active: boolean; fetching: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium',
        active ? 'border-success/30 bg-success/10 text-success' : 'border-border/50 bg-muted/40 text-muted-foreground'
      )}
    >
      <span className="relative flex size-2">
        {fetching ? (
          <span className="relative inline-flex size-2 rounded-full bg-primary animate-pulse" />
        ) : (
          <>
            {active ? (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            ) : null}
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                active ? 'bg-success' : 'bg-muted-foreground/40'
              )}
            />
          </>
        )}
      </span>
      En vivo
    </div>
  )
}
