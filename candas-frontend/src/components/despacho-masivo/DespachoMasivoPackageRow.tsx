import { cn } from '@/lib/utils'
import type { Paquete } from '@/types/paquete'
import { codigoDestinoDePaquete } from '@/utils/despachoMasivoPaquete'
import {
  formatDireccionPaquete,
  formatObservacionPaquete,
  formatPesoKg,
  formatRef,
} from '@/utils/paqueteDisplay'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import { MapPin, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'

export interface DespachoMasivoPackageRowProps {
  paquete: Paquete
  /** Índice mostrado a la izquierda (orden dentro de la saca). */
  index?: number
  /** Slot a la izquierda (p. ej. checkbox de selección en la cola). */
  leading?: ReactNode
  /** Badge de estado mostrado junto a la guía. */
  badge?: ReactNode
  /** Slot a la derecha (p. ej. botón quitar). */
  trailing?: ReactNode
  /** Mensaje de estado (p. ej. "Guía no encontrada"). */
  mensaje?: string
  className?: string
}

/**
 * Fila compacta de paquete para despacho masivo: muestra los datos del paquete
 * (guía, peso, ref, dirección, observación) y del destinatario (nombre, teléfono,
 * código) en formato denso con truncado, reutilizable en la cola y en las cards
 * de saca. Admite slots para checkbox/badge/acciones sin acoplar la lógica.
 */
export function DespachoMasivoPackageRow({
  paquete,
  index,
  leading,
  badge,
  trailing,
  mensaje,
  className,
}: DespachoMasivoPackageRowProps) {
  const guia =
    guiaEfectiva(paquete) || paquete.numeroGuia || (paquete.idPaquete != null ? `#${paquete.idPaquete}` : '—')
  const peso = formatPesoKg(paquete)
  const ref = formatRef(paquete)
  const direccion = formatDireccionPaquete(paquete, { fallback: 'Sin destino' })
  const observacion = formatObservacionPaquete(paquete)
  const codigo = codigoDestinoDePaquete(paquete)
  const telefono = paquete.telefonoDestinatario?.trim() || null
  const destinatario = paquete.nombreClienteDestinatario?.trim() || null
  const datosDestino = [destinatario, telefono, codigo].filter(Boolean).join(' · ')

  return (
    <div className={cn('flex items-start gap-2', className)}>
      {leading}
      {index != null && (
        <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-[11px] text-muted-foreground">
          {index}.
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        {/* Línea 1: guía + peso + estado */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-mono text-sm font-semibold text-foreground">{guia}</span>
          <div className="flex shrink-0 items-center gap-2">
            {peso && <span className="text-xs tabular-nums text-muted-foreground">{peso}</span>}
            {badge}
          </div>
        </div>
        {mensaje && <p className="truncate text-[11px] text-muted-foreground">{mensaje}</p>}
        {/* Datos del destinatario */}
        {datosDestino && (
          <p className="flex items-center gap-1 truncate text-[11px] text-foreground/80" title={datosDestino}>
            <UserRound className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{datosDestino}</span>
          </p>
        )}
        {/* Ref (si existe) */}
        {ref && (
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-medium">Ref:</span> {ref}
          </p>
        )}
        {/* Dirección/destino */}
        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground" title={direccion}>
          <MapPin className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{direccion}</span>
        </p>
        {/* Observación (si existe) */}
        {observacion && (
          <p
            className="truncate text-[11px] text-foreground/70 max-sm:whitespace-normal max-sm:break-words"
            title={observacion}
          >
            <span className="font-medium text-muted-foreground">Obs:</span> {observacion}
          </p>
        )}
      </div>
      {trailing}
    </div>
  )
}
