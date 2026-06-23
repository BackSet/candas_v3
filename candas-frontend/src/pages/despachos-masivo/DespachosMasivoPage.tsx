import { ModulePageIcon } from '@/components/icons'
import {
  DespachoBatchBuilder,
  type CrearDespachoMeta,
} from '@/components/despacho-masivo/DespachoBatchBuilder'
import { DespachoBatchQueue } from '@/components/despacho-masivo/DespachoBatchQueue'
import { DespachoBatchReview } from '@/components/despacho-masivo/DespachoBatchReview'
import { GuiaBatchCapturePanel } from '@/components/despacho-masivo/GuiaBatchCapturePanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComboboxOption } from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogContentPresets,
} from '@/components/ui/dialog'
import { useAgencias } from '@/hooks/useAgencias'
import { useDespachoBuilder } from '@/hooks/useDespachoBuilder'
import {
  useDespachoMasivoSession,
  useUpdateDespachoMasivoSession,
} from '@/hooks/useDespachoMasivoSession'
import { useDestinatariosDirectosAll } from '@/hooks/useDestinatariosDirectos'
import { useDistribuidores } from '@/hooks/useDistribuidores'
import { getApiErrorMessage } from '@/lib/api/errors'
import { paqueteService } from '@/lib/api/paquete.service'
import { notify } from '@/lib/notify'
import { toDateTimeLocalString } from '@/schemas/despacho'
import { useAuthStore } from '@/stores/authStore'
import type {
  DespachoMasivoColaEstado,
  DespachoMasivoColaItem,
  DespachoMasivoDespachoLote,
  DespachoMasivoEstado,
  DespachoMasivoSessionPayload,
} from '@/types/despacho-masivo-session'
import { EstadoPaquete, type Paquete } from '@/types/paquete'
import { paqueteToSessionItem, sessionItemToPaquete } from '@/utils/despachoMasivoPaquete'
import type { ConstruirDespachoPayloadInput } from '@/utils/despachoPayload'
import { AlertTriangle, Loader2, PackageSearch, Truck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Genera un id temporal de cliente para un despacho del lote. */
function genId(): string {
  return 'd-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const ESTADOS_COLA_VALIDOS: ReadonlySet<DespachoMasivoColaEstado> = new Set([
  'pendiente',
  'resuelto',
  'no_encontrado',
  'no_disponible',
  'asignado',
])
const ESTADOS_LOTE_VALIDOS: ReadonlySet<DespachoMasivoEstado> = new Set([
  'en_edicion',
  'creando',
  'creado',
  'error',
])

/**
 * Normaliza la cola persistida en sesión: descarta entradas corruptas o de un
 * esquema antiguo (sin guía o con estado desconocido) y deduplica por guía.
 * Las guías que quedaron como `pendiente` (resolución interrumpida) se reabren.
 */
function normalizarCola(raw: unknown): DespachoMasivoColaItem[] {
  if (!Array.isArray(raw)) return []
  const vistas = new Set<string>()
  const out: DespachoMasivoColaItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const numeroGuia = (item as DespachoMasivoColaItem).numeroGuia
    const estado = (item as DespachoMasivoColaItem).estado
    if (typeof numeroGuia !== 'string' || numeroGuia.trim() === '') continue
    if (vistas.has(numeroGuia)) continue
    vistas.add(numeroGuia)
    const estadoValido = ESTADOS_COLA_VALIDOS.has(estado) ? estado : 'pendiente'
    out.push({ ...(item as DespachoMasivoColaItem), numeroGuia, estado: estadoValido })
  }
  return out
}

/** Normaliza la lista del lote persistida: descarta entradas sin id o estado inválido. */
function normalizarLote(raw: unknown): DespachoMasivoDespachoLote[] {
  if (!Array.isArray(raw)) return []
  const vistos = new Set<string>()
  const out: DespachoMasivoDespachoLote[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = (item as DespachoMasivoDespachoLote).id
    const estado = (item as DespachoMasivoDespachoLote).estado
    if (typeof id !== 'string' || id.trim() === '') continue
    if (!ESTADOS_LOTE_VALIDOS.has(estado)) continue
    if (vistos.has(id)) continue
    vistos.add(id)
    out.push(item as DespachoMasivoDespachoLote)
  }
  return out
}

