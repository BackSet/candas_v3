import { DespachoMasivoCopyActions } from '@/components/despacho-masivo/DespachoMasivoCopyActions'
import {
  SacaBatchDistributionPanel,
  type DistribMode,
} from '@/components/despacho-masivo/SacaBatchDistributionPanel'
import { SacaBatchReviewCard } from '@/components/despacho-masivo/SacaBatchReviewCard'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SemanticNotice } from '@/components/ui/semantic-notice'
import { Textarea } from '@/components/ui/textarea'
import type { SacaFormData } from '@/hooks/useSacasManager'
import type { DespachoMasivoSacaDetalle } from '@/types/despacho-masivo-session'
import type { Paquete } from '@/types/paquete'
import {
  construirResumenDespachoMasivo,
  construirDestinoTexto,
  construirListaGuias,
  type ResumenDespachoMasivoInput,
} from '@/utils/despachoMasivoCopy'
import type {
  ConstruirDespachoPayloadInput,
  DespachoTipoEnvio,
} from '@/utils/despachoPayload'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import {
  parsearPatron,
  repartirEnNSacas,
  repartirPorPatron,
  repartirTodoEnUnaSaca,
} from '@/utils/sacaDistribution'
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Loader2, MapPin, PackageCheck, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export interface CrearDespachoMeta {
  destinoResumen: string
  tipoEnvio: DespachoTipoEnvio
  idDistribuidor?: number
  nombreDistribuidor?: string
  numeroGuiaTransporte?: string
  observaciones?: string
  numerosGuia: string[]
  totalSacas: number
  totalPaquetes: number
  sacasDetalle: DespachoMasivoSacaDetalle[]
  resumenCopiable: string
}

export interface DespachoBatchBuilderProps {
  /** Paquetes seleccionados de la cola (ya mapeados a `Paquete` para reusar helpers). */
  paquetesSeleccionados: Paquete[]
  fechaDespacho: string
  usuarioRegistro: string
  agencias: ComboboxOption<number>[]
  destinatarios: ComboboxOption<number>[]
  distribuidores: ComboboxOption<number>[]
  creando: boolean
  errorMsg?: string | null
  onCrearDespacho: (input: ConstruirDespachoPayloadInput, meta: CrearDespachoMeta) => void
}

type BuilderStage = 'sacas' | 'destino' | 'revisar'

function guiaDe(p: Paquete): string {
  return guiaEfectiva(p) || p.numeroGuia || (p.idPaquete != null ? `#${p.idPaquete}` : '')
}

/**
 * Builder del despacho en construcción del lote masivo: distribuye los paquetes
 * seleccionados en sacas (una saca / N sacas / patrón), define destino y
 * confirma la creación inmediata reutilizando la lógica de `/despachos/new`.
 */
