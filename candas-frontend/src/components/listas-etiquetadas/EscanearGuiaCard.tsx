import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { toast } from 'sonner'
import { Loader2, Scan, CheckCircle2, XCircle, Trash2, Download, Printer } from 'lucide-react'
import { generarExcelEscaneos } from '@/utils/generarExcelEscaneos'
import { imprimirEscaneos } from '@/utils/imprimirEscaneos'
import { obtenerColorEtiqueta } from '@/utils/coloresEtiquetas'

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'

interface EscaneoResultado {
  numeroGuia: string
  etiqueta: string | null
  fecha: Date
  instruccion?: string | null
  estado?: string | null
}

const STORAGE_KEY = 'escaneos-guias-historial'

export default function EscanearGuiaCard() {
  const [numeroGuia, setNumeroGuia] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadoActual, setResultadoActual] = useState<EscaneoResultado | null>(null)
  const [historial, setHistorial] = useState<EscaneoResultado[]>([])
  const [gruposSeleccionados, setGruposSeleccionados] = useState<Set<string>>(new Set())
  /** Cuando la guía está en varias etiquetas, el operario debe elegir una antes de marcar receptado */
  const [pendienteElegirEtiqueta, setPendienteElegirEtiqueta] = useState<{ numeroGuia: string; etiquetas: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultadoRef = useRef<HTMLDivElement>(null)

  // Cargar historial desde backend al montar el componente
  useEffect(() => {
    cargarHistorial(true)
  }, [])

  const cargarHistorial = async (silent = false) => {
    try {
      const datos = await listasEtiquetadasService.getHistorialReceptados()
      const formateados: EscaneoResultado[] = datos.map(d => ({
        numeroGuia: d.numeroGuia ?? '',
        etiqueta: d.ref ?? null,
        fecha: d.fechaRecepcion ? new Date(d.fechaRecepcion) : new Date(),
        instruccion: d.observaciones?.includes('Instrucción:') ? d.observaciones : null,
        estado: d.estado ?? null
      }))
      setHistorial(formateados)
    } catch (error: any) {
      const isNetworkError = error?.code === 'ERR_NETWORK' || (error?.message && String(error.message).includes('Network Error'))
      if (!silent || !isNetworkError) {
        console.error('Error al cargar historial', error)
      }
      if (!silent) {
        toast.error('No se pudo cargar el historial reciente')
      }
    }
  }

  // Inicializar grupos seleccionados cuando cambie el historial
  useEffect(() => {
    if (historial.length > 0) {
      const gruposEncontrados = new Set<string>()
      historial.forEach(item => {
        const grupo = item.etiqueta || 'Sin etiqueta'
        gruposEncontrados.add(grupo)
      })
      // Solo actualizar si no hay grupos seleccionados (primera carga)
      setGruposSeleccionados(prev => {
        if (prev.size === 0) {
          return gruposEncontrados
        }
        // Si ya hay grupos seleccionados, mantenerlos pero agregar nuevos si existen
        const nuevos = new Set(prev)
        gruposEncontrados.forEach(grupo => {
          if (!nuevos.has(grupo)) {
            nuevos.add(grupo)
          }
        })
        return nuevos
      })
    }
  }, [historial])

  // Auto-focus permanente en el input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-focus después de buscar
  useEffect(() => {
    if (!buscando && !numeroGuia) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [buscando, numeroGuia])

  // Scroll al resultado cuando cambia
  useEffect(() => {
    if (resultadoActual && resultadoRef.current) {
      resultadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [resultadoActual])

  // Detectar cuando se presiona Enter o cuando hay un cambio significativo
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
      setTimeout(() => {
        setNumeroGuia('')
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }, 500)
      return // No continuar con la búsqueda si ya existe
    }

    setBuscando(true)
    setPendienteElegirEtiqueta(null)
    try {
      // 1. Consultar primero si la guía tiene varias etiquetas
      const dto = await listasEtiquetadasService.consultarGuia(guiaNormalizada)
      if (!dto) {
        toast.error(`La guía ${guia} no está registrada en el sistema de etiquetado`)
        setResultadoActual({ numeroGuia: guiaNormalizada, etiqueta: null, fecha: new Date(), instruccion: null, estado: null })
        setBuscando(false)
        setNumeroGuia('')
        setTimeout(() => inputRef.current?.focus(), 100)
        return
      }
      const variasEtiquetas = dto.variasListas ?? (dto.etiquetas?.length ?? 0) > 1

      if (variasEtiquetas) {
        setPendienteElegirEtiqueta({ numeroGuia: guiaNormalizada, etiquetas: dto.etiquetas ?? [] })
        setBuscando(false)
        setNumeroGuia('')
        setTimeout(() => inputRef.current?.focus(), 100)
        return
      }

      // 2. Una sola etiqueta: marcar como receptado
      const resultado = await listasEtiquetadasService.marcarReceptado(guiaNormalizada)
      const etiqueta = resultado.ref ?? null
      const tieneInstruccion = (resultado.observaciones ?? '').includes('Instrucción:')

      const nuevoResultado: EscaneoResultado = {
        numeroGuia: resultado.numeroGuia ?? guiaNormalizada,
        etiqueta,
        fecha: new Date(),
        instruccion: tieneInstruccion ? resultado.observaciones ?? null : null,
        estado: resultado.estado ?? null
      }
      setResultadoActual(nuevoResultado)
      await cargarHistorial(true)

      if (tieneInstruccion && (resultado.observaciones ?? '').includes('RETENER')) {
        toast.error(`⚠️ ALERTA: RETENER ESTE PAQUETE! (${etiqueta})`, {
          duration: 5000,
          style: { border: '2px solid red', padding: '16px', fontWeight: 'bold' }
        })
      } else if (tieneInstruccion) {
        toast.warning(`⚠️ ATENCIÓN: Instrucción especial (${etiqueta})`, { duration: 4000 })
      } else {
        toast.success(`Guía ${guia} procesada: ${etiqueta}`, { duration: 2000 })
      }

      setTimeout(() => {
        setNumeroGuia('')
        setTimeout(() => inputRef.current?.focus(), 100)
      }, 500)
    } catch (error: any) {
      console.error(error)
      toast.error(`La guía ${guia} no está registrada en el sistema de etiquetado`)
      setResultadoActual({
        numeroGuia: guiaNormalizada,
        etiqueta: null,
        fecha: new Date(),
        instruccion: null,
        estado: null
      })
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
      const resultado = await listasEtiquetadasService.marcarReceptado(num)
      setResultadoActual({
        numeroGuia: resultado.numeroGuia ?? num,
        etiqueta: resultado.ref ?? null,
        fecha: new Date(),
        instruccion: (resultado.observaciones ?? '').includes('Instrucción:') ? resultado.observaciones ?? null : null,
        estado: resultado.estado ?? null
      })
      setPendienteElegirEtiqueta(null)
      await cargarHistorial(true)
      toast.success(`Guía ${num} asignada a ${etiquetaElegida} y marcada como receptada`)
      setNumeroGuia('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al elegir etiqueta')
    } finally {
      setBuscando(false)
    }
  }

  const handleBuscar = async () => {
    if (numeroGuia.trim()) {
      await buscarEtiqueta(numeroGuia.trim().toUpperCase())
    }
  }

  const limpiarHistorial = () => {
    // Solo limpia localmente la vista, no borra del backend
    setHistorial([])
    setResultadoActual(null)
    toast.info('Vista de historial limpiada')
  }

  const eliminarDelHistorial = (numeroGuia: string, index: number) => {
    setHistorial(prev => {
      const itemEliminado = prev[index]
      const nuevo = prev.filter((item, i) => i !== index)

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

  const handleToggleGrupo = (grupo: string) => {
    setGruposSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(grupo)) {
        nuevo.delete(grupo)
      } else {
        nuevo.add(grupo)
      }
      return nuevo
    })
  }

  const handleExportarExcel = () => {
    // Filtrar historial según grupos seleccionados
    const historialFiltrado = historial.filter(item => {
      const grupo = item.etiqueta || 'Sin etiqueta'
      return gruposSeleccionados.has(grupo)
    })

    if (historialFiltrado.length === 0) {
      toast.error('No hay escaneos seleccionados para exportar')
      return
    }

    try {
      generarExcelEscaneos(historial, Array.from(gruposSeleccionados))
      toast.success(`Excel exportado exitosamente con ${historialFiltrado.length} escaneo(s)`)
    } catch (error: any) {
      toast.error(error.message || 'Error al exportar el archivo Excel')
    }
  }

  const handleImprimir = () => {
    // Filtrar historial según grupos seleccionados
    const historialFiltrado = historial.filter(item => {
      const grupo = item.etiqueta || 'Sin etiqueta'
      return gruposSeleccionados.has(grupo)
    })

    if (historialFiltrado.length === 0) {
      toast.error('No hay escaneos seleccionados para imprimir')
      return
    }

    try {
      imprimirEscaneos(historial, Array.from(gruposSeleccionados))
    } catch (error: any) {
      toast.error(error.message || 'Error al imprimir')
    }
  }

  // Agrupar historial por etiqueta
  const historialPorEtiqueta = historial.reduce((acc, item) => {
    const key = item.etiqueta || 'Sin etiqueta'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<string, EscaneoResultado[]>)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Escanear guía</CardTitle>
          <CardDescription>
            Escriba o pase el número de guía para ver la etiqueta y registrar recepción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campo de entrada grande estilo VistaOperario */}
          <div className="space-y-2">
            <Label htmlFor="numeroGuiaEscaneo" className="sr-only">Número de Guía</Label>
            <Input
              ref={inputRef}
              id="numeroGuiaEscaneo"
              placeholder="Escanea o tipea el número de guía y presiona Enter..."
              value={numeroGuia}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={buscando}
              className="font-mono text-2xl h-16 text-center"
              autoFocus
              aria-label="Campo para escanear o tipear número de guía"
            />
            {buscando && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Buscando...</span>
              </div>
            )}
          </div>

          {/* Guía en varias etiquetas: operario debe elegir tipo correcto */}
          {pendienteElegirEtiqueta && (
            <div
              ref={resultadoRef}
              className="flex-1 rounded-xl border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300 p-6"
            >
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-8 w-8" />
                  <span className="text-lg font-semibold">La guía está en varios tipos</span>
                </div>
                <p className="text-muted-foreground">
                  La guía <strong className="font-mono text-foreground">{pendienteElegirEtiqueta.numeroGuia}</strong> está en{' '}
                  <strong>{pendienteElegirEtiqueta.etiquetas.join(' y ')}</strong>. Instrucción: Preguntar.
                </p>
                <p className="text-sm text-muted-foreground">Elija el tipo de etiqueta correcto:</p>
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
          )}

          {/* Visualización grande del resultado */}
          {resultadoActual && !pendienteElegirEtiqueta && (
            <div
              ref={resultadoRef}
              className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex flex-col md:flex-row h-full min-h-[250px]">
                {/* Left Colored Strip / Status Indicator */}
                <div
                  className="w-full md:w-32 flex items-center justify-center p-6 transition-colors"
                  style={{
                    backgroundColor: resultadoActual.etiqueta
                      ? obtenerColorEtiqueta(resultadoActual.etiqueta).bgLight
                      : 'hsl(var(--error) / 0.12)'
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    {resultadoActual.etiqueta ? (
                      <>
                        <div
                          className="h-14 w-14 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-sm shadow-sm"
                          style={{ color: obtenerColorEtiqueta(resultadoActual.etiqueta).text }}
                        >
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <span
                          className="text-xs font-bold uppercase tracking-wider text-center"
                          style={{ color: obtenerColorEtiqueta(resultadoActual.etiqueta).text }}
                        >
                          Encontrado
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="h-14 w-14 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-sm shadow-sm text-error">
                          <XCircle className="h-8 w-8" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-center text-error">
                          No existe
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col p-8 justify-center items-center text-center relative">
                  {/* Label Name */}
                  <div className="space-y-2 mb-6">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Grupo Asignado</div>
                    <div
                      className="text-6xl md:text-7xl font-black tracking-tighter transition-colors"
                      style={{
                        color: resultadoActual.etiqueta
                          ? obtenerColorEtiqueta(resultadoActual.etiqueta).text
                          : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      {resultadoActual.etiqueta || 'N/A'}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-16 h-1 bg-border rounded-full mb-6" />

                  {/* Guide Number */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Número de Guía</div>
                    <div className="text-2xl font-mono font-medium text-foreground tracking-tight bg-muted/30 px-4 py-1 rounded-md border border-border/50">
                      {resultadoActual.numeroGuia}
                    </div>
                  </div>

                  {/* Instruccion Especial */}
                  {resultadoActual.instruccion && resultadoActual.instruccion !== 'NINGUNA' && (
                    <div className={`mt-4 px-6 py-3 rounded-lg border-2 animate-pulse flex items-center gap-3 ${resultadoActual.instruccion === 'RETENER'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      }`}>
                      {resultadoActual.instruccion === 'RETENER' ? <ShieldAlert className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                      <div className="text-2xl font-black uppercase tracking-wider">
                        {resultadoActual.instruccion}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="absolute top-4 right-4 text-[10px] text-muted-foreground font-mono">
                    {resultadoActual.fecha.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {historial.length > 0 && (
            <div className="space-y-4">
              {/* Resumen por etiqueta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(historialPorEtiqueta).map(([etiqueta, items]) => (
                  <Card key={etiqueta} className="p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={etiqueta === 'Sin etiqueta' ? 'secondary' : 'outline'}>
                        {etiqueta}
                      </Badge>
                      <span className="text-sm font-semibold">{items.length}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Selector de grupos para exportar/imprimir */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Seleccionar Grupos para Exportar/Imprimir</CardTitle>
                  <CardDescription className="text-xs">
                    Marca los grupos que deseas incluir en la exportación o impresión. Por defecto todos están seleccionados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {Object.entries(historialPorEtiqueta).map(([etiqueta, items]) => (
                      <div key={etiqueta} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grupo-escaneo-${etiqueta}`}
                          checked={gruposSeleccionados.has(etiqueta)}
                          onCheckedChange={() => handleToggleGrupo(etiqueta)}
                        />
                        <label
                          htmlFor={`grupo-escaneo-${etiqueta}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                        >
                          <Badge variant={etiqueta === 'Sin etiqueta' ? 'secondary' : 'outline'}>
                            {etiqueta}
                          </Badge>
                          <span className="text-muted-foreground">
                            ({items.length} escaneo(s))
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const todos = new Set<string>()
                        Object.keys(historialPorEtiqueta).forEach(e => todos.add(e))
                        setGruposSeleccionados(todos)
                      }}
                    >
                      Seleccionar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGruposSeleccionados(new Set())}
                    >
                      Deseleccionar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportarExcel}
                      className="gap-2"
                      disabled={gruposSeleccionados.size === 0}
                    >
                      <Download className="h-4 w-4" />
                      Exportar Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImprimir}
                      className="gap-2"
                      disabled={gruposSeleccionados.size === 0}
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={limpiarHistorial}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpiar
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    {gruposSeleccionados.size} grupo(s) seleccionado(s) - {historial.filter(item => {
                      const grupo = item.etiqueta || 'Sin etiqueta'
                      return gruposSeleccionados.has(grupo)
                    }).length} escaneo(s) incluido(s)
                  </div>
                </CardContent>
              </Card>

              {/* Historial */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Historial de Escaneos ({historial.length})</h3>
              </div>

              <div className="border rounded-md max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número de Guía</TableHead>
                      <TableHead>Grupo/Etiqueta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.map((item, index) => (
                      <TableRow key={`${item.numeroGuia}-${index}`}>
                        <TableCell className="font-mono font-semibold">
                          {item.numeroGuia}
                        </TableCell>
                        <TableCell>
                          {item.etiqueta ? (
                            <Badge variant="outline" className="text-sm">
                              {item.etiqueta}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin etiqueta</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.etiqueta ? (
                            <div className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Encontrado</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">No encontrado</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.fecha.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarDelHistorial(item.numeroGuia, index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar del historial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Mensaje inicial si no hay resultados */}
          {!resultadoActual && historial.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl">Escanea o tipea un número de guía para comenzar</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
