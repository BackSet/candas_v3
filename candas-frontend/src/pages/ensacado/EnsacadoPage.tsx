import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PaqueteInfoCard } from './PaqueteInfoCard'
import type { PaqueteEnsacadoInfo } from '@/types/ensacado'
import {
  useBuscarPaquete,
  useMarcarEnsacado,
  useActualizarUltimaBusqueda,
  useInfoDespacho,
  esGuiaValidaParaBuscar,
} from '@/hooks/useEnsacado'
import { notify } from '@/lib/notify'
import { getApiErrorMessage, getApiStatus } from '@/lib/api/errors'
import { ScanBarcode, X, Loader2, AlertCircle, Smartphone } from 'lucide-react'
import { VistaEnsacadoSoloLectura } from './VistaEnsacadoSoloLectura'
import { EnsacadoLayoutHeader } from '@/components/ensacado/EnsacadoLayoutHeader'
import { SacaGuiasPanel } from '@/components/ensacado/SacaGuiasPanel'
import { SyncStatusIndicator } from '@/components/ensacado/SyncStatusIndicator'
import { AppIcon, ModulePageIcon } from '@/components/icons'
import { ENSACADO_POLL, ENSACADO_SCAN } from '@/constants/ensacado'
import { cn } from '@/lib/utils'

type Modo = 'selector' | 'escanear' | 'soloLectura'

function EnsacadoPage() {
  const [modo, setModo] = useState<Modo>('selector')
  const [numeroGuia, setNumeroGuia] = useState('')
  const [numeroGuiaDebounced, setNumeroGuiaDebounced] = useState('')
  const [ultimoPaqueteMostrado, setUltimoPaqueteMostrado] = useState<PaqueteEnsacadoInfo | null>(null)
  const [highlightSuccess, setHighlightSuccess] = useState(false)
  const [ensacadosSesion, setEnsacadosSesion] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimoValorProcesadoRef = useRef('')
  const ultimaGuiaSincronizadaRef = useRef<string | null>(null)
  const ultimoIdMarcadoRef = useRef<number | null>(null)
  const marcandoRef = useRef(false)

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
        setTimeout(() => setHighlightSuccess(false), 1_200)
        limpiarInput()
        inputRef.current?.focus()
      },
      onError: () => {
        // Bloquear reintentos automáticos para el mismo paquete hasta escanear otra guía
        ultimoIdMarcadoRef.current = idPaquete
        setUltimoPaqueteMostrado(paqueteInfo)
      },
      onSettled: () => {
        marcandoRef.current = false
      },
    })
  }, [modo, paqueteInfo, errorPaquete, numeroGuiaDebounced, marcarEnsacadoMutate, limpiarInput])

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
        trailing={<SyncStatusIndicator />}
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
      </div>
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
