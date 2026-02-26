import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useFiltersStore } from '@/stores/filtersStore'
import { usePaquetes, useDeletePaquete } from '@/hooks/usePaquetes'
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
import { EstadoPaquete, TipoPaquete } from '@/types/paquete'

import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Upload,
  Printer,
  Package,
  MoreHorizontal,
  PackagePlus,
  PackageMinus,
  Link2,
  Loader2,
  Tag,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import ImportarPaquetesDialog from './ImportarPaquetesDialog'
import ImportarRefDialog from './ImportarRefDialog'
import ImportarActualizarPaquetesDialog from './ImportarActualizarPaquetesDialog'
import ImportarPaquetesEspecialesMiamiDialog from './ImportarPaquetesEspecialesMiamiDialog'
import AsociarClementinaLoteDialog from './AsociarClementinaLoteDialog'
import AsociarCadenitaDialog from './AsociarCadenitaDialog'
import AsociarSepararDialog from './AsociarSepararDialog'
import ImprimirPaqueteDialog, { type ModoImpresionPaquete } from '@/components/paquetes/ImprimirPaqueteDialog'
import { useQueryClient } from '@tanstack/react-query'
import { imprimirEtiqueta, imprimirEtiquetasMultiples } from '@/utils/imprimirEtiqueta'
import { imprimirEtiquetaZebraPaquete, imprimirEtiquetasZebraPaquetes } from '@/utils/imprimirEtiquetaZebraPaquete'
import { Checkbox } from '@/components/ui/checkbox'
import type { Paquete } from '@/types/paquete'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { ListPagination } from '@/components/list/ListPagination'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { PERMISSIONS } from '@/types/permissions'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import { getEstadoPaqueteBadgeVariant } from '@/utils/paqueteEstado'

const LIST_KEY = 'paquetes' as const

