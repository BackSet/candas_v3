import type { PaqueteEnsacadoInfo } from '@/types/ensacado'
import { Package, Truck, MapPin, Hash, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatearFechaRelativa } from '@/utils/fechas'
import { obtenerDestino, obtenerLabelDestino } from '@/utils/ensacado'
import { cn } from '@/lib/utils'

interface PaqueteInfoCardProps {
  info: PaqueteEnsacadoInfo
}

export function PaqueteInfoCard({ info }: PaqueteInfoCardProps) {
  const enSaca = info.enSaca !== false
  const destino = obtenerDestino(info)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Información principal del paquete */}
      <div className={cn(
        "relative rounded-2xl border bg-card/80 backdrop-blur-sm p-5 shadow-sm overflow-hidden transition-all duration-300",
        info.yaEnsacado
          ? "border-emerald-200 dark:border-emerald-900/40"
          : "border-border/50"
      )}>
        {/* Acento lateral */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
          info.yaEnsacado
            ? "bg-gradient-to-b from-emerald-400 to-emerald-600"
            : "bg-gradient-to-b from-primary/60 to-primary/30"
        )} />

        <div className="pl-3 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Paquete</p>
              <p className="text-xl sm:text-2xl font-mono font-bold tracking-tight">{info.numeroGuia}</p>
              {info.yaEnsacado && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ya ensacado
                </div>
              )}
              {info.sacaLlena && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Saca llena
                </div>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </div>

          {enSaca && (
            <div className="pt-3 border-t border-border/40 flex items-center gap-5">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Saca</p>
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span>#{info.numeroOrdenSaca}</span>
                  <span className="text-muted-foreground/50 text-xs font-normal">({info.codigoQrSaca})</span>
                </div>
              </div>
              <div className="w-px h-7 bg-border/50" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Fecha</p>
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span>{info.fechaDespacho ? formatearFechaRelativa(info.fechaDespacho) : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información de destino */}
      {enSaca && (
        <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-sm overflow-hidden flex flex-col justify-between">
          {/* Acento lateral */}
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-blue-400/60 to-blue-600/40" />

          <div className="pl-3">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{obtenerLabelDestino(info)}</p>
              <div className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center">
                <Truck className="h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>
            <p className="text-lg font-bold leading-tight">{destino}</p>
            {info.direccionDestinatarioCompleta && (
              <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{info.direccionDestinatarioCompleta}</span>
              </div>
            )}
          </div>

          {info.observaciones && (
            <div className="pl-3 mt-4 pt-3 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 tracking-wider">Notas</p>
              <div className="text-sm bg-amber-500/8 text-amber-700 dark:text-amber-300 p-2.5 rounded-lg border border-amber-500/15">
                {info.observaciones}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
