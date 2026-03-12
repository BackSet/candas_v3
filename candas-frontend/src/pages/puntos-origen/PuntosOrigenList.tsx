import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePuntosOrigen, useDeletePuntoOrigen } from '@/hooks/usePuntosOrigen'
import { useQuery } from '@tanstack/react-query'
import { puntoOrigenService } from '@/lib/api/punto-origen.service'
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
import { Eye, Edit, Trash2, Plus, MapPin, MoreHorizontal } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { useFiltersStore } from '@/stores/filtersStore'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'

const LIST_KEY = 'puntos-origen' as const

export default function PuntosOrigenList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [origenAEliminar, setOrigenAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = usePuntosOrigen(page, size)
  const deleteMutation = useDeletePuntoOrigen()

  // Búsqueda en el backend cuando hay una búsqueda activa
  const { data: origenesBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['puntos-origen', 'search', busqueda],
    queryFn: () => puntoOrigenService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const handleDelete = async () => {
    if (origenAEliminar) {
      try {
        await deleteMutation.mutateAsync(origenAEliminar)
        setOrigenAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  // Usar resultados de búsqueda del backend si hay búsqueda activa, sino usar datos paginados
  const origenesFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return origenesBusqueda || []
    }
    return data?.content || []
  }, [busqueda, origenesBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <StandardPageLayout
      title="Puntos de Origen"
      icon={<MapPin className="h-4 w-4" />}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.CREAR}>
          <Button onClick={() => navigate({ to: '/puntos-origen/new' })} size="sm" className="h-8 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
    >

      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre..."
        withBottomBorder={false}
      />

      {/* Content + pagination wrapper */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
        {/* Main Content - Notion Table View */}
        <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative w-full overflow-auto">
            <Table className="notion-table">
              <TableHeader className="bg-muted/40 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-4">Nombre</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || loadingBusqueda) ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-8">
                      <LoadingState label="Cargando puntos de origen..." />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-8">
                      <ErrorState title="Error al cargar puntos de origen" />
                    </TableCell>
                  </TableRow>
                ) : origenesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-64">
                      <EmptyState
                        title="No se encontraron puntos de origen"
                        description={
                          busqueda
                            ? `No hay resultados para "${busqueda}"`
                            : "No hay puntos de origen registrados"
                        }
                        icon={<MapPin className="h-10 w-10 text-muted-foreground/50" />}
                        action={
                          !busqueda && (
                            <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.CREAR}>
                              <Button onClick={() => navigate({ to: '/puntos-origen/new' })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Punto de Origen
                              </Button>
                            </ProtectedByPermission>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  origenesFiltrados.map((origen) => (
                    <TableRow key={origen.idPuntoOrigen} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                      <TableCell className="font-medium text-xs pl-4 py-1.5 align-top">
                        {origen.nombrePuntoOrigen}
                      </TableCell>
                      <TableCell className="py-1.5 align-top">
                        <StatusBadge
                          label={origen.activo !== false ? 'Activo' : 'Inactivo'}
                          variant={origen.activo !== false ? 'active' : 'inactive'}
                        />
                      </TableCell>
                      <TableCell className="text-right py-1.5 pr-3">
                        <ProtectedByPermission permissions={[PERMISSIONS.PUNTOS_ORIGEN.VER, PERMISSIONS.PUNTOS_ORIGEN.EDITAR, PERMISSIONS.PUNTOS_ORIGEN.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/puntos-origen/${origen.idPuntoOrigen}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/puntos-origen/${origen.idPuntoOrigen}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setOrigenAEliminar(origen.idPuntoOrigen!)} className="text-destructive focus:text-destructive">
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
        <ListPagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={data?.totalElements}
          size={size}
          onPageChange={setPage}
          className="shrink-0"
        />
      </div>

      <Dialog open={!!origenAEliminar} onOpenChange={(open) => !open && setOrigenAEliminar(null)}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-destructive/10">
            <DialogTitle className="text-destructive">Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este punto de origen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrigenAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardPageLayout>
  )
}
