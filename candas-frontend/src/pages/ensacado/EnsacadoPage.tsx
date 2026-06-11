import { EnsacadoLayoutHeader } from '@/components/ensacado/EnsacadoLayoutHeader'
import { SacaGuiasPanel } from '@/components/ensacado/SacaGuiasPanel'
import { SyncStatusIndicator } from '@/components/ensacado/SyncStatusIndicator'
import { AppIcon,ModulePageIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ENSACADO_POLL,ENSACADO_SCAN } from '@/constants/ensacado'
import {
esGuiaValidaParaBuscar,
useActualizarUltimaBusqueda,
useBuscarPaquete,
useDesmarcarEnsacado,
useInfoDespacho,
useMarcarEnsacado,
} from '@/hooks/useEnsacado'
import { getApiErrorMessage,getApiStatus } from '@/lib/api/errors'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useScanFeedback } from '@/hooks/useScanFeedback'
import type { PaqueteEnsacadoInfo } from '@/types/ensacado'
import { AlertCircle,CheckCircle2,Copy,Loader2,ScanBarcode,Smartphone,Undo2,Volume2,VolumeX,X,XCircle } from 'lucide-react'
import { useCallback,useEffect,useRef,useState } from 'react'
import { PaqueteInfoCard } from './PaqueteInfoCard'
import { VistaEnsacadoSoloLectura } from './VistaEnsacadoSoloLectura'

type Modo = 'selector' | 'escanear' | 'soloLectura'

type ScanStatus = 'ensacado' | 'duplicado' | 'error' | 'deshecho'
interface ScanHistorial {
  id: number
  guia: string
  status: ScanStatus
  hora: string
  idPaquete?: number
}

