import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaqueteInfoCard } from './PaqueteInfoCard'
import type { PaqueteEnsacadoInfo } from '@/types/ensacado'
import { useBuscarPaquete, useMarcarEnsacado, useActualizarUltimaBusqueda, useInfoDespacho, esGuiaValidaParaBuscar } from '@/hooks/useEnsacado'
import { toast } from 'sonner'
import { Scan, X, Loader2, AlertCircle, ArrowLeft, Smartphone, Package, CheckCircle2 } from 'lucide-react'
import { VistaEnsacadoSoloLectura } from './VistaEnsacadoSoloLectura'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const MAX_ITEMS_VISIBLES = 50

function EnsacadoPage() {
  type Modo = 'selector' | 'escanear' | 'soloLectura'
  const [modo, setModo] = useState<Modo>('selector')
  const [numeroGuia, setNumeroGuia] = useState('')
  const [numeroGuiaDebounced, setNumeroGuiaDebounced] = useState('')
  const [ultimoPaqueteMostrado, setUltimoPaqueteMostrado] = useState<PaqueteEnsacadoInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const ultimoValorProcesadoRef = useRef<string>('')
  const ultimaGuiaSincronizadaRef = useRef<string | null>(null)
  const ultimoIdMarcadoRef = useRef<number | null>(null)

  const actualizarUltimaBusqueda = useActualizarUltimaBusqueda()

  // Debounce
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      const nuevoValor = numeroGuia.trim()
      if (nuevoValor && nuevoValor !== ultimoValorProcesadoRef.current) {
        setNumeroGuiaDebounced(nuevoValor)
        ultimoValorProcesadoRef.current = nuevoValor
      } else if (!nuevoValor && !numeroGuiaDebounced) {
        setNumeroGuiaDebounced('')
        ultimoValorProcesadoRef.current = ''
      }
    }, 500)
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [numeroGuia, numeroGuiaDebounced])

  useEffect(() => {
    if (numeroGuiaDebounced?.trim()) setUltimoPaqueteMostrado(null)
  }, [numeroGuiaDebounced])

  const {
    data: paqueteInfo,
    isLoading: isLoadingPaquete,
    error: errorPaquete,
  } = useBuscarPaquete(numeroGuiaDebounced || undefined)

  const marcarEnsacado = useMarcarEnsacado()

  // Info del despacho para listas de guías ensacadas/pendientes
  const paqueteActivo = paqueteInfo && !errorPaquete && numeroGuiaDebounced ? paqueteInfo : ultimoPaqueteMostrado
  const { data: despachoInfo } = useInfoDespacho(paqueteActivo?.idDespacho, {
    refetchInterval: 5000,
  })
  const sacaActual = despachoInfo?.sacas?.find(
    (s) => s.idSaca === paqueteActivo?.idSacaAsignada
  ) ?? null
  const paquetesEnsacados = sacaActual?.paquetesEnsacados ?? []
  const paquetesPendientes = sacaActual?.paquetesPendientes ?? []

  // Sincronizar última búsqueda con sesión para vista móvil
  useEffect(() => {
    const guia = numeroGuiaDebounced?.trim()
    if (!guia || !esGuiaValidaParaBuscar(guia)) {
      ultimaGuiaSincronizadaRef.current = null
      ultimoIdMarcadoRef.current = null
      return
    }
    if (!paqueteInfo || errorPaquete) return
    if (ultimaGuiaSincronizadaRef.current === guia) return
    ultimaGuiaSincronizadaRef.current = guia
    actualizarUltimaBusqueda.mutate(guia)
  }, [paqueteInfo, errorPaquete, numeroGuiaDebounced])

  // Ensacar automáticamente
  useEffect(() => {
    if (!paqueteInfo || errorPaquete || !numeroGuiaDebounced?.trim()) return
    if (ultimoIdMarcadoRef.current === paqueteInfo.idPaquete) return

    if (paqueteInfo.yaEnsacado) {
      toast.warning('Este paquete ya está ensacado')
      setUltimoPaqueteMostrado(paqueteInfo)
      setNumeroGuia('')
      setNumeroGuiaDebounced('')
      ultimoValorProcesadoRef.current = ''
      ultimoIdMarcadoRef.current = paqueteInfo.idPaquete
      return
    }

    ultimoIdMarcadoRef.current = paqueteInfo.idPaquete
    marcarEnsacado.mutate(paqueteInfo.idPaquete, {
      onSuccess: () => {
        setUltimoPaqueteMostrado(paqueteInfo)
        setNumeroGuia('')
        setNumeroGuiaDebounced('')
        ultimoValorProcesadoRef.current = ''
      },
    })
  }, [paqueteInfo, errorPaquete, numeroGuiaDebounced])

  // Auto-focus
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    if (!marcarEnsacado.isPending && !numeroGuia) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [marcarEnsacado.isPending, numeroGuia])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && numeroGuia.trim()) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      const nuevoValor = numeroGuia.trim()
      setNumeroGuiaDebounced(nuevoValor)
      ultimoValorProcesadoRef.current = nuevoValor
    }
  }

  // === VISTA: Solo Lectura ===
  if (modo === 'soloLectura') {
    return <VistaEnsacadoSoloLectura onVolver={() => setModo('selector')} />
  }

  // === VISTA: Selector Inicial ===
  if (modo === 'selector') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
        <div className="sticky top-0 z-20 bg-background/70 backdrop-blur-xl border-b border-border/30">
          <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">Ensacado</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-center">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">¿Qué deseas hacer?</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Elige una opción para comenzar con el proceso de ensacado
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setModo('escanear')}
              className="group relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-7 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <Scan className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground text-lg">Escanear paquetes</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Usa el escáner o teclado para buscar guías y marcar paquetes como ensacados.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setModo('soloLectura')}
              className="group relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-7 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground text-lg">Ver en curso</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Muestra en tiempo real los datos del paquete que se está ensacando en el otro dispositivo.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === VISTA: Modo Escaneo ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/70 backdrop-blur-xl border-b border-border/30">
        <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setModo('selector')} className="text-muted-foreground hover:text-foreground -ml-2" title="Volver al inicio">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Scan className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Escanear paquetes</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Zona de escaneo + resultado */}
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="relative">
            <Label htmlFor="scanGuiaEnsacado" className="sr-only">Número de Guía</Label>
            <div className={cn(
              "relative rounded-2xl overflow-hidden transition-all duration-500 border-2 shadow-sm",
              errorPaquete
                ? "border-red-400/60 shadow-red-500/10 shadow-lg"
                : isLoadingPaquete
                  ? "border-primary/50 shadow-primary/10 shadow-lg"
                  : "border-border/50 hover:border-primary/30 focus-within:border-primary/60 focus-within:shadow-primary/10 focus-within:shadow-lg"
            )}>
              <Input
                id="scanGuiaEnsacado"
                ref={inputRef}
                placeholder="Escanear o escribir guía..."
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                onKeyDown={handleKeyPress}
                className="border-0 h-16 sm:h-20 text-2xl sm:text-3xl font-mono text-center bg-transparent focus-visible:ring-0 px-14"
                autoFocus
                autoComplete="off"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isLoadingPaquete && (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {!isLoadingPaquete && numeroGuia && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" onClick={() => { setNumeroGuia(''); inputRef.current?.focus() }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {!isLoadingPaquete && !numeroGuia && (
                  <Scan className="h-5 w-5 text-muted-foreground/20" />
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground/70">
              {isLoadingPaquete ? 'Buscando información...' : 'El escáner envía Enter automáticamente · También puedes teclear y presionar Enter'}
            </p>
          </div>

          {/* Error */}
          {errorPaquete && numeroGuiaDebounced && (
            <div className="animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 text-sm">
                    {(errorPaquete as any)?.response?.status === 404
                      ? 'Paquete no encontrado'
                      : 'Error al buscar el paquete'}
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/70 font-mono mt-0.5">{numeroGuiaDebounced}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resultado del paquete */}
          {paqueteActivo && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <PaqueteInfoCard info={paqueteActivo} />
            </div>
          )}
        </div>

        {/* Listas de guías ensacadas y pendientes */}
        {paqueteActivo && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Guías ensacadas */}
              <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Guías ensacadas
                    </h3>
                    {paquetesEnsacados.length > 0 && (
                      <span className="ml-auto text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {paquetesEnsacados.length}
                      </span>
                    )}
                  </div>
                  {paquetesEnsacados.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 py-3 text-center italic">Ninguna aún</p>
                  ) : (
                    <>
                      <ul className="space-y-1.5 max-h-52 sm:max-h-72 overflow-y-auto text-sm font-mono" role="list">
                        {paquetesEnsacados.slice(0, MAX_ITEMS_VISIBLES).map((guia) => (
                          <li
                            key={guia}
                            className="py-1.5 px-3 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400 truncate text-xs"
                          >
                            {guia}
                          </li>
                        ))}
                      </ul>
                      {paquetesEnsacados.length > MAX_ITEMS_VISIBLES && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Mostrando {MAX_ITEMS_VISIBLES} de {paquetesEnsacados.length}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Pendientes */}
              <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Pendientes
                    </h3>
                    {paquetesPendientes.length > 0 && (
                      <span className="ml-auto text-[11px] font-bold tabular-nums text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {paquetesPendientes.length}
                      </span>
                    )}
                  </div>
                  {paquetesPendientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 py-3 text-center italic">No hay pendientes</p>
                  ) : (
                    <>
                      <ul className="space-y-1.5 max-h-52 sm:max-h-72 overflow-y-auto text-sm font-mono" role="list">
                        {paquetesPendientes.slice(0, MAX_ITEMS_VISIBLES).map((guia) => (
                          <li
                            key={guia}
                            className="py-1.5 px-3 rounded-lg bg-muted/30 border border-border/30 truncate text-xs"
                          >
                            {guia}
                          </li>
                        ))}
                      </ul>
                      {paquetesPendientes.length > MAX_ITEMS_VISIBLES && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Mostrando {MAX_ITEMS_VISIBLES} de {paquetesPendientes.length}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnsacadoPage
