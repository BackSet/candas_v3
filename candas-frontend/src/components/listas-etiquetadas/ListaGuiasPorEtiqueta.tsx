import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePickerForm } from '@/components/ui/date-time-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { notify } from '@/lib/notify'
import { Loader2, Trash2, RefreshCw, Download, Search, ClipboardList } from 'lucide-react'
import type { Paquete } from '@/types/paquete'

interface ListaGuiasPorEtiquetaProps {
  modoOperario?: boolean
}

export default function ListaGuiasPorEtiqueta({ modoOperario = false }: ListaGuiasPorEtiquetaProps) {
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState<string>('')
  const [guias, setGuias] = useState<Paquete[]>([])
  const [cargandoEtiquetas, setCargandoEtiquetas] = useState(false)
  const [cargandoGuias, setCargandoGuias] = useState(false)
  const [exportando, setExportando] = useState(false)

  // Búsqueda por número de guía y pegar lista (modo operario)
  const [busquedaGuia, setBusquedaGuia] = useState('')
  const [mostrarPegarLista, setMostrarPegarLista] = useState(false)
  const [listaPegadaTexto, setListaPegadaTexto] = useState('')

  // Filtros: receptado/sin receptar y fecha de recepción
  const [filtroReceptado, setFiltroReceptado] = useState<'TODOS' | 'RECEPTADOS' | 'SIN_RECEPTAR'>('TODOS')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())

  useEffect(() => {
    cargarEtiquetas()
  }, [])

  useEffect(() => {
    if (etiquetaSeleccionada) {
      cargarGuias(etiquetaSeleccionada)
      setSeleccionados(new Set()) // Limpiar selección al cambiar etiqueta
    } else {
      setGuias([])
      setSeleccionados(new Set())
    }
  }, [etiquetaSeleccionada])

  const cargarEtiquetas = async () => {
    setCargandoEtiquetas(true)
    try {
      const list = await listasEtiquetadasService.getAllEtiquetas()
      setEtiquetas(list ?? [])
    } catch (error: any) {
      notify.error('Error al cargar las etiquetas')
    } finally {
      setCargandoEtiquetas(false)
    }
  }

  const cargarGuias = async (etiqueta: string) => {
    setCargandoGuias(true)
    try {
      const guiasList = await listasEtiquetadasService.findByEtiqueta(etiqueta)
      setGuias(guiasList ?? [])
    } catch (error: any) {
      notify.error('Error al cargar las guías')
    } finally {
      setCargandoGuias(false)
    }
  }

  // Filtrar guías por búsqueda, receptado y fecha
  const guiasFiltradas = useMemo(() => {
    let list = guias

    // Filtro por número de guía
    if (busquedaGuia.trim()) {
      const term = busquedaGuia.trim().toUpperCase()
      list = list.filter(g => (g.numeroGuia || '').toUpperCase().includes(term))
    }

    // Filtro receptados / sin receptar (por presencia de fechaRecepcion)
    if (filtroReceptado === 'RECEPTADOS') {
      list = list.filter(g => g.fechaRecepcion != null && g.fechaRecepcion !== '')
    } else if (filtroReceptado === 'SIN_RECEPTAR') {
      list = list.filter(g => !g.fechaRecepcion || g.fechaRecepcion === '')
    }

    // Filtro por rango de fecha de recepción
    if (fechaDesde || fechaHasta) {
      list = list.filter(g => {
        if (!g.fechaRecepcion) return false
        const d = new Date(g.fechaRecepcion)
        d.setHours(0, 0, 0, 0)
        if (fechaDesde) {
          const desde = new Date(fechaDesde)
          desde.setHours(0, 0, 0, 0)
          if (d < desde) return false
        }
        if (fechaHasta) {
          const hasta = new Date(fechaHasta)
          hasta.setHours(23, 59, 59, 999)
          if (d > hasta) return false
        }
        return true
      })
    }

    return list
  }, [guias, busquedaGuia, filtroReceptado, fechaDesde, fechaHasta])

  const handleExportar = async () => {
    setExportando(true)
    const toastId = notify.start('Generando Excel...')
    try {
      const blob = await listasEtiquetadasService.exportExcel(etiquetaSeleccionada || undefined)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `listas-etiquetadas${etiquetaSeleccionada ? `-${etiquetaSeleccionada}` : ''}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      notify.finish(toastId, 'Excel descargado')
    } catch (error: any) {
      notify.fail(toastId, error?.message || 'Error al exportar')
    } finally {
      setExportando(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSeleccionados(new Set(guiasFiltradas.map(g => g.idPaquete!).filter(Boolean)))
    } else {
      setSeleccionados(new Set())
    }
  }

  const aplicarPegarLista = () => {
    const lineas = listaPegadaTexto
      .split(/[\n,]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
    const numerosUnicos = Array.from(new Set(lineas))
    if (numerosUnicos.length === 0) {
      notify.error('No se encontraron números de guía en la lista')
      return
    }
    const mapaGuiaAId = new Map(guias.map(g => [g.numeroGuia?.toUpperCase() ?? '', g.idPaquete!]))
    const idsEncontrados: number[] = []
    numerosUnicos.forEach(num => {
      const id = mapaGuiaAId.get(num)
      if (id != null) idsEncontrados.push(id)
    })
    setSeleccionados(new Set(idsEncontrados))
    setMostrarPegarLista(false)
    setListaPegadaTexto('')
    if (idsEncontrados.length === 0) {
      notify.warning('Ninguna guía de la lista pertenece a esta etiqueta')
    } else if (idsEncontrados.length < numerosUnicos.length) {
      notify.info(`${idsEncontrados.length} guía(s) seleccionadas. ${numerosUnicos.length - idsEncontrados.length} no encontradas en esta etiqueta.`)
    } else {
      notify.success(`${idsEncontrados.length} guía(s) seleccionadas`)
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(seleccionados)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSeleccionados(newSet)
  }

  const todosSeleccionados = guiasFiltradas.length > 0 && guiasFiltradas.every(g => g.idPaquete != null && seleccionados.has(g.idPaquete))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Listas por etiqueta</CardTitle>
          <CardDescription>
            Elija una etiqueta para ver guías, buscar o cambiar instrucciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select
              value={etiquetaSeleccionada}
              onValueChange={(v) => setEtiquetaSeleccionada(v === 'none' ? '' : v)}
              disabled={cargandoEtiquetas}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecciona una etiqueta" />
              </SelectTrigger>
              <SelectContent>
                {etiquetas.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {cargandoEtiquetas ? 'Cargando...' : 'No hay etiquetas disponibles'}
                  </SelectItem>
                ) : (
                  etiquetas.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={cargarEtiquetas}
              disabled={cargandoEtiquetas}
            >
              <RefreshCw className={`h-4 w-4 ${cargandoEtiquetas ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {cargandoGuias ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : etiquetaSeleccionada && guias.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">
                  {guiasFiltradas.length} de {guias.length} guía(s) con etiqueta <Badge variant="outline">{etiquetaSeleccionada}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Receptado</Label>
                    <Select value={filtroReceptado} onValueChange={(v) => setFiltroReceptado(v as typeof filtroReceptado)}>
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        <SelectItem value="RECEPTADOS">Receptados</SelectItem>
                        <SelectItem value="SIN_RECEPTAR">Sin receptar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fecha-desde" className="text-xs text-muted-foreground whitespace-nowrap">Desde</Label>
                    <DatePickerForm
                      id="fecha-desde"
                      value={fechaDesde}
                      onChange={setFechaDesde}
                      inline
                      className="w-[140px] h-8"
                      disabled={filtroReceptado === 'SIN_RECEPTAR'}
                      title={filtroReceptado === 'SIN_RECEPTAR' ? 'Solo aplica a guías receptadas' : undefined}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fecha-hasta" className="text-xs text-muted-foreground whitespace-nowrap">Hasta</Label>
                    <DatePickerForm
                      id="fecha-hasta"
                      value={fechaHasta}
                      onChange={setFechaHasta}
                      inline
                      className="w-[140px] h-8"
                      disabled={filtroReceptado === 'SIN_RECEPTAR'}
                      title={filtroReceptado === 'SIN_RECEPTAR' ? 'Solo aplica a guías receptadas' : undefined}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Label htmlFor="buscar-guia" className="text-xs text-muted-foreground whitespace-nowrap">Buscar guía</Label>
                    <Input
                      id="buscar-guia"
                      placeholder="Número de guía..."
                      value={busquedaGuia}
                      onChange={(e) => setBusquedaGuia(e.target.value)}
                      className="max-w-[220px] h-8 font-mono text-sm"
                    />
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          className="translate-y-[2px]"
                          checked={todosSeleccionados}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableHead>
                      <TableHead>Número de Guía</TableHead>
                      <TableHead>Etiqueta</TableHead>
                      <TableHead>Estado guía</TableHead>
                      <TableHead>Instrucción</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Fecha recepción</TableHead>
                      <TableHead>Fecha envío</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guiasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Ninguna guía coincide con la búsqueda
                        </TableCell>
                      </TableRow>
                    ) : (
                      guiasFiltradas.map((guia) => (
                        <TableRow key={guia.idPaquete ?? guia.numeroGuia}>
                          <TableCell>
                            <input
                              type="checkbox"
                              className="translate-y-[2px]"
                              checked={guia.idPaquete != null && seleccionados.has(guia.idPaquete)}
                              onChange={(e) => handleSelectOne(guia.idPaquete!, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell className="font-mono">{guia.numeroGuia}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{guia.ref ?? '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            {guia.estado ? <Badge variant="secondary" className="text-[10px]">{guia.estado}</Badge> : '-'}
                          </TableCell>
                          <TableCell>
                            {guia.observaciones?.includes('Instrucción:') ? <span className="text-xs">{guia.observaciones}</span> : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {guia.fechaRegistro
                              ? new Date(guia.fechaRegistro).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {guia.fechaRecepcion
                              ? new Date(guia.fechaRecepcion).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">-</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : etiquetaSeleccionada ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay guías asignadas a la etiqueta <Badge variant="outline">{etiquetaSeleccionada}</Badge>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecciona una etiqueta para ver las guías asignadas
            </div>
          )}

          {/* Barra de Acciones Masivas */}
          {etiquetaSeleccionada && guias.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-muted/30 border rounded-md animate-in fade-in flex-wrap gap-2">
              <span className="text-sm font-medium ml-2">
                {seleccionados.size > 0 ? `${seleccionados.size} seleccionados` : 'Marque filas en la tabla o use «Pegar lista» para actuar sobre varias guías.'}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarPegarLista(true)}
                  className="gap-1.5"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Pegar lista
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 py-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Exportar:</span>
              <Button variant="outline" size="sm" onClick={handleExportar} disabled={exportando || cargandoEtiquetas} className="gap-1.5 h-8">
                {exportando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo Pegar lista */}
      <Dialog open={mostrarPegarLista} onOpenChange={(open) => !open && (setMostrarPegarLista(false), setListaPegadaTexto(''))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pegar lista de guías</DialogTitle>
            <DialogDescription>
              Pega una lista de números de guía (uno por línea o separados por coma). Se seleccionarán las que pertenezcan a la etiqueta actual.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="ECA7800012345&#10;ECA7800067890&#10;..."
              value={listaPegadaTexto}
              onChange={(e) => setListaPegadaTexto(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMostrarPegarLista(false); setListaPegadaTexto('') }}>Cancelar</Button>
            <Button onClick={aplicarPegarLista}>Aplicar y seleccionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
