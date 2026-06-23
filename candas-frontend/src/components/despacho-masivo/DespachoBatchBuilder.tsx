import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SemanticNotice } from '@/components/ui/semantic-notice'
import { Textarea } from '@/components/ui/textarea'
import type { SacaFormData } from '@/hooks/useSacasManager'
import { TamanoSaca } from '@/types/saca'
import { formatearTamanoSaca } from '@/utils/ensacado'
import { calcularTamanoSugerido } from '@/utils/saca'
import type {
  ConstruirDespachoPayloadInput,
  DespachoTipoEnvio,
} from '@/utils/despachoPayload'
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Loader2, MapPin, PackageCheck, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

/** Paquete seleccionado de la cola para el despacho en construcción. */
export interface PaqueteSeleccionadoItem {
  idPaquete: number
  numeroGuia: string
  nombreClienteDestinatario?: string
  cantonDestinatario?: string
  pesoKilos?: number
}

export interface CrearDespachoMeta {
  destinoResumen: string
  numerosGuia: string[]
  totalSacas: number
  totalPaquetes: number
}

export interface DespachoBatchBuilderProps {
  paquetesSeleccionados: PaqueteSeleccionadoItem[]
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

const TAMANOS: TamanoSaca[] = [
  TamanoSaca.INDIVIDUAL,
  TamanoSaca.PEQUENO,
  TamanoSaca.MEDIANO,
  TamanoSaca.GRANDE,
]

/** Reparte una lista en `n` grupos lo más equilibrados posible, en orden. */
function repartirEnGrupos<T>(items: T[], n: number): T[][] {
  if (n <= 1) return [items]
  const grupos: T[][] = Array.from({ length: n }, () => [])
  items.forEach((item, i) => {
    grupos[i % n].push(item)
  })
  return grupos.filter((g) => g.length > 0)
}

/**
 * Builder del despacho en construcción del lote masivo: distribuye los paquetes
 * seleccionados en sacas, define destino/distribuidor/observaciones y confirma
 * la creación inmediata reutilizando la lógica de `/despachos/new`.
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
  const [numSacas, setNumSacas] = useState(1)
  const [tamanos, setTamanos] = useState<Record<number, TamanoSaca>>({})
  const [presintos, setPresintos] = useState<Record<number, string>>({})
  const [tipoEnvio, setTipoEnvio] = useState<DespachoTipoEnvio>('agencia')
  const [idAgencia, setIdAgencia] = useState<number | null>(null)
  const [idDestinatarioDirecto, setIdDestinatarioDirecto] = useState<number | null>(null)
  const [idDistribuidor, setIdDistribuidor] = useState<number | null>(null)
  const [numeroGuiaTransporte, setNumeroGuiaTransporte] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const totalPaquetes = paquetesSeleccionados.length

  // Si cambia la selección, vuelve al primer paso y ajusta el nº de sacas.
  useEffect(() => {
    setStage('sacas')
    setNumSacas((n) => Math.min(Math.max(1, n), Math.max(1, totalPaquetes)))
  }, [totalPaquetes])

  const grupos = useMemo(
    () => repartirEnGrupos(paquetesSeleccionados, Math.min(numSacas, Math.max(1, totalPaquetes))),
    [paquetesSeleccionados, numSacas, totalPaquetes]
  )

  const sacas: SacaFormData[] = useMemo(
    () =>
      grupos.map((grupo, i) => ({
        tamano: tamanos[i] ?? calcularTamanoSugerido(grupo, grupo.length),
        idPaquetes: grupo.map((p) => p.idPaquete),
        codigoPresinto: presintos[i] ?? '',
      })),
    [grupos, tamanos, presintos]
  )

  const destinoCompleto =
    tipoEnvio === 'agencia' ? idAgencia != null : idDestinatarioDirecto != null

  const destinoResumen = useMemo(() => {
    if (tipoEnvio === 'agencia') {
      return agencias.find((a) => a.value === idAgencia)?.label ?? 'Agencia'
    }
    return destinatarios.find((d) => d.value === idDestinatarioDirecto)?.label ?? 'Destinatario directo'
  }, [tipoEnvio, idAgencia, idDestinatarioDirecto, agencias, destinatarios])

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
      numerosGuia: paquetesSeleccionados.map((p) => p.numeroGuia),
      totalSacas: sacas.length,
      totalPaquetes,
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
            seleccionado(s). Distribúyelos en sacas.
          </p>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="masivo-num-sacas">Número de sacas</Label>
              <Input
                id="masivo-num-sacas"
                type="number"
                min={1}
                max={totalPaquetes}
                value={numSacas}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  setNumSacas(Number.isNaN(v) ? 1 : Math.min(Math.max(1, v), totalPaquetes))
                  setTamanos({})
                }}
                className="w-28"
              />
            </div>
          </div>

          <ul className="space-y-3">
            {sacas.map((saca, i) => (
              <li key={i} className="rounded-md border border-border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <span className="text-sm font-medium">Saca {i + 1}</span>
                    <p className="text-xs text-muted-foreground">
                      {saca.idPaquetes.length} paquete(s)
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`masivo-tamano-${i}`}>Tamaño</Label>
                    <Select
                      value={saca.tamano}
                      onValueChange={(v) => setTamanos((prev) => ({ ...prev, [i]: v as TamanoSaca }))}
                    >
                      <SelectTrigger id={`masivo-tamano-${i}`} className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAMANOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {formatearTamanoSaca(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`masivo-presinto-${i}`}>Presinto (opcional)</Label>
                    <Input
                      id={`masivo-presinto-${i}`}
                      value={presintos[i] ?? ''}
                      onChange={(e) => setPresintos((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="Lo genera el sistema"
                      className="w-44"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            <Button type="button" onClick={() => setStage('destino')}>
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
          </dl>

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
