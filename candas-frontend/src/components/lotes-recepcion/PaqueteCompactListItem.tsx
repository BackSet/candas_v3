import { cn } from '@/lib/utils'
import type { Paquete } from '@/types/paquete'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import {
  formatDireccionPaquete,
  formatObservacionPaquete,
  formatPesoKg,
  formatRef,
  type FormatDireccionOptions,
} from '@/utils/paqueteDisplay'
import React from 'react'

interface PaqueteCompactListItemProps {
  paquete: Paquete
  /** Índice mostrado a la izquierda (p. ej. orden de despacho). Si es null no se muestra. */
  index?: number | null
  /** Acción al final de la fila (normalmente un botón para quitar). */
  action?: React.ReactNode
  /** Texto de fallback de dirección/destino ('Sin dirección' por defecto; 'Sin destino' en despacho). */
  direccionFallback?: FormatDireccionOptions['fallback']
  /** Estado textual compacto mostrado bajo el paquete (p. ej. "Pendiente de saca"). */
  statusLabel?: string
  className?: string
}

/**
 * Fila/card compacta de un paquete para listados operativos del detalle de lote.
 *
 * Diseño (denso, alto y legible):
 *   ECA7800080423                3.63 kg
 *   Ref: ABC123
 *   NV LOJA, Loja, Loja, Ecuador
 *   Obs: NEXA MISHEL
 *
 * - Guía en negrita y monoespaciada para escaneo rápido; peso a la derecha, secundario.
 * - Ref solo si existe (sin "Ref:" vacío).
 * - Dirección/destino normalizado en una línea con truncado.
 * - Observación truncada en una línea en desktop/tablet; en móvil se muestra completa.
 * - Sin iconos grandes ni labels pesados repetidos por elemento.
 */
export const PaqueteCompactListItem = React.memo<PaqueteCompactListItemProps>(({
  paquete,
  index = null,
  action,
  direccionFallback,
  statusLabel,
  className,
}) => {
  const guia = guiaEfectiva(paquete) || paquete.numeroGuia || (paquete.idPaquete != null ? `#${paquete.idPaquete}` : '-')
  const peso = formatPesoKg(paquete)
  const ref = formatRef(paquete)
  const direccion = formatDireccionPaquete(paquete, direccionFallback != null ? { fallback: direccionFallback } : {})
  const observacion = formatObservacionPaquete(paquete)

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors group',
        className,
      )}
    >
      {index != null && (
        <span className="text-[11px] text-muted-foreground font-mono w-6 text-right shrink-0 pt-0.5">{index}.</span>
      )}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Línea 1: guía + peso */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono font-semibold text-sm text-foreground truncate">{guia}</span>
          {peso && <span className="text-xs text-muted-foreground tabular-nums shrink-0">{peso}</span>}
        </div>
        {/* Línea 2: ref (solo si existe) */}
        {ref && (
          <p className="text-[11px] text-muted-foreground truncate">
            <span className="font-medium">Ref:</span> {ref}
          </p>
        )}
        {/* Línea 3: dirección/destino normalizado, una línea con truncado */}
        <p className="text-[11px] text-muted-foreground truncate" title={direccion}>
          {direccion}
        </p>
        {/* Línea 4: observación (truncada en desktop/tablet, completa en móvil) */}
        {observacion && (
          <p
            className="text-[11px] text-foreground/70 truncate sm:truncate max-sm:whitespace-normal max-sm:break-words"
            title={observacion}
          >
            <span className="font-medium text-muted-foreground">Obs:</span> {observacion}
          </p>
        )}
        {/* Estado textual (no depende solo de color) */}
        {statusLabel && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {statusLabel}
          </span>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
})

PaqueteCompactListItem.displayName = 'PaqueteCompactListItem'