export default function PaquetesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, filtroEstado = 'all', filtroTipo = 'all', search: busquedaGuia = '' } = { ...stored }
  
  // ListToolbar ya maneja el debounce, así que usamos busquedaGuia directamente
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setFiltroEstado = (v: string) => setFiltersAction(LIST_KEY, { filtroEstado: v, page: 0 })
  const setFiltroTipo = (v: string) => setFiltersAction(LIST_KEY, { filtroTipo: v, page: 0 })
  const setBusquedaGuia = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })

  const [paqueteAEliminar, setPaqueteAEliminar] = useState<number | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importRefDialogOpen, setImportRefDialogOpen] = useState(false)
  const [importActualizarDialogOpen, setImportActualizarDialogOpen] = useState(false)
  const [importEspecialesMiamiDialogOpen, setImportEspecialesMiamiDialogOpen] = useState(false)
  const [asociarClementinaDialogOpen, setAsociarClementinaDialogOpen] = useState(false)
  const [asociarCadenitaDialogOpen, setAsociarCadenitaDialogOpen] = useState(false)
  const [asociarSepararDialogOpen, setAsociarSepararDialogOpen] = useState(false)
  const [paquetesSeleccionados, setPaquetesSeleccionados] = useState<Set<number>>(new Set())
  const [imprimirPaqueteDialogOpen, setImprimirPaqueteDialogOpen] = useState(false)
  const [imprimirPaqueteDialogMode, setImprimirPaqueteDialogMode] = useState<ModoImpresionPaquete>('multi')
  const [paqueteParaImprimir, setPaqueteParaImprimir] = useState<Paquete | null>(null)
  const refreshPaquetes = () => queryClient.invalidateQueries({ queryKey: ['paquetes'] })

  // Filtros estado y tipo se envían al backend para paginación correcta
  const { data, isLoading, error } = usePaquetes(
    page,
    size,
    busquedaGuia,
    filtroEstado !== 'all' ? filtroEstado : undefined,
    filtroTipo !== 'all' ? filtroTipo : undefined
  )

  const deleteMutation = useDeletePaquete()

  const handleDelete = async () => {
    if (paqueteAEliminar) {
      try {
        await deleteMutation.mutateAsync(paqueteAEliminar)
        setPaqueteAEliminar(null)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  // Estado y tipo se filtran en el backend; la respuesta ya viene filtrada
  const paquetesFiltrados = data?.content ?? []

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0
  const totalElements = data?.totalElements ?? 0
  const filtrosActivos = Number(busquedaGuia.trim().length > 0) + Number(filtroEstado !== 'all') + Number(filtroTipo !== 'all')

  // Funciones para manejar selección múltiple
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const todosLosIds = new Set(paquetesFiltrados.map(p => p.idPaquete!))
      setPaquetesSeleccionados(todosLosIds)
    } else {
      setPaquetesSeleccionados(new Set())
    }
  }

  const handleSelectPaquete = (idPaquete: number, checked: boolean) => {
    const nuevosSeleccionados = new Set(paquetesSeleccionados)
    if (checked) {
      nuevosSeleccionados.add(idPaquete)
    } else {
      nuevosSeleccionados.delete(idPaquete)
    }
    setPaquetesSeleccionados(nuevosSeleccionados)
  }

  const paquetesParaImprimir = useMemo(
    () => paquetesFiltrados.filter((p) => paquetesSeleccionados.has(p.idPaquete!)),
    [paquetesFiltrados, paquetesSeleccionados]
  )

  const handleImprimirSeleccionadosNormal = () => {
    if (paquetesParaImprimir.length === 0) {
      toast.error('No hay paquetes seleccionados')
      return
    }
    imprimirEtiquetasMultiples(paquetesParaImprimir)
  }

  const handleImprimirSeleccionadosZebra = () => {
    if (paquetesParaImprimir.length === 0) {
      toast.error('No hay paquetes seleccionados')
      return
    }
    imprimirEtiquetasZebraPaquetes(paquetesParaImprimir)
  }

  const todosSeleccionados = paquetesFiltrados.length > 0 &&
    paquetesFiltrados.every(p => paquetesSeleccionados.has(p.idPaquete!))

  return (
    <PageContainer width="full" className="flex flex-col h-full min-h-0 overflow-hidden">
      <PageHeader
        icon={<Package className="h-4 w-4" />}
        title="Paquetes"
        className="shrink-0"
        actions={
          <div className="flex items-center gap-2">
            <ProtectedByPermission permissions={[PERMISSIONS.PAQUETES.CREAR, PERMISSIONS.PAQUETES.EDITAR]}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs shadow-sm">
                  <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                    <Upload className="h-3.5 w-3.5 mr-2" /> Importar Excel
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                  <DropdownMenuItem onClick={() => setImportRefDialogOpen(true)}>
                    <Tag className="h-3.5 w-3.5 mr-2" /> Importar REF
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                  <DropdownMenuItem
                    onClick={() => setImportActualizarDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Importar y Actualizar Excel
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                  <DropdownMenuItem onClick={() => setImportEspecialesMiamiDialogOpen(true)}>
                    <Tag className="h-3.5 w-3.5 mr-2" /> Importar paquetes especiales (MIAMI)
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                  <DropdownMenuItem onClick={() => setAsociarClementinaDialogOpen(true)}>
                    <PackagePlus className="h-3.5 w-3.5 mr-2" /> Asociar Clementina
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAsociarSepararDialogOpen(true)}>
                    <PackageMinus className="h-3.5 w-3.5 mr-2" /> Marcar como Separar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAsociarCadenitaDialogOpen(true)}>
                    <Link2 className="h-3.5 w-3.5 mr-2" /> Asociar Cadenita
                  </DropdownMenuItem>
                </ProtectedByPermission>
              </DropdownMenuContent>
            </DropdownMenu>
            </ProtectedByPermission>

            <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
              <Button onClick={() => navigate({ to: '/paquetes/new' })} size="sm" className="h-8 shadow-sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nuevo
              </Button>
            </ProtectedByPermission>
          </div>
        }
      />

      <ListToolbar
        search={busquedaGuia}
        onSearchChange={setBusquedaGuia}
        searchPlaceholder="Buscar por guía, REF o master..."
        filters={
          <>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(EstadoPaquete).map((estado) => (
                  <SelectItem key={estado} value={estado} className="text-xs">
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.values(TipoPaquete).map((tipo) => (
                  <SelectItem key={tipo} value={tipo} className="text-xs">
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Resultados</p>
          <p className="text-sm font-semibold">{paquetesFiltrados.length} en página</p>
        </div>
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-sm font-semibold">{totalElements} registros</p>
        </div>
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Filtros activos</p>
          <p className="text-sm font-semibold">{filtrosActivos}</p>
        </div>
      </div>

      {/* Notion Table */}
      <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 relative w-full overflow-auto">
          <Table className="notion-table">
            <TableHeader className="bg-muted/40 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-10 pl-3 h-9">
                  <Checkbox
                    checked={todosSeleccionados}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todos"
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground w-40">Guía</TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden lg:table-cell">REF</TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden md:table-cell">Tipo</TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden lg:table-cell">Peso</TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden sm:table-cell">Despacho</TableHead>
                <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground hidden xl:table-cell">Registro</TableHead>
                <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Cargando paquetes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-destructive">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">Error al cargar datos</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paquetesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64">
                    <EmptyState
                      title="No se encontraron paquetes"
                      description={
                        busquedaGuia
                          ? `No hay resultados para "${busquedaGuia}"`
                          : "No hay paquetes registrados con los filtros seleccionados"
                      }
                      icon={<Package className="h-10 w-10 text-muted-foreground/50" />}
                      action={
                        !busquedaGuia && (
                          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                            <Button onClick={() => navigate({ to: '/paquetes/new' })} variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Registrar Paquete
                            </Button>
                          </ProtectedByPermission>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paquetesFiltrados.map((paquete) => (
                  <TableRow key={paquete.idPaquete} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                    <TableCell className="pl-3 py-1.5">
                      <Checkbox
                        checked={paquetesSeleccionados.has(paquete.idPaquete!)}
                        onCheckedChange={(checked) =>
                          handleSelectPaquete(paquete.idPaquete!, checked as boolean)
                        }
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className={cn("font-mono text-xs font-medium", !paquete.numeroGuia && "text-muted-foreground italic")}>
                        {paquete.numeroGuia || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-muted-foreground hidden lg:table-cell">
                      {paquete.ref || '-'}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <StatusBadge
                        label={paquete.estado}
                        variant={getEstadoPaqueteBadgeVariant(paquete.estado)}
                      />
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-foreground/80 hidden md:table-cell">{paquete.tipoPaquete}</TableCell>
                    <TableCell className="py-1.5 text-xs tabular-nums text-muted-foreground hidden lg:table-cell">
                      {paquete.pesoKilos ? `${paquete.pesoKilos} kg` : '-'}
                    </TableCell>
                    <TableCell className="py-1.5 hidden sm:table-cell">
                      {paquete.numeroManifiesto ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate({ to: `/despachos/${paquete.idDespacho}` }) }}
                          className="text-[10px] font-mono hover:underline text-primary truncate max-w-[100px]"
                        >
                          {paquete.numeroManifiesto}
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-muted-foreground tabular-nums hidden xl:table-cell">
                      {paquete.fechaRegistro
                        ? new Date(paquete.fechaRegistro).toLocaleDateString('es-ES')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right py-1.5 pr-3">
                      <ProtectedByPermission permissions={[PERMISSIONS.PAQUETES.VER, PERMISSIONS.PAQUETES.IMPRIMIR, PERMISSIONS.PAQUETES.EDITAR, PERMISSIONS.PAQUETES.ELIMINAR]}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.VER}>
                            <DropdownMenuItem onClick={() => navigate({ to: `/paquetes/${paquete.idPaquete}` })}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                            </DropdownMenuItem>
                          </ProtectedByPermission>
                          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.IMPRIMIR}>
                            <DropdownMenuItem
                              onClick={() => {
                                setPaqueteParaImprimir(paquete)
                                setImprimirPaqueteDialogMode('single')
                                setImprimirPaqueteDialogOpen(true)
                              }}
                            >
                              <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir
                            </DropdownMenuItem>
                          </ProtectedByPermission>
                          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                            <DropdownMenuItem onClick={() => navigate({ to: `/paquetes/${paquete.idPaquete}/edit` })}>
                              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                          </ProtectedByPermission>
                          <DropdownMenuSeparator />
                          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.ELIMINAR}>
                            <DropdownMenuItem onClick={() => setPaqueteAEliminar(paquete.idPaquete!)} className="text-destructive focus:text-destructive">
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

        <ListPagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={data?.totalElements}
          size={size}
          onPageChange={setPage}
          className="shrink-0"
        />
      </div>

      {/* Barra flotante de selección */}
      {paquetesSeleccionados.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <span className="text-sm font-medium tabular-nums">
            {paquetesSeleccionados.size} seleccionado{paquetesSeleccionados.size !== 1 && 's'}
          </span>
          <div className="h-4 w-px bg-background/20" />
          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.IMPRIMIR}>
            <button
              onClick={() => {
                setImprimirPaqueteDialogMode('multi')
                setPaqueteParaImprimir(null)
                setImprimirPaqueteDialogOpen(true)
              }}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-background/70 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </button>
          </ProtectedByPermission>
          <button
            onClick={() => setPaquetesSeleccionados(new Set())}
            className="flex items-center gap-1.5 text-sm text-background/60 hover:text-background transition-colors"
          >
            Deseleccionar
          </button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={!!paqueteAEliminar} onOpenChange={(open) => !open && setPaqueteAEliminar(null)}>
        <DialogContent className="p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-destructive/5">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <div className="h-8 w-8 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </div>
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el paquete.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar este paquete? Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <Button variant="outline" onClick={() => setPaqueteAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImportarPaquetesDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImportSuccess={refreshPaquetes} />
      <ImportarRefDialog open={importRefDialogOpen} onOpenChange={setImportRefDialogOpen} onImportSuccess={refreshPaquetes} />
      <ImportarActualizarPaquetesDialog open={importActualizarDialogOpen} onOpenChange={setImportActualizarDialogOpen} onImportSuccess={refreshPaquetes} />
      <ImportarPaquetesEspecialesMiamiDialog open={importEspecialesMiamiDialogOpen} onOpenChange={setImportEspecialesMiamiDialogOpen} onImportSuccess={refreshPaquetes} />
      <AsociarClementinaLoteDialog open={asociarClementinaDialogOpen} onOpenChange={(open) => { setAsociarClementinaDialogOpen(open); if (!open) refreshPaquetes() }} />
      <AsociarCadenitaDialog open={asociarCadenitaDialogOpen} onOpenChange={(open) => { setAsociarCadenitaDialogOpen(open); if (!open) refreshPaquetes() }} />
      <AsociarSepararDialog open={asociarSepararDialogOpen} onOpenChange={(open) => { setAsociarSepararDialogOpen(open); if (!open) refreshPaquetes() }} />

      <ImprimirPaqueteDialog
        open={imprimirPaqueteDialogOpen}
        onOpenChange={(open) => {
          setImprimirPaqueteDialogOpen(open)
          if (!open) setPaqueteParaImprimir(null)
        }}
        mode={imprimirPaqueteDialogMode}
        onElegirNormal={() => {
          if (imprimirPaqueteDialogMode === 'multi') {
            handleImprimirSeleccionadosNormal()
          } else if (paqueteParaImprimir) {
            imprimirEtiqueta(paqueteParaImprimir)
            setPaqueteParaImprimir(null)
          }
        }}
        onElegirZebra={() => {
          if (imprimirPaqueteDialogMode === 'multi') {
            handleImprimirSeleccionadosZebra()
          } else if (paqueteParaImprimir) {
            imprimirEtiquetaZebraPaquete(paqueteParaImprimir)
            setPaqueteParaImprimir(null)
          }
        }}
      />
    </PageContainer>
  )
}
