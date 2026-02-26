import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSessionEnsacado, useInfoDespacho } from '@/hooks/useEnsacado'
import { ArrowLeft, Box, CheckCircle2, Loader2, Package, Wifi } from 'lucide-react'
import { formatearFechaRelativa } from '@/utils/fechas'
import { obtenerDestino, obtenerLabelDestino, formatearTamanoSaca } from '@/utils/ensacado'
import { cn } from '@/lib/utils'

interface VistaEnsacadoSoloLecturaProps {
  onVolver: () => void
}

const MAX_ITEMS_VISIBLES = 50

export function VistaEnsacadoSoloLectura({ onVolver }: VistaEnsacadoSoloLecturaProps) {
  const { data: session, isLoading } = useSessionEnsacado()
  const lastPaqueteInfo = session?.lastPaqueteInfo ?? null

  const idDespacho = lastPaqueteInfo?.idDespacho
  const { data: despachoInfo } = useInfoDespacho(idDespacho, {
    refetchInterval: 4000,
  })

  const sacaActual = despachoInfo?.sacas?.find(
    (s) => s.idSaca === lastPaqueteInfo?.idSacaAsignada
  ) ?? null
  const paquetesPendientes = sacaActual?.paquetesPendientes ?? []
  const paquetesEnsacados = sacaActual?.paquetesEnsacados ?? []

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-muted/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 z-10 border-b border-border/30 bg-background/70 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary shrink-0">
            <Box className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">Ensacado en curso</h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <p className="text-[11px] text-muted-foreground font-medium">Sincronizando en tiempo real</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onVolver} className="gap-1.5 shrink-0 rounded-lg">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-y-auto">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-muted-foreground">
            <div className="h-12 w-12 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            <p className="text-sm font-medium">Cargando sesión...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !lastPaqueteInfo && (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4 animate-in fade-in duration-500">
            <div className="max-w-sm space-y-5">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center mx-auto">
                <Wifi className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Esperando datos</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Escanea o teclea una guía en el dispositivo principal para ver aquí los datos del paquete y la saca en curso.
                </p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
                <p className="text-xs text-muted-foreground">
                  Asegúrate de estar logueado con el mismo usuario en ambos dispositivos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Datos */}
        {!isLoading && lastPaqueteInfo && (
          <div className="w-full min-w-0 space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
              {/* Saca actual */}
              <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/60 to-primary/20 rounded-l-2xl" />
                <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saca actual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-8xl font-black tracking-tighter text-foreground tabular-nums">
                      {lastPaqueteInfo.numeroOrdenSaca ?? 0}
                    </span>
                    <span className="text-2xl sm:text-3xl text-muted-foreground/50 font-light">
                      / {lastPaqueteInfo.totalSacas ?? '?'}
                    </span>
                  </div>
                  {lastPaqueteInfo.tamanoSaca && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full border border-border/40 text-foreground text-xs font-semibold bg-muted/30">
                      {formatearTamanoSaca(lastPaqueteInfo.tamanoSaca)}
                    </span>
                  )}
                  <p className="text-sm font-mono text-muted-foreground/70">{lastPaqueteInfo.numeroGuia}</p>
                </CardContent>
              </Card>

              {/* Detalles */}
              <div className="space-y-4 sm:space-y-5 flex flex-col min-w-0">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Estado */}
                  <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 sm:h-28">
                      <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2.5">Estado</span>
                      {lastPaqueteInfo.yaEnsacado ? (
                        <div className="flex flex-col items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                          <span className="font-bold text-xs sm:text-sm">Ensacado</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin opacity-40" />
                          <span className="font-medium text-xs sm:text-sm">Pendiente</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Fecha */}
                  <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 sm:h-28">
                      <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2.5">Fecha</span>
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {lastPaqueteInfo.fechaDespacho ? formatearFechaRelativa(lastPaqueteInfo.fechaDespacho) : '-'}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                {/* Destino */}
                <Card className="flex-1 border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400/60 to-blue-600/30 rounded-l-2xl" />
                  <CardContent className="p-5 sm:p-7 flex flex-col justify-between h-full">
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        {obtenerLabelDestino(lastPaqueteInfo)}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight break-words">
                        {obtenerDestino(lastPaqueteInfo) || 'Sin destino'}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Faltan en saca</p>
                        <p className="text-2xl sm:text-3xl font-mono font-black text-foreground tabular-nums">
                          {lastPaqueteInfo.paquetesFaltantesSaca ?? 0}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground/20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Listas de guías */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
              {/* Ensacadas */}
              <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl w-full min-w-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Guías ensacadas
                    </h3>
                    {paquetesEnsacados.length > 0 && (
                      <span className="ml-auto text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {paquetesEnsacados.length}
                      </span>
                    )}
                  </div>
                  {paquetesEnsacados.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 py-3 text-center italic">Ninguna aún</p>
                  ) : (
                    <>
                      <ul className="space-y-1.5 max-h-48 sm:max-h-64 overflow-y-auto text-sm font-mono" role="list">
                        {paquetesEnsacados.slice(0, MAX_ITEMS_VISIBLES).map((guia) => (
                          <li
                            key={guia}
                            className="py-1.5 px-3 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400 truncate text-xs"
                          >
                            {guia}
                          </li>
                        ))}
                      </ul>
                      {paquetesEnsacados.length > MAX_ITEMS_VISIBLES && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Mostrando {MAX_ITEMS_VISIBLES} de {paquetesEnsacados.length}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Pendientes */}
              <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl w-full min-w-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Pendientes
                    </h3>
                    {paquetesPendientes.length > 0 && (
                      <span className="ml-auto text-[11px] font-bold tabular-nums text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {paquetesPendientes.length}
                      </span>
                    )}
                  </div>
                  {paquetesPendientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 py-3 text-center italic">No hay pendientes</p>
                  ) : (
                    <>
                      <ul className="space-y-1.5 max-h-48 sm:max-h-64 overflow-y-auto text-sm font-mono" role="list">
                        {paquetesPendientes.slice(0, MAX_ITEMS_VISIBLES).map((guia) => (
                          <li
                            key={guia}
                            className="py-1.5 px-3 rounded-lg bg-muted/30 border border-border/30 truncate text-xs"
                          >
                            {guia}
                          </li>
                        ))}
                      </ul>
                      {paquetesPendientes.length > MAX_ITEMS_VISIBLES && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Mostrando {MAX_ITEMS_VISIBLES} de {paquetesPendientes.length}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
