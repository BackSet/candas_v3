import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Link2, List as ListIcon, Package, Plus, Settings2, SplitSquareVertical } from 'lucide-react'
import { useState } from 'react'

export interface SacaDistributionPanelProps {
  paquetesDistribuiblesCount: number
  paquetesEnSacasCount: number
  sacasCount: number
  handleTodoEnUnaSaca: () => void
  nSacasInput: string
  setNSacasInput: (value: string) => void
  handleCrearNSacas: () => void
  patronInput: string
  setPatronInput: (value: string) => void
  handleAplicarPatron: () => void
  onCadenita: () => void
  onAgregarSaca: () => void
  onCargaMasiva: () => void
}

/** Distribuye la cola hacia sacas con una acción recomendada y opciones avanzadas agrupadas. */
export function SacaDistributionPanel({
  paquetesDistribuiblesCount,
  paquetesEnSacasCount,
  sacasCount,
  handleTodoEnUnaSaca,
  nSacasInput,
  setNSacasInput,
  handleCrearNSacas,
  patronInput,
  setPatronInput,
  handleAplicarPatron,
  onCadenita,
  onAgregarSaca,
  onCargaMasiva,
}: SacaDistributionPanelProps) {
  const [showAvanzadas, setShowAvanzadas] = useState(false)
  const sinPaquetes = paquetesDistribuiblesCount === 0
  // Recomendación: si aún no hay sacas, lo más simple es "todo en una saca"; si ya hay, ajustar por N.
  const recomendarUnaSaca = sacasCount === 0

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Distribuir en sacas</h3>
        <p className="text-xs text-muted-foreground">
          {paquetesDistribuiblesCount} paquete(s) por distribuir. Se respeta el orden de tipiado.
        </p>
      </div>

      {paquetesEnSacasCount > 0 && (
        <p role="alert" className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-md px-3 py-2">
          Ya hay sacas con paquetes. Redistribuir reemplazará las sacas actuales.
        </p>
      )}

      {sinPaquetes ? (
        <p className="text-xs text-muted-foreground italic rounded-md border border-dashed border-border/70 px-3 py-4 text-center">
          No hay paquetes para distribuir. Vuelve a "Capturar guías" para agregarlos, o crea sacas manualmente desde Opciones avanzadas.
        </p>
      ) : (
      /* Acción recomendada visible */
      <div className="space-y-3">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Recomendado
          </span>
          {recomendarUnaSaca ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-foreground">Pon todos los paquetes en una sola saca.</span>
              <Button type="button" size="sm" onClick={handleTodoEnUnaSaca} disabled={sinPaquetes} className="shrink-0">
                <Package className="h-4 w-4 mr-2" /> Todo en una saca
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-foreground">Reparte los paquetes en varias sacas iguales.</span>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="number"
                  min={1}
                  value={nSacasInput}
                  onChange={(e) => setNSacasInput(e.target.value)}
                  placeholder="N sacas"
                  className="h-9 w-24"
                  disabled={sinPaquetes}
                  aria-label="Número de sacas iguales"
                />
                <Button type="button" size="sm" onClick={handleCrearNSacas} disabled={sinPaquetes || !nSacasInput.trim()}>
                  Distribuir por N sacas
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Alternativa a la recomendada (la otra opción simple) */}
        {recomendarUnaSaca ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={nSacasInput}
              onChange={(e) => setNSacasInput(e.target.value)}
              placeholder="N sacas"
              className="h-9 w-24"
              disabled={sinPaquetes}
              aria-label="Número de sacas iguales"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleCrearNSacas} disabled={sinPaquetes || !nSacasInput.trim()}>
              Distribuir por N sacas
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={handleTodoEnUnaSaca} disabled={sinPaquetes}>
            <Package className="h-4 w-4 mr-2" /> Todo en una saca
          </Button>
        )}
      </div>
      )}

      {/* Opciones avanzadas agrupadas */}
      <div className="border-t border-border/50 pt-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowAvanzadas(v => !v)}
          aria-expanded={showAvanzadas}
        >
          <Settings2 className="h-3.5 w-3.5" /> Opciones avanzadas
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAvanzadas ? 'rotate-180' : ''}`} />
        </button>

        {showAvanzadas && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={patronInput}
                onChange={(e) => setPatronInput(e.target.value)}
                placeholder="Patrón: 2,3,5"
                className="h-9 w-32 font-mono"
                disabled={sinPaquetes}
                aria-label="Patrón manual de distribución"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAplicarPatron} disabled={sinPaquetes || !patronInput.trim()}>
                <SplitSquareVertical className="h-4 w-4 mr-2" /> Aplicar patrón
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onCargaMasiva} title="Pega un listado completo de guías y distribúyelas automáticamente en sacas">
                <ListIcon className="h-4 w-4 mr-2" /> Carga masiva
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onAgregarSaca} title="Crear una saca vacía">
                <Plus className="h-4 w-4 mr-2" /> Saca manual
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onCadenita} title="Ingresa una guía padre y agrupa sus guías hijas tipo CADENITA en una nueva saca">
                <Link2 className="h-4 w-4 mr-2" /> Cadenita
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
