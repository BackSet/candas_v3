import { PaqueteTipeadoCard } from '@/components/despachos-rapidos/PaqueteTipeadoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DespachoRapidoSaca } from '@/types/despacho-rapido'
import { ClipboardCheck, Layers3, Package, Trash2 } from 'lucide-react'

interface PaquetesTipeadosPanelProps {
  sacas: DespachoRapidoSaca[]
  activeSacaId: number | null
  onSeleccionarActiva: (idSaca: number) => void
  onMoverPaquete: (idPaquete: number, idSacaDestino: number) => void
  onQuitarPaquete?: (idPaquete: number, idSaca: number) => void
  moviendo: boolean
  disabled?: boolean
}

export function PaquetesTipeadosPanel({
  sacas,
  activeSacaId,
  onSeleccionarActiva,
  onMoverPaquete,
  onQuitarPaquete,
  moviendo,
  disabled = false,
}: PaquetesTipeadosPanelProps) {
  const totalPaquetes = sacas.reduce((total, saca) => total + saca.paquetes.length, 0)
  const sacaActiva = sacas.find((saca) => saca.idSaca === activeSacaId) ?? null
  const ultimaSacaConPaquetes = [...sacas].reverse().find((saca) => saca.paquetes.length > 0)
  const ultimoPaquete = ultimaSacaConPaquetes?.paquetes[ultimaSacaConPaquetes.paquetes.length - 1] ?? null

  if (totalPaquetes === 0) {
    return (
      <div className="surface-panel flex flex-col items-center gap-3 p-6 text-center text-muted-foreground">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Package className="size-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Aun no hay paquetes capturados</p>
          <p className="mt-1 text-xs text-muted-foreground">Escanea o digita una guia para empezar.</p>
        </div>
      </div>
    )
  }

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b border-border/40 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardCheck className="size-4 text-primary" />
            Paquetes tipeados
          </h3>
          <p className="text-xs text-muted-foreground">
            Revisa destino, clasificacion y saca antes de marcar listo para guia.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {totalPaquetes} paq.
        </Badge>
      </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border/50 bg-background/70 p-2.5">
            <p className="font-semibold text-foreground">
              {sacaActiva ? `Saca #${sacaActiva.numeroOrden}` : 'Sin saca activa'}
            </p>
            <p className="mt-0.5 text-muted-foreground">Destino de captura</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/70 p-2.5">
            <p className="truncate font-mono font-semibold text-foreground">
              {ultimoPaquete?.numeroGuia ?? '-'}
            </p>
            <p className="mt-0.5 text-muted-foreground">Ultimo paquete</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {sacas.map((saca) => (
          <div key={saca.idSaca} className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Layers3 className="size-3.5" />
                Saca #{saca.numeroOrden}
                <span className="font-mono normal-case tracking-normal">({saca.paquetes.length})</span>
              </h4>
              {saca.idSaca === activeSacaId ? (
                <Badge variant="info" className="px-2 py-0 text-[11px]">
                  Activa
                </Badge>
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

            {saca.paquetes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
                Saca vacia.
              </p>
            ) : (
              <div className="space-y-2">
                {saca.paquetes.map((paquete) => (
                  <PaqueteTipeadoCard
                    key={paquete.idPaquete}
                    paquete={paquete}
                    numeroSaca={saca.numeroOrden}
                    active={saca.idSaca === activeSacaId}
                    recent={paquete.idPaquete === ultimoPaquete?.idPaquete}
                    action={
                      !disabled ? (
                        <div className="flex items-center gap-1.5">
                          {sacas.length > 1 ? (
                            <Select
                              value=""
                              onValueChange={(value) => onMoverPaquete(paquete.idPaquete, Number(value))}
                              disabled={moviendo}
                            >
                              <SelectTrigger className="h-8 w-[80px] text-[11px]">
                                <SelectValue placeholder="Mover" />
                              </SelectTrigger>
                              <SelectContent>
                                {sacas
                                  .filter((destino) => destino.idSaca !== saca.idSaca)
                                  .map((destino) => (
                                    <SelectItem key={destino.idSaca} value={String(destino.idSaca)}>
                                      Saca #{destino.numeroOrden}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => onQuitarPaquete?.(paquete.idPaquete, saca.idSaca)}
                            disabled={moviendo}
                            title="Quitar paquete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ) : null
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