function EnsacadoPage() {
  const [modo, setModo] = useState<Modo>('selector')
  const [numeroGuia, setNumeroGuia] = useState('')
  const [numeroGuiaDebounced, setNumeroGuiaDebounced] = useState('')
  const [ultimoPaqueteMostrado, setUltimoPaqueteMostrado] = useState<PaqueteEnsacadoInfo | null>(null)
  const [highlightSuccess, setHighlightSuccess] = useState(false)
  const [ensacadosSesion, setEnsacadosSesion] = useState(0)
  const [historial, setHistorial] = useState<ScanHistorial[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimoValorProcesadoRef = useRef('')
  const ultimaGuiaSincronizadaRef = useRef<string | null>(null)
  const ultimoIdMarcadoRef = useRef<number | null>(null)
  const marcandoRef = useRef(false)
  const ultimoErrorGuiaRef = useRef<string | null>(null)
  const historialIdRef = useRef(0)

  const feedback = useScanFeedback()

  const registrarEnHistorial = useCallback((guia: string, status: ScanStatus, idPaquete?: number) => {
    if (!guia) return
    historialIdRef.current += 1
    const entrada: ScanHistorial = {
      id: historialIdRef.current,
      guia,
      status,
      idPaquete,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setHistorial((prev) => [entrada, ...prev].slice(0, ENSACADO_SCAN.maxListItems))
  }, [])

  const { mutate: actualizarUltimaBusquedaMutate } = useActualizarUltimaBusqueda()

  const limpiarInput = useCallback(() => {
    setNumeroGuia('')
    setNumeroGuiaDebounced('')
    ultimoValorProcesadoRef.current = ''
  }, [])

  const aplicarGuia = useCallback((valor: string) => {
    const limpio = valor.trim()
    if (!limpio) return
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    setNumeroGuiaDebounced(limpio)
    ultimoValorProcesadoRef.current = limpio
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      const limpio = numeroGuia.trim()
      if (limpio && limpio !== ultimoValorProcesadoRef.current) {
        setNumeroGuiaDebounced(limpio)
        ultimoValorProcesadoRef.current = limpio
      } else if (!limpio) {
        setNumeroGuiaDebounced('')
        ultimoValorProcesadoRef.current = ''
      }
    }, ENSACADO_SCAN.debounceMs)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [numeroGuia])

  useEffect(() => {
    ultimoIdMarcadoRef.current = null
    marcandoRef.current = false
    if (numeroGuiaDebounced?.trim()) setUltimoPaqueteMostrado(null)
  }, [numeroGuiaDebounced])

  const {
    data: paqueteInfo,
    isLoading: isLoadingPaquete,
    isFetching: isFetchingPaquete,
    error: errorPaquete,
  } = useBuscarPaquete(numeroGuiaDebounced || undefined)

  const { mutate: marcarEnsacadoMutate, isPending: marcarEnsacadoPending } = useMarcarEnsacado()
  const { mutate: desmarcarEnsacadoMutate, isPending: desmarcarEnsacadoPending } = useDesmarcarEnsacado()

  const handleDeshacerEnsacado = useCallback(
    (entrada: ScanHistorial) => {
      if (entrada.idPaquete == null || desmarcarEnsacadoPending) return
      desmarcarEnsacadoMutate(entrada.idPaquete, {
        onSuccess: () => {
          notify.success(`Ensacado deshecho: ${entrada.guia}`)
          feedback.warning()
          setEnsacadosSesion((n) => Math.max(0, n - 1))
          setHistorial((prev) =>
            prev.map((h) => (h.id === entrada.id ? { ...h, status: 'deshecho' } : h))
          )
          // Permite volver a escanear la misma guía inmediatamente
          ultimoIdMarcadoRef.current = null
          inputRef.current?.focus()
        },
      })
    },
    [desmarcarEnsacadoMutate, desmarcarEnsacadoPending, feedback]
  )

  const paqueteActivo =
    paqueteInfo && !errorPaquete && numeroGuiaDebounced ? paqueteInfo : ultimoPaqueteMostrado

  const { data: despachoInfo } = useInfoDespacho(paqueteActivo?.idDespacho, {
    refetchInterval: ENSACADO_POLL.despachoMs,
    enabled: modo === 'escanear' && !!paqueteActivo?.idDespacho,
  })

  const sacaActual =
    despachoInfo?.sacas?.find((s) => s.idSaca === paqueteActivo?.idSacaAsignada) ?? null
  const paquetesEnsacados = sacaActual?.paquetesEnsacados ?? []
  const paquetesPendientes = sacaActual?.paquetesPendientes ?? []

  // Sincronizar sesión para vista móvil (al encontrar paquete válido)
  useEffect(() => {
    if (modo !== 'escanear') return
    const guia = numeroGuiaDebounced?.trim()
    if (!guia || !esGuiaValidaParaBuscar(guia)) {
      ultimaGuiaSincronizadaRef.current = null
      return
    }
    if (!paqueteInfo || errorPaquete) return
    if (ultimaGuiaSincronizadaRef.current === guia) return

    ultimaGuiaSincronizadaRef.current = guia
    actualizarUltimaBusquedaMutate(guia)
  }, [modo, paqueteInfo, errorPaquete, numeroGuiaDebounced, actualizarUltimaBusquedaMutate])

  // Ensacar automáticamente tras búsqueda exitosa
  useEffect(() => {
    if (modo !== 'escanear') return
    if (!paqueteInfo || errorPaquete || !numeroGuiaDebounced?.trim()) return
    if (marcandoRef.current) return
    if (ultimoIdMarcadoRef.current === paqueteInfo.idPaquete) return

    if (paqueteInfo.yaEnsacado) {
      notify.warning('Este paquete ya está ensacado')
      feedback.warning()
      registrarEnHistorial(paqueteInfo.numeroGuia, 'duplicado')
      setUltimoPaqueteMostrado(paqueteInfo)
      limpiarInput()
      ultimoIdMarcadoRef.current = paqueteInfo.idPaquete
      return
    }

    marcandoRef.current = true
    const idPaquete = paqueteInfo.idPaquete
    marcarEnsacadoMutate(idPaquete, {
      onSuccess: () => {
        ultimoIdMarcadoRef.current = idPaquete
        setUltimoPaqueteMostrado(paqueteInfo)
        setEnsacadosSesion((n) => n + 1)
        setHighlightSuccess(true)
        feedback.success()
        registrarEnHistorial(paqueteInfo.numeroGuia, 'ensacado', idPaquete)
        setTimeout(() => setHighlightSuccess(false), 1_200)
        limpiarInput()
        inputRef.current?.focus()
      },
      onError: () => {
        // Bloquear reintentos automáticos para el mismo paquete hasta escanear otra guía
        ultimoIdMarcadoRef.current = idPaquete
        setUltimoPaqueteMostrado(paqueteInfo)
        feedback.error()
        registrarEnHistorial(paqueteInfo.numeroGuia, 'error')
      },
      onSettled: () => {
        marcandoRef.current = false
      },
    })
  }, [modo, paqueteInfo, errorPaquete, numeroGuiaDebounced, marcarEnsacadoMutate, limpiarInput, feedback, registrarEnHistorial])

  // Feedback de error de búsqueda (guía inexistente / fallo de red), una vez por guía
  useEffect(() => {
    if (modo !== 'escanear') return
    const guia = numeroGuiaDebounced?.trim()
    if (!guia || !errorPaquete) return
    if (ultimoErrorGuiaRef.current === guia) return
    ultimoErrorGuiaRef.current = guia
    feedback.error()
    registrarEnHistorial(guia, 'error')
  }, [modo, errorPaquete, numeroGuiaDebounced, feedback, registrarEnHistorial])

  useEffect(() => {
    if (modo === 'escanear') inputRef.current?.focus()
  }, [modo])

  useEffect(() => {
    if (modo !== 'escanear') return
    if (!marcarEnsacadoPending && !numeroGuia) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [modo, marcarEnsacadoPending, numeroGuia])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && numeroGuia.trim()) {
      e.preventDefault()
      aplicarGuia(numeroGuia)
    }
  }

  const errorMessage =
    errorPaquete && numeroGuiaDebounced
      ? getApiStatus(errorPaquete) === 404
        ? 'Paquete no encontrado'
        : getApiErrorMessage(errorPaquete, 'Error al buscar el paquete')
      : null

  const procesando = isLoadingPaquete || isFetchingPaquete || marcarEnsacadoPending

  if (modo === 'soloLectura') {
    return <VistaEnsacadoSoloLectura onVolver={() => setModo('selector')} />
  }

  if (modo === 'selector') {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
        <EnsacadoLayoutHeader title="Ensacado" subtitle="Operación de bodega" />

        <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
          <div className="mb-10 max-w-lg text-center">
            <ModulePageIcon module="ensacado" variant="tile" className="mx-auto mb-4 size-14" />
            <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">¿Qué deseas hacer?</h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Escanea guías en esta pantalla o abre la vista en otro dispositivo para seguir el progreso en
              tiempo real.
            </p>
          </div>

          <div className="grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
            <ModoCard
              title="Escanear paquetes"
              description="Lector o teclado: busca la guía y la marca como ensacada automáticamente."
              icon={ScanBarcode}
              onClick={() => {
                setEnsacadosSesion(0)
                setHistorial([])
                ultimoErrorGuiaRef.current = null
                setModo('escanear')
              }}
            />
            <ModoCard
              title="Ver en curso"
              description="Pantalla secundaria (móvil/tablet) sincronizada con el último escaneo del mismo usuario."
              icon={Smartphone}
              onClick={() => setModo('soloLectura')}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <EnsacadoLayoutHeader
        title="Escanear paquetes"
        subtitle={ensacadosSesion > 0 ? `${ensacadosSesion} ensacados en esta sesión` : 'Listo para escanear'}
        onBack={() => setModo('selector')}
        showScanIcon
        trailing={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={feedback.toggle}
              className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
              title={feedback.enabled ? 'Silenciar sonido de escaneo' : 'Activar sonido de escaneo'}
              aria-label={feedback.enabled ? 'Silenciar sonido' : 'Activar sonido'}
            >
              {feedback.enabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </Button>
            <SyncStatusIndicator />
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="relative">
            <Label htmlFor="scanGuiaEnsacado" className="sr-only">
              Número de guía
            </Label>
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl border-2 shadow-sm transition-all duration-200',
                errorMessage
                  ? 'border-error/50 shadow-error/10'
                  : procesando
                    ? 'border-primary/50 shadow-primary/10'
                    : 'border-border/50 focus-within:border-primary/60'
              )}
            >
              <Input
                id="scanGuiaEnsacado"
                ref={inputRef}
                placeholder="Escanear o escribir guía…"
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={marcarEnsacadoPending}
                className="h-16 border-0 bg-transparent px-14 text-center font-mono text-2xl focus-visible:ring-0 sm:h-20 sm:text-3xl"
                autoComplete="off"
                inputMode="text"
              />
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {procesando ? (
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                ) : numeroGuia ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full"
                    onClick={() => {
                      limpiarInput()
                      inputRef.current?.focus()
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                ) : (
                  <AppIcon icon={ScanBarcode} size="md" className="text-muted-foreground/25" />
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {marcarEnsacadoPending
                ? 'Marcando como ensacado…'
                : isLoadingPaquete
                  ? 'Buscando paquete…'
                  : 'Enter confirma · El lector suele enviar Enter automáticamente'}
            </p>
          </div>

          {errorMessage ? (
            <div className="animate-in fade-in flex items-center gap-4 rounded-xl border border-error/30 bg-error/10 p-4 duration-200">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error/15">
                <AlertCircle className="size-5 text-error" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-error">{errorMessage}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{numeroGuiaDebounced}</p>
              </div>
            </div>
          ) : null}

          {paqueteActivo ? (
            <div className="animate-in fade-in duration-200">
              <PaqueteInfoCard info={paqueteActivo} saca={sacaActual} highlightSuccess={highlightSuccess} />
            </div>
          ) : null}
        </div>

        {paqueteActivo ? (
          <div className="mx-auto max-w-3xl animate-in fade-in duration-200">
            <SacaGuiasPanel ensacados={paquetesEnsacados} pendientes={paquetesPendientes} />
          </div>
        ) : null}

        {historial.length > 0 ? (
          <div className="mx-auto max-w-3xl">
            <HistorialSesion
              historial={historial}
              onLimpiar={() => setHistorial([])}
              onDeshacer={handleDeshacerEnsacado}
              deshaciendo={desmarcarEnsacadoPending}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

const HISTORIAL_STATUS: Record<ScanStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ensacado: { label: 'Ensacado', icon: CheckCircle2, className: 'text-success' },
  duplicado: { label: 'Ya ensacado', icon: Copy, className: 'text-warning' },
  error: { label: 'Error', icon: XCircle, className: 'text-error' },
  deshecho: { label: 'Deshecho', icon: Undo2, className: 'text-muted-foreground' },
}

function HistorialSesion({
  historial,
  onLimpiar,
  onDeshacer,
  deshaciendo,
}: {
  historial: ScanHistorial[]
  onLimpiar: () => void
  onDeshacer: (entrada: ScanHistorial) => void
  deshaciendo: boolean
}) {
  const totalEnsacados = historial.filter((h) => h.status === 'ensacado').length
  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/30 bg-muted/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Historial de la sesión</h3>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-success">
            {totalEnsacados} ensacados
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLimpiar}
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Limpiar
        </Button>
      </div>
      <ul className="max-h-64 divide-y divide-border/20 overflow-y-auto">
        {historial.map((item) => {
          const cfg = HISTORIAL_STATUS[item.status]
          const Icon = cfg.icon
          const puedeDeshacer = item.status === 'ensacado' && item.idPaquete != null
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 px-4 py-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <Icon className={cn('size-4 shrink-0', cfg.className)} />
              <span
                className={cn(
                  'flex-1 truncate font-mono',
                  item.status === 'deshecho' && 'text-muted-foreground line-through'
                )}
              >
                {item.guia}
              </span>
              <span className={cn('text-[11px] font-medium', cfg.className)}>{cfg.label}</span>
              {puedeDeshacer ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeshacer(item)}
                  disabled={deshaciendo}
                  className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-error"
                  title="Deshacer ensacado"
                >
                  <Undo2 className="size-3.5" />
                  <span className="hidden sm:inline">Deshacer</span>
                </Button>
              ) : (
                <span className="hidden w-[68px] shrink-0 sm:block" aria-hidden />
              )}
              <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {item.hora}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ModoCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: typeof ScanBarcode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-2xl border border-border/60 bg-card/80 p-7 text-left backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
          <AppIcon icon={icon} size="lg" className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </button>
  )
}

export default EnsacadoPage
