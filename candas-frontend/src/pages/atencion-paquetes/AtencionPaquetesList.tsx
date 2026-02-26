import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAtencionPaquetes, useAtencionPaquetesPendientes, useDeleteAtencionPaquete } from '@/hooks/useAtencionPaquetes'
import { useFiltersStore } from '@/stores/filtersStore'
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
import { Checkbox } from '@/components/ui/checkbox'
import { EstadoAtencion, getTipoProblemaLabel } from '@/types/atencion-paquete'
import { Eye, Edit, Trash2, Plus, Printer, Loader2, CheckCircle, MoreHorizontal, Search, Filter, AlertCircle, Package, Calendar, Clock, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { paqueteService } from '@/lib/api/paquete.service'
import { imprimirAtencionPaquetes } from '@/utils/imprimirAtencionPaquetes'
import type { Paquete } from '@/types/paquete'
import ResolverDialog from './ResolverDialog'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { ListPagination } from '@/components/list/ListPagination'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'

export default function AtencionPaquetesList() {
  const navigate = useNavigate()
  const LIST_KEY = 'atencion-paquetes' as const
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, filtroEstado = 'all', search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setFiltroEstado = (v: string) => setFiltersAction(LIST_KEY, { filtroEstado: v, page: 0 })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })

  const [soloPendientes, setSoloPendientes] = useState(false)
  const [atencionAEliminar, setAtencionAEliminar] = useState<number | null>(null)
  const [atencionParaSolucion, setAtencionParaSolucion] = useState<number | null>(null)
  const [atencionesSeleccionadas, setAtencionesSeleccionadas] = useState<Set<number>>(new Set())
  const [exportando, setExportando] = useState(false)

  const estadoParam = soloPendientes ? EstadoAtencion.PENDIENTE : (filtroEstado !== 'all' ? filtroEstado : undefined)
  const { data, isLoading } = useAtencionPaquetes(page, size, estadoParam, busqueda.trim() || undefined)
  const { data: pendientes } = useAtencionPaquetesPendientes()
  const deleteMutation = useDeleteAtencionPaquete()

  const handleDelete = async () => {
    if (atencionAEliminar) {
      try {
        await deleteMutation.mutateAsync(atencionAEliminar)
        setAtencionAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const atencionesFiltradas = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setAtencionesSeleccionadas(new Set(atencionesFiltradas.map(a => a.idAtencion!)))
    } else {
      setAtencionesSeleccionadas(new Set())
    }
  }

  const handleSelectAtencion = (idAtencion: number, checked: boolean) => {
    const nuevos = new Set(atencionesSeleccionadas)
    checked ? nuevos.add(idAtencion) : nuevos.delete(idAtencion)
    setAtencionesSeleccionadas(nuevos)
  }

  const handleExportarSeleccionadas = async () => {
    const atencionesParaExportar = atencionesFiltradas.filter(a =>
      atencionesSeleccionadas.has(a.idAtencion!)
    )
    if (atencionesParaExportar.length === 0) { toast.error('No hay atenciones seleccionadas'); return }
    setExportando(true)
    try {
      const paquetesPromises = atencionesParaExportar.map(atencion =>
        paqueteService.findById(atencion.idPaquete).catch(() => ({
          idPaquete: atencion.idPaquete,
          numeroGuia: atencion.numeroGuia,
        } as Paquete))
      )
      const paquetes = await Promise.all(paquetesPromises)
      const paquetesMap = new Map<number, Paquete>()
      paquetes.forEach(p => { if (p.idPaquete) paquetesMap.set(p.idPaquete, p) })

      const paquetesClementina = paquetes.filter(p => p.tipoPaquete === 'CLEMENTINA' && p.idPaquete)
      const hijosPromises = paquetesClementina.map(paquete =>
        paqueteService.findHijos(paquete.idPaquete!).then(hijos => ({
          idPaquetePadre: paquete.idPaquete!, hijos
        })).catch(() => ({ idPaquetePadre: paquete.idPaquete!, hijos: [] as Paquete[] }))
      )
      const hijosResultados = await Promise.all(hijosPromises)
      const hijosMap = new Map<number, Paquete[]>()
      hijosResultados.forEach(({ idPaquetePadre, hijos }) => {
        hijosMap.set(idPaquetePadre, hijos)
        hijos.forEach(hijo => { if (hijo.idPaquete) paquetesMap.set(hijo.idPaquete, hijo) })
      })

      imprimirAtencionPaquetes(atencionesParaExportar, paquetesMap, hijosMap)
      toast.success(`Se generó el PDF con ${atencionesParaExportar.length} paquete(s) para impresión`)
    } catch (error: any) {
      toast.error(error.message || 'Error al exportar los paquetes')
    } finally {
      setExportando(false)
    }
  }

  const todosSeleccionados = atencionesFiltradas.length > 0 &&
    atencionesFiltradas.every(a => atencionesSeleccionadas.has(a.idAtencion!))

  return (
    <PageContainer width="full" spacing="0" className="w-full flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0">
        <PageHeader
          className="pb-0 border-b-0"
          icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-primary" /></div>}
          title="Atención Paquetes"
          subtitle="Gestión de incidencias y problemas"
          actions={
            <div className="flex gap-2">
              {atencionesSeleccionadas.size > 0 && (
                <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportarSeleccionadas}
                    disabled={exportando}
                    className="h-8 text-xs shadow-sm rounded-lg border-dashed"
                  >
                    {exportando ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generando...</>
                    ) : (
                      <><Printer className="h-3.5 w-3.5 mr-1.5" />Imprimir ({atencionesSeleccionadas.size})</>
                    )}
                  </Button>
                </ProtectedByPermission>
              )}
              <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.CREAR}>
                <Button onClick={() => navigate({ to: '/atencion-paquetes/new' })} size="sm" className="h-8 shadow-sm text-xs rounded-lg">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nueva Solicitud
                </Button>
              </ProtectedByPermission>
            </div>
          }
        />
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-muted/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por guía, motivo o tipo..."
            className="h-9 w-full pl-9 pr-4 text-sm bg-background border-border/40 rounded-lg focus-visible:ring-primary/20 shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-background border border-border/40 rounded-lg p-0.5 h-9 shadow-sm">
            <button
              onClick={() => setSoloPendientes(false)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                !soloPendientes ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >Todos</button>
            <button
              onClick={() => setSoloPendientes(true)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5",
                soloPendientes ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pendientes
              {pendientes && pendientes.length > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
                  {pendientes.length}
                </span>
              )}
            </button>
          </div>

          <Select value={soloPendientes ? EstadoAtencion.PENDIENTE : filtroEstado} onValueChange={(v) => { setSoloPendientes(false); setFiltroEstado(v) }}>
            <SelectTrigger className="h-9 w-[150px] text-xs bg-background border-border/40 shadow-sm rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
                <SelectValue placeholder="Estado" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value={EstadoAtencion.PENDIENTE}>Pendiente</SelectItem>
              <SelectItem value={EstadoAtencion.EN_REVISION}>En revisión</SelectItem>
              <SelectItem value={EstadoAtencion.RESUELTO}>Resuelto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto">
          <Table className="notion-table w-full relative">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-10 pl-4 h-10">
                  <Checkbox checked={todosSeleccionados} onCheckedChange={handleSelectAll} aria-label="Seleccionar todas" />
                </TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-4">Guía / Paquete</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Motivo</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-32">Tipo</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-28">Estado</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-40">Fecha</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right pr-6 w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
                      <span className="text-sm">Cargando datos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : atencionesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto p-8">
                      <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-foreground">No hay solicitudes</h3>
                        <p className="text-xs text-muted-foreground">
                          {busqueda.trim().length > 0
                            ? `No se encontraron resultados para "${busqueda}"`
                            : "No hay solicitudes de atención que coincidan con los filtros."}
                        </p>
                      </div>
                      {busqueda.trim().length === 0 && (
                        <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.CREAR}>
                          <Button onClick={() => navigate({ to: '/atencion-paquetes/new' })} variant="outline" size="sm" className="mt-1 rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Nueva Solicitud
                          </Button>
                        </ProtectedByPermission>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                atencionesFiltradas.map((atencion) => (
                  <TableRow key={atencion.idAtencion} className="group hover:bg-muted/20 border-b border-border/30 last:border-0 transition-colors duration-150">
                    <TableCell className="pl-4 py-3 align-top w-10">
                      <Checkbox
                        checked={atencionesSeleccionadas.has(atencion.idAtencion!)}
                        onCheckedChange={(checked) => handleSelectAtencion(atencion.idAtencion!, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="h-4 w-4 text-primary/70" />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="font-mono text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                            onClick={() => navigate({ to: `/atencion-paquetes/${atencion.idAtencion}` })}
                          >
                            {atencion.numeroGuia || `#${atencion.idPaquete}`}
                          </span>
                          {atencion.numeroGuia && (
                            <span className="text-[10px] text-muted-foreground/60 mt-0.5">ID: {atencion.idPaquete}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex items-start gap-2 max-w-[300px]">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground line-clamp-2" title={atencion.motivo}>{atencion.motivo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground bg-muted/30 border-border/40 px-2 py-0.5 rounded-md">
                        {getTipoProblemaLabel(atencion.tipoProblema)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <StatusBadge
                        label={atencion.estado}
                        variant={
                          atencion.estado === EstadoAtencion.RESUELTO ? 'completed'
                            : atencion.estado === EstadoAtencion.PENDIENTE ? 'pending'
                              : 'in-progress'
                        }
                      />
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 opacity-50" />
                        <span>{atencion.fechaSolicitud ? new Date(atencion.fechaSolicitud).toLocaleDateString() : '-'}</span>
                      </div>
                      {atencion.fechaSolicitud && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mt-1 ml-5.5">
                          <Clock className="h-3 w-3 opacity-50" />
                          <span>{new Date(atencion.fechaSolicitud).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 align-top text-right pr-4">
                      <ProtectedByPermission permissions={[PERMISSIONS.ATENCION_PAQUETES.VER, PERMISSIONS.ATENCION_PAQUETES.EDITAR, PERMISSIONS.ATENCION_PAQUETES.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/atencion-paquetes/${atencion.idAtencion}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
                              <DropdownMenuItem onClick={() => setAtencionParaSolucion(atencion.idAtencion!)}>
                                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Resolver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate({ to: `/atencion-paquetes/${atencion.idAtencion}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setAtencionAEliminar(atencion.idAtencion!)} className="text-destructive focus:text-destructive">
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
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!atencionAEliminar} onOpenChange={(open) => !open && setAtencionAEliminar(null)}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta solicitud de atención? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtencionAEliminar(null)} disabled={deleteMutation.isPending} className="rounded-lg">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {atencionParaSolucion && (
        <ResolverDialog
          atencionId={atencionParaSolucion}
          open={!!atencionParaSolucion}
          onOpenChange={(open) => !open && setAtencionParaSolucion(null)}
          allowEstadoChange
        />
      )}
    </PageContainer>
  )
}
