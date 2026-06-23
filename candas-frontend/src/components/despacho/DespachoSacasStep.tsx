import { PaqueteCompactListItem } from '@/components/lotes-recepcion/PaqueteCompactListItem'
import { Button } from '@/components/ui/button'
import { SectionTitle } from '@/components/ui/section-title'
import type { SacaFormData } from '@/hooks/useSacasManager'
import type { Paquete } from '@/types/paquete'
import { TamanoSaca } from '@/types/saca'
import { ArrowLeft, ArrowRight, ListChecks, Package, ScanLine, SplitSquareVertical, Trash2 } from 'lucide-react'
import { PaqueteCapturePanel, type PaqueteCapturePanelProps } from './PaqueteCapturePanel'
import { SacaDistributionPanel, type SacaDistributionPanelProps } from './SacaDistributionPanel'
import { SacaReviewCard } from './SacaReviewCard'

export type SubPasoSacas = 'capturar' | 'distribuir' | 'revisar'

export interface DespachoSacasStepProps {
  sacas: SacaFormData[]
  subPaso: SubPasoSacas
  setSubPaso: (v: SubPasoSacas) => void
  capture: PaqueteCapturePanelProps
  distribution: SacaDistributionPanelProps
  colaGlobal: Paquete[]
  onLimpiarCola: () => void
  onEliminarDeColaGlobal: (idPaquete: number) => void
  onEliminarPaqueteDeSaca: (sacaIndex: number, paqueteId: number) => void
  onMoverPaqueteASaca: (paqueteId: number, sacaOrigenIndex: number, sacaDestinoIndex: number) => void
  onTamanoChange: (index: number, tamano: TamanoSaca) => void
  onPresintoChange: (index: number, value: string) => void
  onGenerarPresinto: (index: number) => void
  onAgregarPaquetes: (index: number) => void
  onPaqueteRapido: (index: number) => void
  onEliminarSaca: (index: number) => void
  onSiguiente: () => void
  onAnterior: () => void
}

const SUBPASOS: { key: SubPasoSacas; label: string; icon: typeof ScanLine }[] = [
  { key: 'capturar', label: 'Capturar guías', icon: ScanLine },
  { key: 'distribuir', label: 'Distribuir', icon: SplitSquareVertical },
  { key: 'revisar', label: 'Revisar sacas', icon: ListChecks },
]