function calcularResumen(cola: DespachoMasivoColaItem[], lote: DespachoMasivoDespachoLote[]) {
  return {
    totalGuiasCola: cola.length,
    totalGuiasResueltas: cola.filter((c) => c.estado === 'resuelto' || c.estado === 'asignado').length,
    totalDespachos: lote.length,
    despachosCreados: lote.filter((d) => d.estado === 'creado').length,
    despachosConError: lote.filter((d) => d.estado === 'error').length,
  }
}

function DespachosMasivoPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useDespachoMasivoSession({ refetchInterval: false })
  const updateSession = useUpdateDespachoMasivoSession()
  const builder = useDespachoBuilder()

  const fechaDespacho = useMemo(() => toDateTimeLocalString(new Date()), [])
  const usuarioRegistro = user?.nombreCompleto || user?.username || ''

  const [colaItems, setColaItems] = useState<DespachoMasivoColaItem[]>([])
  const [despachosLote, setDespachosLote] = useState<DespachoMasivoDespachoLote[]>([])
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [resolviendoCount, setResolviendoCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [confirmFinalizarOpen, setConfirmFinalizarOpen] = useState(false)

  // Refs para acceder al estado más reciente sin recrear callbacks.
  const colaRef = useRef(colaItems)
  colaRef.current = colaItems
  const loteRef = useRef(despachosLote)
  loteRef.current = despachosLote
  const payloadRef = useRef<DespachoMasivoSessionPayload | null>(null)
  payloadRef.current = data?.payload ?? payloadRef.current
  const mutateRef = useRef(updateSession.mutate)
  mutateRef.current = updateSession.mutate
  const hydratedRef = useRef(false)

  // Hidratar una sola vez desde la sesión backend (sobrevive recarga), normalizando
  // cualquier payload corrupto o de un esquema anterior.
  useEffect(() => {
    if (hydratedRef.current || isLoading) return
    hydratedRef.current = true
    const payload = data?.payload
    setColaItems(normalizarCola(payload?.paquetesCola))
    setDespachosLote(normalizarLote(payload?.despachosLote))
  }, [isLoading, data])

  // Construye el payload de sesión normalizado a partir del estado actual.
  const construirPayloadSesion = useCallback(
    (cola: DespachoMasivoColaItem[], lote: DespachoMasivoDespachoLote[]): DespachoMasivoSessionPayload => ({
      ...(payloadRef.current ?? {}),
      colaGlobalGuias: cola.map((c) => c.numeroGuia),
      paquetesCola: cola,
      despachosLote: lote,
      resumen: calcularResumen(cola, lote),
    }),
    []
  )

  // Persistir cambios en la sesión (debounced) tras la hidratación.
  useEffect(() => {
    if (!hydratedRef.current) return
    const t = setTimeout(() => {
      mutateRef.current(construirPayloadSesion(colaItems, despachosLote))
    }, 500)
    return () => clearTimeout(t)
  }, [colaItems, despachosLote, construirPayloadSesion])

  // Persistir inmediatamente al desmontar para no perder el último cambio.
  const flushRef = useRef<DespachoMasivoSessionPayload | null>(null)
  flushRef.current = hydratedRef.current
    ? construirPayloadSesion(colaItems, despachosLote)
    : null
  useEffect(() => {
    return () => {
      if (flushRef.current) mutateRef.current(flushRef.current)
    }
  }, [])

  /** Guías ya consumidas por un despacho creado en este lote (no reutilizables). */
  const guiasUsadasEnLote = useCallback(
    () => new Set(loteRef.current.flatMap((d) => d.numerosGuia ?? [])),
    []
  )

  // --- Cola global ---
  const agregarGuias = useCallback(
    async (raw: string[]) => {
      const unique = Array.from(new Set(raw.map((g) => g.trim().toUpperCase()).filter(Boolean)))
      const existentes = new Set(colaRef.current.map((c) => c.numeroGuia))
      const aResolver = unique.filter((g) => !existentes.has(g))
      const duplicadas = unique.length - aResolver.length
      if (duplicadas > 0) notify.info(`${duplicadas} guía(s) ya estaban en la cola`)
      if (aResolver.length === 0) return

      const usadas = guiasUsadasEnLote()

      setColaItems((prev) => [
        ...prev,
        ...aResolver.map((g) => ({ numeroGuia: g, estado: 'pendiente' as const })),
      ])
      setResolviendoCount((c) => c + aResolver.length)

    for (const guia of aResolver) {
      // Una guía ya usada en un despacho creado no puede volver a la cola disponible.
      if (usadas.has(guia)) {
        setColaItems((prev) =>
          prev.map((it) =>
            it.numeroGuia === guia
              ? { ...it, estado: 'asignado', mensaje: 'Ya usada en un despacho del lote' }
              : it
          )
        )
        setResolviendoCount((c) => c - 1)
        continue
      }
      try {
        const p = await paqueteService.findByNumeroGuia(guia)
        const bloqueado = p.estado === EstadoPaquete.DESPACHADO || p.idDespacho != null
        setColaItems((prev) =>
          prev.map((it) =>
            it.numeroGuia === guia
              ? {
                  ...it,
                  idPaquete: p.idPaquete,
                  estado: bloqueado ? 'no_disponible' : 'resuelto',
                  paquete: paqueteToSessionItem(p),
                  mensaje: bloqueado ? 'Paquete ya despachado' : undefined,
                }
              : it
          )
        )
      } catch {
        setColaItems((prev) =>
          prev.map((it) =>
            it.numeroGuia === guia
              ? { ...it, estado: 'no_encontrado', mensaje: 'Guía no encontrada' }
              : it
          )
        )
      } finally {
        setResolviendoCount((c) => c - 1)
      }
    }
    },
    [guiasUsadasEnLote]
  )

  const toggleSeleccion = useCallback((numeroGuia: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(numeroGuia)) next.delete(numeroGuia)
      else next.add(numeroGuia)
      return next
    })
  }, [])

  const removerGuia = useCallback((numeroGuia: string) => {
    setColaItems((prev) => prev.filter((it) => it.numeroGuia !== numeroGuia))
    setSeleccion((prev) => {
      if (!prev.has(numeroGuia)) return prev
      const next = new Set(prev)
      next.delete(numeroGuia)
      return next
    })
  }, [])

  const limpiarCola = useCallback(() => {
    setColaItems([])
    setSeleccion(new Set())
  }, [])

  const finalizarLote = useCallback(() => {
    setColaItems([])
    setDespachosLote([])
    setSeleccion(new Set())
    setErrorMsg(null)
    setConfirmFinalizarOpen(false)
    notify.success('Lote finalizado. La sesión quedó vacía.')
  }, [])

  // --- Crear despacho individual inmediato ---
  // Paquetes seleccionados mapeados a `Paquete` para reutilizar helpers de
  // distribución y presentación en el builder.
  const paquetesSeleccionados = useMemo<Paquete[]>(
    () =>
      colaItems
        .filter((it) => it.estado === 'resuelto' && it.idPaquete != null && seleccion.has(it.numeroGuia))
        .map((it) =>
          sessionItemToPaquete({
            ...(it.paquete ?? {}),
            idPaquete: it.paquete?.idPaquete ?? it.idPaquete,
            numeroGuia: it.paquete?.numeroGuia ?? it.numeroGuia,
          })
        ),
    [colaItems, seleccion]
  )

  const handleCrearDespacho = useCallback(
    async (input: ConstruirDespachoPayloadInput, meta: CrearDespachoMeta) => {
      setErrorMsg(null)
      const loteId = genId()
      const guiasUsadas = new Set(meta.numerosGuia)
      try {
        const creado = await builder.crearDespacho(input)
        setColaItems((prev) =>
          prev.map((it) =>
            guiasUsadas.has(it.numeroGuia)
              ? { ...it, estado: 'asignado', despachoLoteId: loteId }
              : it
          )
        )
        setDespachosLote((prev) => [
          {
            id: loteId,
            estado: 'creado',
            idDespacho: creado.idDespacho,
            numeroManifiesto: creado.numeroManifiesto,
            destinoResumen: meta.destinoResumen,
            tipoEnvio: meta.tipoEnvio,
            idDistribuidor: meta.idDistribuidor,
            nombreDistribuidor: meta.nombreDistribuidor,
            numeroGuiaTransporte: meta.numeroGuiaTransporte,
            observaciones: meta.observaciones,
            totalSacas: meta.totalSacas,
            totalPaquetes: meta.totalPaquetes,
            numerosGuia: meta.numerosGuia,
            sacasDetalle: meta.sacasDetalle,
            resumenCopiable: meta.resumenCopiable,
            creadoEn: new Date().toISOString(),
          },
          ...prev,
        ])
        setSeleccion(new Set())
        notify.success(`Despacho creado: ${creado.numeroManifiesto ?? creado.idDespacho ?? ''}`)
      } catch (e) {
        setErrorMsg(getApiErrorMessage(e, 'No se pudo crear el despacho'))
      }
    },
    [builder]
  )

  // --- Datos de referencia para destino ---
  const { data: agenciasData } = useAgencias({ page: 0, size: 100 })
  const { data: destinatariosData } = useDestinatariosDirectosAll()
  const { data: distribuidoresData } = useDistribuidores({ page: 0, size: 100 })

  const agenciaOptions: ComboboxOption<number>[] = useMemo(
    () =>
      (agenciasData?.content ?? [])
        .filter((a) => a.activa && a.idAgencia != null)
        .map((a) => ({
          value: a.idAgencia as number,
          label: a.canton ? `${a.nombre} — ${a.canton}` : a.nombre,
        })),
    [agenciasData]
  )
  const destinatarioOptions: ComboboxOption<number>[] = useMemo(
    () =>
      (destinatariosData ?? [])
        .filter((d) => d.activo !== false && d.idDestinatarioDirecto != null)
        .map((d) => ({ value: d.idDestinatarioDirecto as number, label: d.nombreDestinatario })),
    [destinatariosData]
  )
  const distribuidorOptions: ComboboxOption<number>[] = useMemo(
    () =>
      (distribuidoresData?.content ?? [])
        .filter((d) => d.activa && d.idDistribuidor != null)
        .map((d) => ({ value: d.idDistribuidor as number, label: d.nombre })),
    [distribuidoresData]
  )

  const resumen = useMemo(() => calcularResumen(colaItems, despachosLote), [colaItems, despachosLote])
  const guiasUsadas = colaItems.filter((c) => c.estado === 'asignado').length
  const guiasDisponibles = colaItems.filter((c) => c.estado === 'resuelto').length
  const loteVacio = colaItems.length === 0 && despachosLote.length === 0

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Cabecera */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ModulePageIcon module="despachosMasivo" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Despacho masivo</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Carga todas las guías en una cola global y crea varios despachos del lote, uno a la
              vez. Cada despacho se guarda de inmediato; las guías usadas quedan bloqueadas.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setConfirmFinalizarOpen(true)}
          disabled={loteVacio}
          className="shrink-0"
        >
          Finalizar lote
        </Button>
      </header>

      {/* Progreso del lote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Progreso del lote</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando sesión…
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <ResumenItem label="En cola" value={resumen.totalGuiasCola} />
              <ResumenItem label="Disponibles" value={guiasDisponibles} />
              <ResumenItem label="Usadas" value={guiasUsadas} />
              <ResumenItem label="Seleccionadas" value={seleccion.size} />
              <ResumenItem label="Despachos creados" value={resumen.despachosCreados} />
              {resumen.despachosConError > 0 ? (
                <ResumenItem label="Con error" value={resumen.despachosConError} />
              ) : (
                <ResumenItem label="Despachos" value={resumen.totalDespachos} />
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Columna izquierda: captura + cola */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageSearch className="size-5 text-muted-foreground" /> Cola global de guías
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <GuiaBatchCapturePanel onAgregarGuias={agregarGuias} resolviendo={resolviendoCount > 0} />
              <DespachoBatchQueue
                items={colaItems}
                seleccion={seleccion}
                onToggleSeleccion={toggleSeleccion}
                onRemoverGuia={removerGuia}
                onLimpiarCola={limpiarCola}
              />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: builder + lote */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-5 text-muted-foreground" /> Despacho en construcción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DespachoBatchBuilder
                paquetesSeleccionados={paquetesSeleccionados}
                fechaDespacho={fechaDespacho}
                usuarioRegistro={usuarioRegistro}
                agencias={agenciaOptions}
                destinatarios={destinatarioOptions}
                distribuidores={distribuidorOptions}
                creando={builder.isCreating}
                errorMsg={errorMsg}
                onCrearDespacho={handleCrearDespacho}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despachos del lote</CardTitle>
            </CardHeader>
            <CardContent>
              <DespachoBatchReview despachos={despachosLote} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmación de finalizar / limpiar sesión */}
      <Dialog open={confirmFinalizarOpen} onOpenChange={setConfirmFinalizarOpen}>
        <DialogContent className={dialogContentPresets.compact}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning-content" />
              Finalizar lote
            </DialogTitle>
            <DialogDescription>
              Se vaciará la cola global y la lista del lote de esta sesión. Los despachos ya creados
              <strong> no se eliminan</strong>: siguen disponibles en{' '}
              <span className="font-medium">Despachos</span>. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinalizarOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={finalizarLote}>
              Finalizar lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResumenItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export default DespachosMasivoPage
