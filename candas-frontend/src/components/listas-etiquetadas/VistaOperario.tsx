import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Download, Printer, History, Hash, Trash2, AlertTriangle, Tag } from 'lucide-react'
import { obtenerColorEtiqueta } from '@/utils/coloresEtiquetas'
import { useNavigate } from '@tanstack/react-router'
import { generarExcelEscaneos } from '@/utils/generarExcelEscaneos'
import { imprimirEscaneos } from '@/utils/imprimirEscaneos'
import { cn } from '@/lib/utils'

interface EscaneoResultado {
  numeroGuia: string
  etiqueta: string | null
  fecha: Date
}

const STORAGE_KEY = 'escaneos-guias-historial'

interface VistaOperarioProps {
  onVolver?: () => void
}

export default function VistaOperario({ onVolver }: VistaOperarioProps) {
  const navigate = useNavigate()
  const [numeroGuia, setNumeroGuia] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadoActual, setResultadoActual] = useState<EscaneoResultado | null>(null)
  const [historial, setHistorial] = useState<EscaneoResultado[]>([])
  const [conteoPorEtiqueta, setConteoPorEtiqueta] = useState<Record<string, number>>({})
  const [showHistory, setShowHistory] = useState(true)
  /** Cuando la guía está en varias etiquetas, el operario debe elegir una antes de marcar receptado */
  const [pendienteElegirEtiqueta, setPendienteElegirEtiqueta] = useState<{ numeroGuia: string; etiquetas: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultadoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const historialGuardado = localStorage.getItem(STORAGE_KEY)
      if (historialGuardado) {
        const historialParsed = JSON.parse(historialGuardado).map((item: any) => ({
          ...item,
          fecha: new Date(item.fecha),
        }))
        setHistorial(historialParsed)

        const nuevoConteo: Record<string, number> = {}
        historialParsed.forEach((item: EscaneoResultado) => {
          const key = item.etiqueta || 'Sin etiqueta'
          nuevoConteo[key] = (nuevoConteo[key] || 0) + 1
        })
        setConteoPorEtiqueta(nuevoConteo)
      }
    } catch (error) {
      console.error('Error al cargar historial desde localStorage:', error)
    }
  }, [])

  useEffect(() => {
    if (historial.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historial))
      } catch (error) {
        console.error('Error al guardar historial en localStorage:', error)
      }
    }
  }, [historial])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if ((resultadoActual || pendienteElegirEtiqueta) && resultadoRef.current) {
      resultadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [resultadoActual, pendienteElegirEtiqueta])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toUpperCase()
    setNumeroGuia(value)
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && numeroGuia.trim()) {
      e.preventDefault()
      await buscarEtiqueta(numeroGuia.trim().toUpperCase())
    }
  }

  const buscarEtiqueta = async (guia: string) => {
    if (!guia) return

    // Normalizar la guía para comparación
    const guiaNormalizada = guia.trim().toUpperCase()

    // Verificar si la guía ya existe en el historial
    const existe = historial.some(item => item.numeroGuia.toUpperCase() === guiaNormalizada)

    if (existe) {
      toast.info(`La guía ${guiaNormalizada} ya fue escaneada anteriormente`, {
        duration: 2000,
      })
      // Actualizar el resultado actual con el existente
      const resultadoExistente = historial.find(item => item.numeroGuia.toUpperCase() === guiaNormalizada)
      if (resultadoExistente) {
        setResultadoActual(resultadoExistente)
      }
      // Limpiar input y volver a enfocar
      setNumeroGuia('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return // No continuar con la búsqueda si ya existe
    }

    setBuscando(true)
    setPendienteElegirEtiqueta(null)
    try {
      const mapa = await listasEtiquetadasService.consultarGuias([guiaNormalizada])
      const dto = mapa[guiaNormalizada]

      if (!dto) {
        toast.error(`La guía ${guiaNormalizada} no está registrada en el sistema de etiquetado`)
        setResultadoActual({ numeroGuia: guiaNormalizada, etiqueta: null, fecha: new Date() })
        setBuscando(false)
        setNumeroGuia('')
        setTimeout(() => inputRef.current?.focus(), 100)
        return
      }

      const variasEtiquetas = dto.variasListas ?? (dto.etiquetas?.length ?? 0) > 1
      if (variasEtiquetas) {
        setPendienteElegirEtiqueta({ numeroGuia: guiaNormalizada, etiquetas: dto.etiquetas ?? [] })
        setNumeroGuia('')
        setTimeout(() => inputRef.current?.focus(), 100)
        setBuscando(false)
        return
      }

      const etiqueta = (dto.etiquetas?.length === 1 ? dto.etiquetas[0] : null) || null
      await listasEtiquetadasService.marcarReceptado(guiaNormalizada).catch(() => {})

      setHistorial(prev => {
        const yaExiste = prev.some(item => item.numeroGuia.toUpperCase() === guiaNormalizada)
        if (yaExiste) {
          const existente = prev.find(item => item.numeroGuia.toUpperCase() === guiaNormalizada)
          if (existente) setResultadoActual(existente)
          return prev
        }
        const nuevoResultado: EscaneoResultado = {
          numeroGuia: guiaNormalizada,
          etiqueta,
          fecha: new Date(),
        }
        setResultadoActual(nuevoResultado)
        setConteoPorEtiqueta(prevConteo => {
          const nuevo = { ...prevConteo }
          const key = etiqueta || 'Sin etiqueta'
          nuevo[key] = (nuevo[key] || 0) + 1
          return nuevo
        })
        return [nuevoResultado, ...prev]
      })

      setNumeroGuia('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error: any) {
      toast.error('Error al buscar la etiqueta')
    } finally {
      setBuscando(false)
    }
  }

  const handleElegirEtiqueta = async (etiquetaElegida: string) => {
    if (!pendienteElegirEtiqueta) return
    const { numeroGuia: num } = pendienteElegirEtiqueta
    setBuscando(true)
    try {
      await listasEtiquetadasService.elegirEtiqueta(num, etiquetaElegida)
      await listasEtiquetadasService.marcarReceptado(num)
      const nuevoResultado: EscaneoResultado = { numeroGuia: num, etiqueta: etiquetaElegida, fecha: new Date() }
      setResultadoActual(nuevoResultado)
      setPendienteElegirEtiqueta(null)
      setHistorial(prev => [nuevoResultado, ...prev])
      setConteoPorEtiqueta(prev => {
        const nuevo = { ...prev }
        nuevo[etiquetaElegida] = (nuevo[etiquetaElegida] || 0) + 1
        return nuevo
      })
      toast.success(`Guía ${num} asignada a ${etiquetaElegida} y marcada como receptada`)
      setNumeroGuia('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al elegir etiqueta')
    } finally {
      setBuscando(false)
    }
  }

  const colorActual = resultadoActual ? obtenerColorEtiqueta(resultadoActual.etiqueta) : null

  const handleExportarExcel = () => {
    try {
      generarExcelEscaneos(historial)
      toast.success(`Excel exportado exitosamente con ${historial.length} escaneo(s)`)
    } catch (error: any) {
      toast.error(error.message || 'Error al exportar el archivo Excel')
    }
  }

  const handleImprimir = () => {
    try {
      imprimirEscaneos(historial)
    } catch (error: any) {
      toast.error(error.message || 'Error al imprimir')
    }
  }

  const eliminarDelHistorial = (numeroGuia: string, index: number) => {
    setHistorial(prev => {
      const itemEliminado = prev[index]
      const nuevo = prev.filter((item, i) => i !== index)

      // Actualizar conteo por etiqueta
      if (itemEliminado) {
        const key = itemEliminado.etiqueta || 'Sin etiqueta'
        setConteoPorEtiqueta(prevConteo => {
          const nuevoConteo = { ...prevConteo }
          const nuevoCount = nuevo.filter(item => {
            const grupo = item.etiqueta || 'Sin etiqueta'
            return grupo === key
          }).length

          if (nuevoCount === 0) {
            delete nuevoConteo[key]
          } else {
            nuevoConteo[key] = nuevoCount
          }

          return nuevoConteo
        })
      }

      // Si el elemento eliminado es el resultado actual, limpiarlo
      if (resultadoActual && resultadoActual.numeroGuia === numeroGuia) {
        // Verificar si hay otro elemento con la misma guía en el historial
        const existeOtro = nuevo.some(item => item.numeroGuia.toUpperCase() === numeroGuia.toUpperCase())
        if (!existeOtro) {
          setResultadoActual(null)
        }
      }

      return nuevo
    })
    toast.success('Paquete eliminado del historial')
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden fixed inset-0 z-50">
      {/* Top Bar */}
      <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onVolver ? () => onVolver() : () => navigate({ to: '/listas-etiquetadas' })}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 w-[1px] bg-border/40 sm:block hidden" />
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            <h1 className="text-sm font-semibold tracking-tight hidden sm:block">Etiquetado – Pantalla operario</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-4 hidden md:block">
            Total escaneados: <span className="font-mono font-medium text-foreground">{historial.length}</span>
          </div>
          {historial.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportarExcel} className="h-8 text-xs gap-2 hidden sm:flex">
                <Download className="h-3.5 w-3.5" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleImprimir} className="h-8 text-xs gap-2 hidden sm:flex">
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
            </>
          )}
          <Button
            variant={showHistory ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 text-xs gap-2"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Historial</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Side: Scanner & Result (Flexible) */}
        <div className="flex-1 flex flex-col p-8 md:p-12 items-center justify-center relative bg-muted/5">

          {/* Input Area */}
          <div className="w-full max-w-2xl mx-auto space-y-8 z-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur transition duration-500 group-hover:opacity-100 opacity-75"></div>
              <div className="relative bg-background rounded-lg shadow-xl ring-1 ring-border">
                <div className="flex items-center px-4 border-b border-border/40 h-10 bg-muted/30 rounded-t-lg">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-error/10 border border-error/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/10 border border-warning/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-success/10 border border-success/20"></div>
                  </div>
                  <div className="mx-auto text-[10px] font-mono text-muted-foreground tracking-widest uppercase">INPUT</div>
                </div>
                <div className="p-2">
                  <input
                    ref={inputRef}
                    value={numeroGuia}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={buscando}
                    className="w-full bg-transparent border-none text-center font-mono text-3xl md:text-4xl font-bold tracking-tight py-4 focus:ring-0 placeholder:text-muted-foreground/20 text-foreground"
                    placeholder="ESCANEAR GUÍA..."
                    autoFocus
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {buscando && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-medium tracking-widest uppercase">Consultando base de datos...</span>
              </div>
            )}
          </div>

          {/* Guía en varias etiquetas: operario debe elegir tipo correcto */}
          {pendienteElegirEtiqueta && (
            <div ref={resultadoRef} className="w-full max-w-4xl mx-auto mt-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-xl border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg overflow-hidden p-8 md:p-12 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-8 w-8" />
                    <span className="text-lg font-semibold">La guía está en varias listas</span>
                  </div>
                  <p className="text-muted-foreground">
                    La guía <strong className="font-mono text-foreground">{pendienteElegirEtiqueta.numeroGuia}</strong> está en{' '}
                    <strong>{pendienteElegirEtiqueta.etiquetas.join(' y ')}</strong>. Elija la etiqueta correcta:
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {pendienteElegirEtiqueta.etiquetas.map(et => (
                      <Button
                        key={et}
                        variant="outline"
                        size="lg"
                        disabled={buscando}
                        onClick={() => handleElegirEtiqueta(et)}
                        className="min-w-[100px]"
                        style={{
                          borderColor: obtenerColorEtiqueta(et).text,
                          color: obtenerColorEtiqueta(et).text
                        }}
                      >
                        {buscando ? <Loader2 className="h-5 w-5 animate-spin" /> : et}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {resultadoActual && !pendienteElegirEtiqueta && !buscando && (
            <div ref={resultadoRef} className="w-full max-w-4xl mx-auto mt-12 animate-in slide-in-from-bottom-4 duration-500">
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 bg-card p-8 md:p-12 text-center shadow-2xl transition-colors",
                  resultadoActual.etiqueta ? "border-primary/20" : "border-destructive/20"
                )}
              >
                {/* Background Tint */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ backgroundColor: resultadoActual.etiqueta ? colorActual?.bg : 'hsl(var(--error))' }}
                />

                {/* Status Icon */}
                <div className="mb-6 flex justify-center">
                  {resultadoActual.etiqueta ? (
                    <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success ring-8 ring-success/10">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-error/10 flex items-center justify-center text-error ring-8 ring-error/10">
                      <XCircle className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <h2 className={cn(
                  "text-6xl md:text-8xl font-black tracking-tighter mb-4 transition-colors",
                  resultadoActual.etiqueta ? "text-primary" : "text-muted-foreground"
                )}>
                  {resultadoActual.etiqueta || "SIN ETIQUETA"}
                </h2>

                {/* Guide Number */}
                <div className="inline-block px-6 py-3 rounded-lg bg-muted/50 border border-border/50 text-4xl md:text-5xl font-mono font-bold text-foreground tracking-widest shadow-inner">
                  {resultadoActual.numeroGuia}
                </div>
              </div>
            </div>
          )}

          {/* Empty State / Welcome */}
          {!resultadoActual && !pendienteElegirEtiqueta && !buscando && historial.length === 0 && (
            <div className="absolute inset-x-0 bottom-24 text-center text-muted-foreground pointer-events-none">
              <Hash className="h-16 w-16 mx-auto mb-4 opacity-10" />
              <p className="text-sm font-medium opacity-40">LISTO PARA ESCANEAR</p>
            </div>
          )}
        </div>

        {/* Right Side: History Sidebar */}
        <div
          className={cn(
            "w-80 border-l border-border/40 bg-card overflow-hidden flex flex-col transition-all duration-300 ease-in-out",
            showHistory ? "translate-x-0" : "translate-x-full w-0 border-l-0 opacity-0"
          )}
        >
          <div className="p-4 border-b border-border/40 bg-muted/10 shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="h-3.5 w-3.5" /> Actividad Reciente
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historial.map((item, i) => {
              const color = obtenerColorEtiqueta(item.etiqueta);
              return (
                <div key={`${item.numeroGuia}-${i}`} className="group relative flex flex-col gap-1 p-3 rounded-lg border border-border/40 hover:border-border hover:bg-muted/50 transition-colors bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.numeroGuia}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {item.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarDelHistorial(item.numeroGuia, i)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {item.etiqueta ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-transparent bg-primary/5 text-primary">
                        {item.etiqueta}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <XCircle className="h-2.5 w-2.5" /> Sin etiqueta
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {historial.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No hay escaneos recientes
              </div>
            )}
          </div>

          {/* Stats Footer */}
          {Object.keys(conteoPorEtiqueta).length > 0 && (
            <div className="border-t border-border/40 p-4 bg-muted/5 shrink-0">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resumen</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {Object.entries(conteoPorEtiqueta)
                  .sort((a, b) => b[1] - a[1])
                  .map(([etiqueta, count]) => (
                    <div key={etiqueta} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[140px] opacity-80">{etiqueta}</span>
                      <Badge variant="secondary" className="h-4 px-1 min-w-[1.5rem] justify-center text-[9px]">
                        {count}
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