/** Paso 2 del formulario de despacho como flujo guiado: Capturar → Distribuir → Revisar. */
export function DespachoSacasStep({
  sacas,
  subPaso,
  setSubPaso,
  capture,
  distribution,
  colaGlobal,
  onLimpiarCola,
  onEliminarDeColaGlobal,
  onEliminarPaqueteDeSaca,
  onMoverPaqueteASaca,
  onTamanoChange,
  onPresintoChange,
  onGenerarPresinto,
  onAgregarPaquetes,
  onPaqueteRapido,
  onEliminarSaca,
  onSiguiente,
  onAnterior,
}: DespachoSacasStepProps) {
  const hayCola = colaGlobal.length > 0
  const haySacas = sacas.length > 0
  const sacasValidas = haySacas && sacas.every(s => s.idPaquetes.length > 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <SectionTitle
        title="Gestionar Sacas"
        variant="form"
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        description="Captura las guías, distribúyelas en sacas y revísalas antes de continuar."
      />

      {/* Indicador de subpasos (navegación interna) */}
      <nav aria-label="Subpasos de sacas" className="flex flex-wrap items-center gap-2">
        {SUBPASOS.map((s, i) => {
          const activo = s.key === subPaso
          const Icon = s.icon
          return (
            <div key={s.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubPaso(s.key)}
                aria-current={activo ? 'step' : undefined}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  activo
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${activo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < SUBPASOS.length - 1 && <span className="text-muted-foreground/50">›</span>}
            </div>
          )
        })}
      </nav>

      {/* SUBPASO 1: CAPTURAR */}
      {subPaso === 'capturar' && (
        <div className="space-y-4">
          <PaqueteCapturePanel {...capture} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cola pendiente ({colaGlobal.length})
              </h4>
              {hayCola && (
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-error" onClick={onLimpiarCola}>
                  Limpiar cola
                </Button>
              )}
            </div>
            {colaGlobal.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                {haySacas ? 'No hay paquetes pendientes. Ya puedes distribuir o revisar tus sacas.' : 'Aún no hay paquetes. Escanea o pega guías arriba.'}
              </p>
            ) : (
              <div className="rounded-md border border-border bg-background divide-y divide-border/50 max-h-[420px] overflow-y-auto">
                {colaGlobal.map((p) => (
                  <PaqueteCompactListItem
                    key={`cola-${p.idPaquete}`}
                    paquete={p}
                    direccionFallback="Sin destino"
                    statusLabel="Pendiente de saca"
                    action={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => p.idPaquete != null && onEliminarDeColaGlobal(p.idPaquete)}
                        title="Quitar de la cola"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <StepNav
            onBack={onAnterior}
            backLabel="Anterior"
            onNext={() => setSubPaso('distribuir')}
            nextLabel="Continuar a distribuir"
            nextDisabled={!hayCola && !haySacas}
            nextDisabledTitle="Captura al menos una guía para continuar"
          />
        </div>
      )}

      {/* SUBPASO 2: DISTRIBUIR */}
      {subPaso === 'distribuir' && (
        <div className="space-y-4">
          <SacaDistributionPanel {...distribution} />
          <StepNav
            onBack={() => setSubPaso('capturar')}
            backLabel="Atrás"
            onNext={() => setSubPaso('revisar')}
            nextLabel="Revisar sacas"
          />
        </div>
      )}

      {/* SUBPASO 3: REVISAR */}
      {subPaso === 'revisar' && (
        <div className="space-y-4">
          {!haySacas ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm space-y-3">
              <p className="text-sm text-muted-foreground">Aún no has creado sacas. Distribuye los paquetes capturados para generarlas.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSubPaso('distribuir')}>
                Ir a distribuir
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sacas.map((saca, index) => (
                <SacaReviewCard
                  key={index}
                  saca={saca}
                  index={index}
                  sacas={sacas}
                  onTamanoChange={onTamanoChange}
                  onPresintoChange={onPresintoChange}
                  onGenerarPresinto={onGenerarPresinto}
                  onAgregarPaquetes={onAgregarPaquetes}
                  onPaqueteRapido={onPaqueteRapido}
                  onEliminarSaca={onEliminarSaca}
                  onMoverPaquete={onMoverPaqueteASaca}
                  onEliminarPaquete={onEliminarPaqueteDeSaca}
                />
              ))}
            </div>
          )}

          {hayCola && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-warning/20 bg-warning/10 px-3 py-2">
              <p role="alert" className="text-sm text-warning">
                Tienes {colaGlobal.length} paquete(s) sin distribuir en sacas.
              </p>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setSubPaso('capturar')}>
                Volver a la cola
              </Button>
            </div>
          )}

          <StepNav
            onBack={() => setSubPaso('distribuir')}
            backLabel="Atrás"
            onNext={onSiguiente}
            nextLabel="Continuar a destino"
            nextDisabled={hayCola || !sacasValidas}
            nextDisabledTitle={hayCola ? 'Distribuye los paquetes pendientes antes de continuar' : 'Cada saca debe tener al menos un paquete'}
          />
        </div>
      )}

    </div>
  )
}

interface StepNavProps {
  onBack: () => void
  backLabel: string
  onNext: () => void
  nextLabel: string
  nextDisabled?: boolean
  nextDisabledTitle?: string
}

/** Navegación inferior consistente para cada subpaso (una sola acción primaria). */
function StepNav({ onBack, backLabel, onNext, nextLabel, nextDisabled, nextDisabledTitle }: StepNavProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
      </Button>
      <Button
        type="button"
        onClick={onNext}
        className="sm:ml-auto"
        disabled={nextDisabled}
        title={nextDisabled ? nextDisabledTitle : undefined}
      >
        {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
