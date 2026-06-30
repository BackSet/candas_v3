import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DespachoRapidoSaca } from '@/types/despacho-rapido'
import { Package } from 'lucide-react'

interface SacasPaquetesListProps {
  sacas: DespachoRapidoSaca[]
  activeSacaId: number | null
  onSeleccionarActiva: (idSaca: number) => void
  onMoverPaquete: (idPaquete: number, idSacaDestino: number) => void
  moviendo: boolean
  disabled?: boolean
}

/**
 * Resumen de las sacas del despacho rápido con los paquetes reservados en cada una.
 * Permite fijar la saca activa y mover un paquete de una saca a otra.
 */
export function SacasPaquetesList({
  sacas,
  activeSacaId,
  onSeleccionarActiva,
  onMoverPaquete,
  moviendo,
  disabled = false,
}: SacasPaquetesListProps) {
  if (sacas.length === 0) {
    return (
      <div className="surface-panel flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
        <Package className="size-7 opacity-60" />
        <p className="text-sm">Aún no hay paquetes capturados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sacas.map((saca) => {
        const activa = saca.idSaca === activeSacaId
        return (
          <div
            key={saca.idSaca}
            className={cn(
              'surface-panel overflow-hidden',
              activa && 'ring-2 ring-primary/30'
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/30 bg-muted/10 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Saca #{saca.numeroOrden}</h4>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {saca.paquetes.length} paq.
                </span>
                {saca.codigoPresinto ? (
                  <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                    {saca.codigoPresinto}
                  </span>
                ) : null}
              </div>
              {activa ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Activa
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={disabled}
                  onClick={() => onSeleccionarActiva(saca.idSaca)}
                >
                  Usar
                </Button>
              )}
            </div>

            {saca.paquetes.length > 0 ? (
              <ul className="divide-y divide-border/20">
                {saca.paquetes.map((p) => (
                  <li key={p.idPaquete} className="flex items-center gap-2 px-4 py-2">
                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {p.ordenEnSaca ?? '·'}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-sm">{p.numeroGuia}</span>
                    {sacas.length > 1 ? (
                      <Select
                        value=""
                        onValueChange={(v) => onMoverPaquete(p.idPaquete, Number(v))}
                        disabled={disabled || moviendo}
                      >
                        <SelectTrigger className="h-7 w-[112px] text-[11px]">
                          <SelectValue placeholder="Mover a…" />
                        </SelectTrigger>
                        <SelectContent>
                          {sacas
                            .filter((s) => s.idSaca !== saca.idSaca)
                            .map((s) => (
                              <SelectItem key={s.idSaca} value={String(s.idSaca)}>
                                Saca #{s.numeroOrden}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-xs text-muted-foreground">Saca vacía.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
