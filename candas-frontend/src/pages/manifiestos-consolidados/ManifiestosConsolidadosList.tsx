import { useState, useMemo } from 'react'
import { useManifiestosConsolidados, useManifiestoConsolidado, useDeleteManifiestoConsolidado } from '@/hooks/useManifiestosConsolidados'
import { useQuery } from '@tanstack/react-query'
import { manifiestoConsolidadoService } from '@/lib/api/manifiesto-consolidado.service'
import type { ManifiestoConsolidadoDetalle } from '@/types/manifiesto-consolidado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Printer, Eye, Trash2, FileSpreadsheet, FileText, MoreHorizontal, Calendar, ArrowRight, User, Clock, Package, Mail, Briefcase } from 'lucide-react'
import GenerarManifiestoConsolidadoDialog from './GenerarManifiestoConsolidadoDialog'
import ExportarExcelDialog from './ExportarExcelDialog'
import SeleccionarTipoImpresionDialog from '@/components/manifiestos-consolidados/SeleccionarTipoImpresionDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { toast } from 'sonner'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { ListPagination } from '@/components/list/ListPagination'
import { Badge } from '@/components/ui/badge'

const formatearFecha = (fecha: string) => {
  const date = new Date(fecha)
  const dia = date.getDate().toString().padStart(2, '0')
  const mes = (date.getMonth() + 1).toString().padStart(2, '0')
  const anio = date.getFullYear()
  const horas = date.getHours().toString().padStart(2, '0')
  const minutos = date.getMinutes().toString().padStart(2, '0')
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`
}

const PeriodoCell = ({ periodo }: { periodo: string }) => {
  const match = periodo.match(/Del (\d{2}\/\d{2}\/\d{4}) al (\d{2}\/\d{2}\/\d{4})/)

  if (match) {
    const [_, inicio, fin] = match
    if (inicio === fin) {
      return (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fecha Única</span>
            <span className="text-xs font-medium">{inicio}</span>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{inicio}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium">{fin}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/60">Rango de fechas</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
        <Calendar className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <span className="text-xs font-medium">{periodo}</span>
    </div>
  )
}

export default function ManifiestosConsolidadosList() {
  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarDialogGenerar, setMostrarDialogGenerar] = useState(false)
  const [manifiestoDetalle, setManifiestoDetalle] = useState<number | null>(null)
  const [manifiestoAEliminar, setManifiestoAEliminar] = useState<number | null>(null)
  const [mostrarExportarExcel, setMostrarExportarExcel] = useState(false)
  const [mostrarDialogImpresion, setMostrarDialogImpresion] = useState(false)
  const [manifiestoParaAccion, setManifiestoParaAccion] = useState<ManifiestoConsolidadoDetalle | null>(null)

  const { data, isLoading, error } = useManifiestosConsolidados(page, size)
  const { data: manifiestoDetalleData, isLoading: loadingDetalle } = useManifiestoConsolidado(manifiestoDetalle ?? undefined)
  const deleteMutation = useDeleteManifiestoConsolidado()

  const handleDelete = async () => {
    if (manifiestoAEliminar) {
      try {
        await deleteMutation.mutateAsync(manifiestoAEliminar)
        setManifiestoAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const { data: manifiestosBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['manifiestos-consolidados', 'search', busqueda],
    queryFn: () => manifiestoConsolidadoService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const manifiestosFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return manifiestosBusqueda || []
    }
    return data?.content || []
  }, [busqueda, manifiestosBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  const abrirAccion = async (id: number, accion: 'excel' | 'imprimir') => {
    try {
      const detalles = await manifiestoConsolidadoService.findById(id)
      setManifiestoParaAccion(detalles)
      if (accion === 'excel') {
        setMostrarExportarExcel(true)
      } else {
        setMostrarDialogImpresion(true)
      }
    } catch {
      toast.error('Error al obtener los detalles del manifiesto')
    }
  }

  const abrirAccionDesdeDetalle = (accion: 'excel' | 'imprimir') => {
    if (!manifiestoDetalleData) return
    setManifiestoParaAccion(manifiestoDetalleData)
    if (accion === 'excel') {
      setMostrarExportarExcel(true)
    } else {
      setMostrarDialogImpresion(true)
    }
  }

  return (
    <PageContainer width="full" spacing="0" className="w-full flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0">
        <PageHeader
          className="pb-0 border-b-0"
          icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></div>}
          title="Manifiestos Consolidados"
          subtitle="Gestión de manifiestos y reportes"
          actions={
            <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.GENERAR}>
              <Button onClick={() => setMostrarDialogGenerar(true)} size="sm" className="h-8 shadow-sm text-xs rounded-lg">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Generar Manifiesto
              </Button>
            </ProtectedByPermission>
          }
        />
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-muted/5 flex items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por número de manifiesto, agencia..."
            className="h-9 w-full pl-9 pr-4 text-sm bg-background border-border/40 rounded-lg focus-visible:ring-primary/20 shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline-block">
          <span className="font-medium text-foreground">{manifiestosFiltrados.length}</span> resultados
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto">
          <Table className="notion-table w-full relative">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-4 w-40">Manifiesto</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Agencia</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-48">Período</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha / Usuario</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Totales</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6 w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || loadingBusqueda) ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
                      <span className="text-sm">Cargando datos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-destructive">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-6 w-6 opacity-50" />
                      <span className="text-sm">Error al cargar manifiestos</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : manifiestosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto p-8">
                      <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-foreground">No hay manifiestos</h3>
                        <p className="text-xs text-muted-foreground">
                          {busqueda.trim().length > 0
                            ? `No se encontraron resultados para "${busqueda}"`
                            : "Aún no se han generado manifiestos consolidados. Comienza creando uno nuevo."}
                        </p>
                      </div>
                      {busqueda.trim().length === 0 && (
                        <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.GENERAR}>
                          <Button onClick={() => setMostrarDialogGenerar(true)} variant="outline" size="sm" className="mt-1 rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Generar Ahora
                          </Button>
                        </ProtectedByPermission>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                manifiestosFiltrados.map((manifiesto) => (
                  <TableRow key={manifiesto.idManifiestoConsolidado} className="group hover:bg-muted/20 border-b border-border/30 last:border-0 transition-colors duration-150">
                    <TableCell className="pl-4 py-3 align-top">
                      <div className="font-mono text-xs font-semibold text-foreground bg-muted/30 px-2.5 py-1 rounded-md w-fit border border-border/20">
                        {manifiesto.numeroManifiesto || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground">{manifiesto.nombreAgencia}</span>
                        <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {manifiesto.codigoAgencia} {manifiesto.cantonAgencia && `• ${manifiesto.cantonAgencia}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <PeriodoCell periodo={manifiesto.periodo} />
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="text-xs font-medium tabular-nums">{formatearFecha(manifiesto.fechaGeneracion)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground bg-muted/40 hover:bg-muted/40 w-fit border-0 rounded-md">
                            {manifiesto.usuarioGenerador}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top text-xs">
                      <div className="flex gap-1.5">
                        <div className="flex flex-col items-center justify-center bg-blue-50/80 dark:bg-blue-900/10 px-2 py-1.5 rounded-lg border border-blue-100/60 dark:border-blue-900/20 min-w-[3.5rem] hover:bg-blue-100/80 dark:hover:bg-blue-900/20 transition-colors">
                          <span className="font-bold text-blue-700 dark:text-blue-400 text-sm tabular-nums">{manifiesto.totalDespachos}</span>
                          <div className="flex items-center gap-1 text-[9px] text-blue-600/60 dark:text-blue-400/60 uppercase font-bold">
                            <Mail className="h-2.5 w-2.5" />
                            <span>Desp.</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-amber-50/80 dark:bg-amber-900/10 px-2 py-1.5 rounded-lg border border-amber-100/60 dark:border-amber-900/20 min-w-[3.5rem] hover:bg-amber-100/80 dark:hover:bg-amber-900/20 transition-colors">
                          <span className="font-bold text-amber-700 dark:text-amber-400 text-sm tabular-nums">{manifiesto.totalSacas}</span>
                          <div className="flex items-center gap-1 text-[9px] text-amber-600/60 dark:text-amber-400/60 uppercase font-bold">
                            <Briefcase className="h-2.5 w-2.5" />
                            <span>Sacas</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-emerald-50/80 dark:bg-emerald-900/10 px-2 py-1.5 rounded-lg border border-emerald-100/60 dark:border-emerald-900/20 min-w-[3.5rem] hover:bg-emerald-100/80 dark:hover:bg-emerald-900/20 transition-colors">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm tabular-nums">{manifiesto.totalPaquetes}</span>
                          <div className="flex items-center gap-1 text-[9px] text-emerald-600/60 dark:text-emerald-400/60 uppercase font-bold">
                            <Package className="h-2.5 w-2.5" />
                            <span>Paq.</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top text-right pr-4">
                      <ProtectedByPermission permissions={[PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER, PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.IMPRIMIR, PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/50">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER}>
                              <DropdownMenuItem onClick={() => setManifiestoDetalle(manifiesto.idManifiestoConsolidado)}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER}>
                              <DropdownMenuItem onClick={() => abrirAccion(manifiesto.idManifiestoConsolidado, 'excel')}>
                                <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Exportar Excel
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.IMPRIMIR}>
                              <DropdownMenuItem onClick={() => abrirAccion(manifiesto.idManifiestoConsolidado, 'imprimir')}>
                                <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir / Descargar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setManifiestoAEliminar(manifiesto.idManifiestoConsolidado)} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ProtectedByPermission>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {busqueda.trim().length === 0 && (
        <ListPagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={data?.totalElements}
          size={size}
          onPageChange={setPage}
          className="px-4 pb-2"
        />
      )}

      {/* Dialogs */}
      <GenerarManifiestoConsolidadoDialog
        open={mostrarDialogGenerar}
        onOpenChange={setMostrarDialogGenerar}
      />

      {/* Detail Dialog */}
      <Dialog open={!!manifiestoDetalle} onOpenChange={(open) => !open && setManifiestoDetalle(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border-border/50 p-0 gap-0">
          <DialogHeader className="p-6 border-b border-border/30 bg-gradient-to-b from-muted/20 to-transparent">
            <DialogTitle className="text-lg">Detalles del Manifiesto</DialogTitle>
            <DialogDescription>
              Información completa del manifiesto consolidado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto flex items-center justify-center text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">{manifiestoDetalleData?.numeroManifiesto}</h3>
              <p className="text-sm text-muted-foreground">AGENCIA: {manifiestoDetalleData?.nombreAgencia}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30 px-4">
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/40 dark:border-blue-900/20">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">{manifiestoDetalleData?.totales.totalDespachos}</div>
                <div className="text-[10px] text-blue-600/60 dark:text-blue-400/60 uppercase tracking-wider font-bold mt-1">Despachos</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/40 dark:border-amber-900/20">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{manifiestoDetalleData?.totales.totalSacas}</div>
                <div className="text-[10px] text-amber-600/60 dark:text-amber-400/60 uppercase tracking-wider font-bold mt-1">Sacas</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/40 dark:border-emerald-900/20">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{manifiestoDetalleData?.totales.totalPaquetes}</div>
                <div className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-wider font-bold mt-1">Paquetes</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60 mt-2 italic">
              Para ver el detalle completo, genere el archivo Excel o imprima el reporte.
            </p>
          </div>
          <DialogFooter className="p-4 border-t border-border/20 bg-muted/5 gap-2">
            <Button variant="outline" onClick={() => setManifiestoDetalle(null)} className="rounded-lg">
              Cerrar
            </Button>
            <Button
              variant="outline"
              onClick={() => abrirAccionDesdeDetalle('excel')}
              disabled={loadingDetalle || !manifiestoDetalleData}
              className="rounded-lg"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button
              onClick={() => abrirAccionDesdeDetalle('imprimir')}
              disabled={loadingDetalle || !manifiestoDetalleData}
              className="rounded-lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!manifiestoAEliminar} onOpenChange={(open) => !open && setManifiestoAEliminar(null)}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este manifiesto consolidado? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManifiestoAEliminar(null)} disabled={deleteMutation.isPending} className="rounded-lg">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mostrarExportarExcel && manifiestoParaAccion && (
        <ExportarExcelDialog
          manifiesto={manifiestoParaAccion}
          open={mostrarExportarExcel}
          onOpenChange={(open) => {
            setMostrarExportarExcel(open)
            if (!open) setManifiestoParaAccion(null)
          }}
        />
      )}

      {mostrarDialogImpresion && manifiestoParaAccion && (
        <SeleccionarTipoImpresionDialog
          manifiesto={manifiestoParaAccion}
          open={mostrarDialogImpresion}
          onOpenChange={(open) => {
            setMostrarDialogImpresion(open)
            if (!open) setManifiestoParaAccion(null)
          }}
        />
      )}
    </PageContainer>
  )
}
