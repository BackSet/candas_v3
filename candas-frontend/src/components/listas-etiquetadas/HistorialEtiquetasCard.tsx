import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePickerForm } from '@/components/ui/date-time-picker'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { Loader2, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, ShieldAlert, CheckCircle2, Send } from 'lucide-react'
import { notify } from '@/lib/notify'
import type { Paquete } from '@/types/paquete'
import { Badge } from '@/components/ui/badge'
import { obtenerColorEtiqueta } from '@/utils/coloresEtiquetas'
import { cn } from '@/lib/utils'

export default function HistorialEtiquetasCard() {
    const [page, setPage] = useState(0)
    const [size] = useState(20)
    const [fechaInicio, setFechaInicio] = useState<string>('')
    const [fechaFin, setFechaFin] = useState<string>('')
    const [etiquetaFiltro, setEtiquetaFiltro] = useState<string>('TODAS')
    const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [rawList, setRawList] = useState<Paquete[]>([])

    // Cargar etiquetas disponibles
    useEffect(() => {
        listasEtiquetadasService.getAllEtiquetas().then(setEtiquetasDisponibles).catch(console.error)
    }, [])

    // Cargar datos cuando cambian los filtros
    useEffect(() => {
        loadData()
    }, [fechaInicio, fechaFin, etiquetaFiltro])

    const loadData = async () => {
        setLoading(true)
        try {
            const list = etiquetaFiltro === 'TODAS'
                ? await listasEtiquetadasService.getHistorialReceptados()
                : await listasEtiquetadasService.findByEtiqueta(etiquetaFiltro)
            setRawList(list ?? [])
        } catch (error) {
            console.error('Error al cargar historial:', error)
            notify.error('Error al cargar el historial')
        } finally {
            setLoading(false)
        }
    }

    // Filtrar por fechas y paginar en cliente
    const filtered = React.useMemo(() => {
        let list = rawList
        if (fechaInicio) {
            const desde = new Date(fechaInicio).getTime()
            list = list.filter(p => p.fechaRecepcion && new Date(p.fechaRecepcion).getTime() >= desde)
        }
        if (fechaFin) {
            const hasta = new Date(fechaFin).setHours(23, 59, 59, 999)
            list = list.filter(p => p.fechaRecepcion && new Date(p.fechaRecepcion).getTime() <= hasta)
        }
        return list
    }, [rawList, fechaInicio, fechaFin])
    const totalElements = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalElements / size))
    const content = filtered.slice(page * size, page * size + size)

    const handleLimpiarFiltros = () => {
        setFechaInicio('')
        setFechaFin('')
        setEtiquetaFiltro('TODAS')
        setPage(0)
    }

    const currentPage = page

    return (
        <Card className="h-full flex flex-col border-0 shadow-none">
            <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Historial de Recepción</CardTitle>
                        <CardDescription>
                            Paquetes recibidos y etiquetados.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap items-end gap-3 pt-4 border-t mt-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Fecha Inicio</label>
                        <DatePickerForm
                            value={fechaInicio}
                            onChange={(v) => {
                                setFechaInicio(v)
                                setPage(0)
                            }}
                            inline
                            className="h-8 text-xs w-[140px]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Fecha Fin</label>
                        <DatePickerForm
                            value={fechaFin}
                            onChange={(v) => {
                                setFechaFin(v)
                                setPage(0)
                            }}
                            inline
                            className="h-8 text-xs w-[140px]"
                        />
                    </div>
                    <div className="space-y-1 min-w-[140px]">
                        <label className="text-xs font-medium text-muted-foreground">Etiqueta</label>
                        <Select
                            value={etiquetaFiltro}
                            onValueChange={(val) => {
                                setEtiquetaFiltro(val)
                                setPage(0)
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODAS">Todas</SelectItem>
                                {etiquetasDisponibles.map(et => (
                                    <SelectItem key={et} value={et}>{et}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(fechaInicio || fechaFin || etiquetaFiltro !== 'TODAS') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLimpiarFiltros}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 px-0 pb-0 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Fecha Recepción</TableHead>
                                <TableHead>Número de Guía</TableHead>
                                <TableHead>Etiqueta</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Instrucción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : content.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No se encontraron registros en el historial con los filtros seleccionados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                content.map((item) => {
                                    const instruccion = item.observaciones?.includes('Instrucción: RETENER') ? 'RETENER'
                                        : item.observaciones?.includes('Instrucción: PREGUNTAR') ? 'PREGUNTAR'
                                        : item.observaciones?.includes('Instrucción: ATENCION') ? 'ATENCION'
                                        : null
                                    return (
                                    <TableRow key={item.idPaquete ?? item.numeroGuia}>
                                        <TableCell className="font-mono text-xs">
                                            {item.fechaRecepcion ? new Date(item.fechaRecepcion).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium font-mono">
                                            {item.numeroGuia}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="font-bold"
                                                style={{
                                                    backgroundColor: obtenerColorEtiqueta(item.ref ?? '').bgLight,
                                                    color: obtenerColorEtiqueta(item.ref ?? '').text,
                                                    borderColor: obtenerColorEtiqueta(item.ref ?? '').border
                                                }}
                                            >
                                                {item.ref ?? '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.estado === 'RECIBIDO' ? (
                                                <div className="flex items-center gap-1.5 text-success text-xs font-medium">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    RECIBIDO
                                                </div>
                                            ) : item.estado === 'DESPACHADO' ? (
                                                <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
                                                    <Send className="h-3.5 w-3.5" />
                                                    DESPACHADO
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{item.estado || '-'}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {instruccion === 'RETENER' && (
                                                <Badge variant="destructive" className="items-center gap-1">
                                                    <ShieldAlert className="h-3 w-3" /> RETENER
                                                </Badge>
                                            )}
                                            {instruccion === 'PREGUNTAR' && (
                                                <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 items-center gap-1 text-black">
                                                    <AlertTriangle className="h-3 w-3" /> PREGUNTAR
                                                </Badge>
                                            )}
                                            {instruccion === 'ATENCION' && (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> ATENCIÓN
                                                </Badge>
                                            )}
                                            {!instruccion && (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t py-4">
                        <div className="text-xs text-muted-foreground">
                            Mostrando <strong>{page * size + 1}</strong> -{' '}
                            <strong>{Math.min((page + 1) * size, totalElements)}</strong> de{' '}
                            <strong>{totalElements}</strong> registros
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPage(0)}
                                disabled={page === 0}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center justify-center min-w-[3rem] text-sm font-medium">
                                {page + 1} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPage(totalPages - 1)}
                                disabled={page >= totalPages - 1}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
