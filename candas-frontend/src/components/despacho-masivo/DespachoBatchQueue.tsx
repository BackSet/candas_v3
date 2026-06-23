import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type {
  DespachoMasivoColaEstado,
  DespachoMasivoColaItem,
} from '@/types/despacho-masivo-session'
import { AlertTriangle, Ban, CheckCircle2, Clock, Lock, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Metadatos visuales por estado de cola (texto + icono, nunca solo color). */
export const COLA_ESTADO_META: Record<
  DespachoMasivoColaEstado,
  { label: string; variant: BadgeProps['variant']; icon: LucideIcon }
> = {
  pendiente: { label: 'Resolviendo…', variant: 'secondary', icon: Clock },
  resuelto: { label: 'Disponible', variant: 'success', icon: CheckCircle2 },
  no_encontrado: { label: 'No encontrada', variant: 'error', icon: AlertTriangle },
  no_disponible: { label: 'No disponible', variant: 'warning', icon: Ban },
  asignado: { label: 'En despacho', variant: 'info', icon: Lock },
}

export interface DespachoBatchQueueProps {
  items: DespachoMasivoColaItem[]
  /** Guías actualmente seleccionadas para el despacho en construcción. */
  seleccion: Set<string>
  onToggleSeleccion: (numeroGuia: string) => void
  onRemoverGuia: (numeroGuia: string) => void
  onLimpiarCola: () => void
}

/** Cola global de guías: estados, selección de las disponibles y limpieza. */
export function DespachoBatchQueue({
  items,
  seleccion,
  onToggleSeleccion,
  onRemoverGuia,
  onLimpiarCola,
}: DespachoBatchQueueProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        La cola está vacía. Escanea o pega guías para empezar.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {items.length} guía(s) · {seleccion.size} seleccionada(s)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={onLimpiarCola}
        >
          Limpiar cola
        </Button>
      </div>

      <ul className="divide-y divide-border/60 rounded-md border border-border">
        {items.map((item) => {
          const meta = COLA_ESTADO_META[item.estado]
          const Icon = meta.icon
          const seleccionable = item.estado === 'resuelto'
          const checked = seleccion.has(item.numeroGuia)
          return (
            <li
              key={item.numeroGuia}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggleSeleccion(item.numeroGuia)}
                disabled={!seleccionable}
                aria-label={`Seleccionar guía ${item.numeroGuia}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{item.numeroGuia}</span>
                  <Badge variant={meta.variant} className="shrink-0 gap-1">
                    <Icon className="size-3" aria-hidden />
                    {meta.label}
                  </Badge>
                </div>
                {(item.paquete?.nombreClienteDestinatario || item.mensaje) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.paquete?.nombreClienteDestinatario}
                    {item.paquete?.cantonDestinatario ? ` · ${item.paquete.cantonDestinatario}` : ''}
                    {item.mensaje ? ` — ${item.mensaje}` : ''}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoverGuia(item.numeroGuia)}
                title="Quitar de la cola"
                aria-label={`Quitar guía ${item.numeroGuia} de la cola`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
