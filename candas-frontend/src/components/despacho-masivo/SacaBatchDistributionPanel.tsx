import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Box, Boxes, ListOrdered } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type DistribMode = 'una' | 'n' | 'patron'

const MODOS: { key: DistribMode; label: string; icon: LucideIcon }[] = [
  { key: 'una', label: 'Todo en una saca', icon: Box },
  { key: 'n', label: 'Repartir en N sacas', icon: Boxes },
  { key: 'patron', label: 'Aplicar patrón', icon: ListOrdered },
]

export interface SacaBatchDistributionPanelProps {
  totalPaquetes: number
  modo: DistribMode
  onModoChange: (m: DistribMode) => void
  numSacas: number
  onNumSacasChange: (n: number) => void
  patronTexto: string
  onPatronChange: (t: string) => void
  patronError?: string | null
  /** Cantidad de paquetes por saca resultante (preview en vivo). */
  conteoPorSaca: number[]
  /** Paquetes que sobran tras aplicar el patrón (van a una saca extra). */
  sobrantes?: number
  /** Cuánto pide el patrón por encima del total disponible. */
  faltantes?: number
}

/** Control de distribución de sacas: una saca, N sacas o patrón manual, con preview en vivo. */
export function SacaBatchDistributionPanel({
  totalPaquetes,
  modo,
  onModoChange,
  numSacas,
  onNumSacasChange,
  patronTexto,
  onPatronChange,
  patronError,
  conteoPorSaca,
  sobrantes,
  faltantes,
}: SacaBatchDistributionPanelProps) {
  return (
    <div className="space-y-4">
      {/* Selector de modo */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODOS.map(({ key, label, icon: Icon }) => {
          const activo = key === modo
          return (
            <Button
              key={key}
              type="button"
              variant={activo ? 'default' : 'outline'}
              onClick={() => onModoChange(key)}
              className="justify-start"
              aria-pressed={activo}
            >
              <Icon className="size-4" /> {label}
            </Button>
          )
        })}
      </div>

      {/* Parámetro según modo */}
      {modo === 'n' && (
        <div className="space-y-1.5">
          <Label htmlFor="masivo-num-sacas">Número de sacas</Label>
          <Input
            id="masivo-num-sacas"
            type="number"
            min={1}
            max={Math.max(1, totalPaquetes)}
            value={numSacas}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              onNumSacasChange(Number.isNaN(v) ? 1 : v)
            }}
            className="w-28"
          />
        </div>
      )}

      {modo === 'patron' && (
        <div className="space-y-1.5">
          <Label htmlFor="masivo-patron">Patrón (paquetes por saca, p. ej. 2,3,5)</Label>
          <Input
            id="masivo-patron"
            value={patronTexto}
            onChange={(e) => onPatronChange(e.target.value)}
            placeholder="2,3,5"
            inputMode="numeric"
            aria-invalid={!!patronError}
            aria-describedby={patronError ? 'masivo-patron-error' : undefined}
            className="w-44 font-mono"
          />
          {patronError && (
            <p id="masivo-patron-error" role="alert" className="text-xs text-error-content">
              {patronError}
            </p>
          )}
        </div>
      )}

      {/* Preview en vivo */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {conteoPorSaca.length} saca(s) · {totalPaquetes} paquete(s)
        </p>
        {conteoPorSaca.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {conteoPorSaca.map((n, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs tabular-nums"
              >
                <span className="text-muted-foreground">S{i + 1}</span>
                <span className="font-medium">{n}</span>
              </span>
            ))}
          </div>
        )}
        {modo === 'patron' && !patronError && (sobrantes ?? 0) > 0 && (
          <p className="text-xs text-warning-content">
            {sobrantes} paquete(s) sobrante(s) se agruparon en una saca adicional.
          </p>
        )}
        {modo === 'patron' && !patronError && (faltantes ?? 0) > 0 && (
          <p className="text-xs text-warning-content">
            El patrón pide {faltantes} paquete(s) más de los disponibles; se ignoraron los grupos
            vacíos.
          </p>
        )}
      </div>
    </div>
  )
}
