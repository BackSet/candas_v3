import { AppIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PaqueteEnsacadoInfo } from '@/types/ensacado'
import { formatearTamanoSaca, obtenerDestino, obtenerLabelDestino } from '@/utils/ensacado'
import { formatearFechaRelativa } from '@/utils/fechas'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Hash,
  Loader2,
  MapPin,
  Package,
  Phone,
  ScanLine,
  Truck,
} from 'lucide-react'

interface MobilePackageInfoPanelProps {
  info: PaqueteEnsacadoInfo | null
  isLoading: boolean
  errorMessage: string | null
  /** Guía que originó la consulta actual (para los estados de carga / error). */
  guiaConsultada: string | null
  /** Resalta brevemente tras una lectura exitosa. */
  highlightSuccess?: boolean
}

/**
 * Zona superior de la pantalla de lector móvil: muestra la información del paquete
 * de la última guía leída. Es una vista de consulta/validación rápida; no marca el
 * paquete como ensacado.
 *
 * El contrato `PaqueteEnsacadoInfo` no expone transportadora ni guía de transporte;
 * se presentan los datos operativos equivalentes disponibles: destino (agencia o
 * destinatario directo), dirección, manifiesto, despacho y saca.
 */
export function MobilePackageInfoPanel({
  info,
  isLoading,
  errorMessage,
  guiaConsultada,
  highlightSuccess = false,
}: MobilePackageInfoPanelProps) {
  if (isLoading) {
    return (
      <PanelShell>
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Buscando paquete…</p>
          {guiaConsultada ? (
            <p className="font-mono text-xs text-muted-foreground/80">{guiaConsultada}</p>
          ) : null}
        </div>
      </PanelShell>
    )
  }

  if (errorMessage) {
    return (
      <PanelShell className="border-error/30 bg-error/5">
        <div className="flex items-center gap-3 py-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error/15">
            <AlertCircle className="size-5 text-error" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-error">{errorMessage}</p>
            {guiaConsultada ? (
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{guiaConsultada}</p>
            ) : null}
          </div>
        </div>
      </PanelShell>
    )
  }

  if (!info) {
    return (
      <PanelShell>
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
          <ScanLine className="size-8 opacity-60" />
          <p className="text-sm">Escanea o ingresa una guía para ver el paquete.</p>
        </div>
      </PanelShell>
    )
  }

  const enSaca = info.enSaca !== false
  const destino = obtenerDestino(info)
  const telefono = info.telefonoAgencia || info.telefonoDestinatarioDirecto || null

  return (
    <PanelShell
      className={cn(
        'transition-all duration-300',
        highlightSuccess ? 'border-success/40 ring-2 ring-success/20' : 'border-border/50'
      )}
    >
      <div className="space-y-3">
        {/* Guía + estado */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Paquete
            </p>
            <p className="font-mono text-2xl font-bold leading-tight tracking-tight">{info.numeroGuia}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {info.yaEnsacado ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" />
                  Ya ensacado
                </Badge>
              ) : null}
              {!enSaca ? <Badge variant="warning">Sin saca asignada</Badge> : null}
              {info.sacaLlena ? <Badge variant="warning">Saca llena</Badge> : null}
              {info.despachoLleno ? <Badge variant="info">Despacho completo</Badge> : null}
            </div>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <AppIcon icon={Package} size="md" className="text-primary" />
          </div>
        </div>

        {/* Destino */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {obtenerLabelDestino(info)}
            </p>
            <AppIcon icon={Truck} size="xs" className="text-muted-foreground" />
          </div>
          <p className="font-semibold leading-tight">{destino ?? 'Sin destino'}</p>
          {info.direccionDestinatarioCompleta ? (
            <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2">{info.direccionDestinatarioCompleta}</span>
            </div>
          ) : null}
          {telefono ? (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              <span>{telefono}</span>
            </div>
          ) : null}
        </div>

        {/* Saca + Despacho */}
        {enSaca ? (
          <div className="grid grid-cols-2 gap-2">
            <MetaTile label="Saca" icon={Hash}>
              <span className="font-medium">#{info.numeroOrdenSaca}</span>
              {info.tamanoSaca ? (
                <span className="text-xs text-muted-foreground"> · {formatearTamanoSaca(info.tamanoSaca)}</span>
              ) : null}
              {info.codigoQrSaca ? (
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{info.codigoQrSaca}</p>
              ) : null}
            </MetaTile>
            <MetaTile label="Despacho" icon={Calendar}>
              <span className="font-medium">{info.numeroManifiesto || '—'}</span>
              {info.fechaDespacho ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatearFechaRelativa(info.fechaDespacho)}
                </p>
              ) : null}
            </MetaTile>
          </div>
        ) : null}

        {/* Alertas / observaciones */}
        {info.mensajeAlerta ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            {info.mensajeAlerta}
          </div>
        ) : null}
        {info.observaciones ? (
          <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
            {info.observaciones}
          </div>
        ) : null}
      </div>
    </PanelShell>
  )
}

function PanelShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

function MetaTile({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof Hash
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}