export function DespachoBatchBuilder({
  paquetesSeleccionados,
  fechaDespacho,
  usuarioRegistro,
  agencias,
  destinatarios,
  distribuidores,
  creando,
  errorMsg,
  onCrearDespacho,
}: DespachoBatchBuilderProps) {
  const [stage, setStage] = useState<BuilderStage>('sacas')
  const [modo, setModo] = useState<DistribMode>('una')
  const [numSacas, setNumSacas] = useState(1)
  const [patronTexto, setPatronTexto] = useState('')
  const [tamanos, setTamanos] = useState<Record<number, SacaFormData['tamano']>>({})
  const [presintos, setPresintos] = useState<Record<number, string>>({})
  const [tipoEnvio, setTipoEnvio] = useState<DespachoTipoEnvio>('agencia')
  const [idAgencia, setIdAgencia] = useState<number | null>(null)
  const [idDestinatarioDirecto, setIdDestinatarioDirecto] = useState<number | null>(null)
  const [idDistribuidor, setIdDistribuidor] = useState<number | null>(null)
  const [numeroGuiaTransporte, setNumeroGuiaTransporte] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const totalPaquetes = paquetesSeleccionados.length

  /** Limpia overrides de tamaño/presinto cuando cambia la estructura de sacas. */
  const resetOverrides = () => {
    setTamanos({})
    setPresintos({})
  }

  // Si cambia la selección, vuelve al primer paso y limpia overrides.
  useEffect(() => {
    setStage('sacas')
    setTamanos({})
    setPresintos({})
  }, [totalPaquetes])

  const patron = useMemo(() => parsearPatron(patronTexto), [patronTexto])

  const { sacasBase, sobrantes, faltantes } = useMemo(() => {
    if (totalPaquetes === 0) return { sacasBase: [] as SacaFormData[], sobrantes: 0, faltantes: 0 }
    if (modo === 'una') {
      return { sacasBase: repartirTodoEnUnaSaca(paquetesSeleccionados), sobrantes: 0, faltantes: 0 }
    }
    if (modo === 'n') {
      const n = Math.min(Math.max(1, numSacas), totalPaquetes)
      return { sacasBase: repartirEnNSacas(paquetesSeleccionados, n), sobrantes: 0, faltantes: 0 }
    }
    // patrón
    if (patron.error || patron.grupos.length === 0) {
      return { sacasBase: [] as SacaFormData[], sobrantes: 0, faltantes: 0 }
    }
    const d = repartirPorPatron(paquetesSeleccionados, patron.grupos)
    return { sacasBase: d.sacas, sobrantes: d.sobrantes, faltantes: d.faltantes }
  }, [modo, numSacas, patron, paquetesSeleccionados, totalPaquetes])

  const sacas: SacaFormData[] = useMemo(
    () =>
      sacasBase.map((s, i) => ({
        tamano: tamanos[i] ?? s.tamano,
        idPaquetes: s.idPaquetes,
        codigoPresinto: presintos[i] ?? '',
      })),
    [sacasBase, tamanos, presintos]
  )

  const paqueteById = useMemo(() => {
    const m = new Map<number, Paquete>()
    paquetesSeleccionados.forEach((p) => {
      if (p.idPaquete != null) m.set(p.idPaquete, p)
    })
    return m
  }, [paquetesSeleccionados])

  const sacasPaquetes = useMemo(
    () =>
      sacas.map(
        (s) => s.idPaquetes.map((id) => paqueteById.get(id)).filter((p): p is Paquete => p != null)
      ),
    [sacas, paqueteById]
  )

  const sacasDetalle: DespachoMasivoSacaDetalle[] = useMemo(
    () =>
      sacas.map((s, i) => {
        const pks = sacasPaquetes[i] ?? []
        const peso = pks.reduce((acc, p) => acc + (p.pesoKilos ?? 0), 0)
        return {
          numero: i + 1,
          tamano: s.tamano,
          codigoPresinto: s.codigoPresinto?.trim() || undefined,
          totalPaquetes: s.idPaquetes.length,
          pesoEstimado: peso > 0 ? peso : undefined,
          numerosGuia: pks.map(guiaDe).filter(Boolean),
        }
      }),
    [sacas, sacasPaquetes]
  )

  const conteoPorSaca = sacas.map((s) => s.idPaquetes.length)
  const sacasValidas = sacas.length > 0

  const destinoCompleto =
    tipoEnvio === 'agencia' ? idAgencia != null : idDestinatarioDirecto != null

  const destinoResumen = useMemo(() => {
    if (tipoEnvio === 'agencia') {
      return agencias.find((a) => a.value === idAgencia)?.label ?? 'Agencia'
    }
    return destinatarios.find((d) => d.value === idDestinatarioDirecto)?.label ?? 'Destinatario directo'
  }, [tipoEnvio, idAgencia, idDestinatarioDirecto, agencias, destinatarios])

  const nombreDistribuidor = distribuidores.find((d) => d.value === idDistribuidor)?.label
  const numerosGuia = useMemo(() => paquetesSeleccionados.map(guiaDe).filter(Boolean), [paquetesSeleccionados])

  const resumenInput: ResumenDespachoMasivoInput = {
    destinoResumen,
    tipoEnvio,
    nombreDistribuidor,
    numeroGuiaTransporte: numeroGuiaTransporte.trim() || undefined,
    observaciones: observaciones.trim() || undefined,
    totalSacas: sacas.length,
    totalPaquetes,
    numerosGuia,
    sacasDetalle,
  }
  const resumenCopiable = construirResumenDespachoMasivo(resumenInput)

  const handleModoChange = (m: DistribMode) => {
    setModo(m)
    resetOverrides()
  }
  const handleNumSacasChange = (n: number) => {
    setNumSacas(Number.isNaN(n) ? 1 : Math.min(Math.max(1, n), Math.max(1, totalPaquetes)))
    resetOverrides()
  }
  const handlePatronChange = (t: string) => {
    setPatronTexto(t)
    resetOverrides()
  }

  const handleCrear = () => {
    const input: ConstruirDespachoPayloadInput = {
      fechaDespacho,
      usuarioRegistro,
      observaciones: observaciones.trim() || undefined,
      destino: {
        tipoEnvio,
        idAgencia: tipoEnvio === 'agencia' ? (idAgencia ?? undefined) : undefined,
        destinatarioOrigen: tipoEnvio === 'directo' ? 'existente' : undefined,
        idDestinatarioDirecto: tipoEnvio === 'directo' ? (idDestinatarioDirecto ?? undefined) : undefined,
      },
      idDistribuidor: idDistribuidor ?? undefined,
      numeroGuiaAgenciaDistribucion: numeroGuiaTransporte.trim() || undefined,
      sacas,
    }
    onCrearDespacho(input, {
      destinoResumen,
      tipoEnvio,
      idDistribuidor: idDistribuidor ?? undefined,
      nombreDistribuidor,
      numeroGuiaTransporte: numeroGuiaTransporte.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
      numerosGuia,
      totalSacas: sacas.length,
      totalPaquetes,
      sacasDetalle,
      resumenCopiable,
    })
  }

  if (totalPaquetes === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 py-10 text-center">
        <PackageCheck className="size-6 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Selecciona guías disponibles en la cola para armar un despacho.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Indicador de paso */}
      <nav aria-label="Pasos del despacho" className="flex flex-wrap items-center gap-2 text-xs">
        {(['sacas', 'destino', 'revisar'] as BuilderStage[]).map((s, i) => {
          const activo = s === stage
          const labels: Record<BuilderStage, string> = {
            sacas: 'Sacas',
            destino: 'Destino',
            revisar: 'Revisar',
          }
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                aria-current={activo ? 'step' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
                  activo
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                  {i + 1}
                </span>
                {labels[s]}
              </span>
              {i < 2 && <span className="text-muted-foreground/50">›</span>}
            </div>
          )
        })}
      </nav>

      {/* PASO 1: SACAS */}
      {stage === 'sacas' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalPaquetes}</span> paquete(s)
            seleccionado(s). Elige cómo distribuirlos en sacas.
          </p>

          <SacaBatchDistributionPanel
            totalPaquetes={totalPaquetes}
            modo={modo}
            onModoChange={handleModoChange}
            numSacas={numSacas}
            onNumSacasChange={handleNumSacasChange}
            patronTexto={patronTexto}
            onPatronChange={handlePatronChange}
            patronError={modo === 'patron' ? patron.error : null}
            conteoPorSaca={conteoPorSaca}
            sobrantes={sobrantes}
            faltantes={faltantes}
          />

          <div className="space-y-3">
            {sacasPaquetes.map((paquetes, i) => (
              <SacaBatchReviewCard
                key={i}
                numero={i + 1}
                paquetes={paquetes}
                tamano={sacas[i].tamano}
                onTamanoChange={(t) => setTamanos((prev) => ({ ...prev, [i]: t }))}
                presinto={presintos[i] ?? ''}
                onPresintoChange={(v) => setPresintos((prev) => ({ ...prev, [i]: v }))}
                pesoEstimado={(sacasDetalle[i]?.pesoEstimado) ?? 0}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setStage('destino')}
              disabled={!sacasValidas}
              title={!sacasValidas ? 'Define una distribución de sacas válida' : undefined}
            >
              Continuar a destino <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2: DESTINO */}
      {stage === 'destino' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipoEnvio === 'agencia' ? 'default' : 'outline'}
              onClick={() => setTipoEnvio('agencia')}
              className="flex-1"
            >
              <Building2 className="size-4" /> Agencia
            </Button>
            <Button
              type="button"
              variant={tipoEnvio === 'directo' ? 'default' : 'outline'}
              onClick={() => setTipoEnvio('directo')}
              className="flex-1"
            >
              <MapPin className="size-4" /> Directo
            </Button>
          </div>

          {tipoEnvio === 'agencia' ? (
            <div className="space-y-1.5">
              <Label>Agencia destino</Label>
              <Combobox
                options={agencias}
                value={idAgencia}
                onValueChange={(v) => setIdAgencia(v as number | null)}
                placeholder="Selecciona una agencia"
                emptyMessage="Sin agencias"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Destinatario directo</Label>
              <Combobox
                options={destinatarios}
                value={idDestinatarioDirecto}
                onValueChange={(v) => setIdDestinatarioDirecto(v as number | null)}
                placeholder="Selecciona un destinatario"
                emptyMessage="Sin destinatarios"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Distribuidor (opcional)</Label>
              <Combobox
                options={distribuidores}
                value={idDistribuidor}
                onValueChange={(v) => setIdDistribuidor(v as number | null)}
                placeholder="Sin distribuidor"
                emptyMessage="Sin distribuidores"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="masivo-guia-transporte">Guía de transporte (opcional)</Label>
              <Input
                id="masivo-guia-transporte"
                value={numeroGuiaTransporte}
                onChange={(e) => setNumeroGuiaTransporte(e.target.value)}
                placeholder="Nº guía de la agencia de distribución"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="masivo-observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="masivo-observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStage('sacas')}>
              <ArrowLeft className="mr-1 size-4" /> Atrás
            </Button>
            <Button type="button" onClick={() => setStage('revisar')} disabled={!destinoCompleto}>
              Revisar <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3: REVISAR + CONFIRMAR */}
      {stage === 'revisar' && (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Sacas</dt>
              <dd className="font-semibold">{sacas.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paquetes</dt>
              <dd className="font-semibold">{totalPaquetes}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Destino</dt>
              <dd className="truncate font-medium">{destinoResumen}</dd>
            </div>
            {nombreDistribuidor && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Distribuidor</dt>
                <dd className="truncate font-medium">{nombreDistribuidor}</dd>
              </div>
            )}
            {numeroGuiaTransporte.trim() && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Guía de transporte</dt>
                <dd className="truncate font-medium">{numeroGuiaTransporte.trim()}</dd>
              </div>
            )}
          </dl>

          {/* Resumen copiable */}
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {resumenCopiable}
            </pre>
          </div>

          <DespachoMasivoCopyActions
            resumenText={resumenCopiable}
            guiasText={construirListaGuias(numerosGuia)}
            destinoText={construirDestinoTexto(resumenInput)}
          />

          {errorMsg && (
            <SemanticNotice variant="error" icon={AlertTriangle} title="No se pudo crear el despacho">
              {errorMsg} Puedes reintentar sin perder la selección.
            </SemanticNotice>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStage('destino')} disabled={creando}>
              <ArrowLeft className="mr-1 size-4" /> Atrás
            </Button>
            <Button type="button" onClick={handleCrear} disabled={creando}>
              {creando ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
              {errorMsg ? 'Reintentar creación' : 'Crear despacho'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
