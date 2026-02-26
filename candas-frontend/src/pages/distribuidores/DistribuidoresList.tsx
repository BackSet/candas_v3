import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDistribuidores, useDeleteDistribuidor } from '@/hooks/useDistribuidores'
import { useQuery } from '@tanstack/react-query'
import { distribuidorService } from '@/lib/api/distribuidor.service'
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
import { Eye, Edit, Trash2, Plus, Building2, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { ListPagination } from '@/components/list/ListPagination'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { useFiltersStore } from '@/stores/filtersStore'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'

const LIST_KEY = 'distribuidores' as const

export default function DistribuidoresList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [distribuidorAEliminar, setDistribuidorAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useDistribuidores(page, size)
  const deleteMutation = useDeleteDistribuidor()

  // Búsqueda en el backend cuando hay una búsqueda activa
  const { data: distribuidoresBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['distribuidores', 'search', busqueda],
    queryFn: () => distribuidorService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const handleDelete = async () => {
    if (distribuidorAEliminar) {
      try {
        await deleteMutation.mutateAsync(distribuidorAEliminar)
        setDistribuidorAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  // Usar resultados de búsqueda del backend si hay búsqueda activa, sino usar datos paginados
  const distribuidoresFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return distribuidoresBusqueda || []
    }
    return data?.content || []
  }, [busqueda, distribuidoresBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <PageContainer width="full" className="flex flex-col h-full min-h-0 overflow-hidden">
      <PageHeader
        icon={<Building2 className="h-4 w-4" />}
        title="Distribuidores"
        className="shrink-0"
        actions={
          <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.CREAR}>
            <Button onClick={() => navigate({ to: '/distribuidores/new' })} size="sm" className="h-8 shadow-sm text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nuevo Distribuidor
            </Button>
          </ProtectedByPermission>
        }
      />

      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar distribuidor..."
      />

      {/* Content + pagination wrapper */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Main Content - Notion Table View */}
        <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative w-full overflow-auto">
            <Table className="notion-table">
              <TableHeader className="bg-muted/40 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-4">Distribuidor</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Código</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Datos</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || loadingBusqueda) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Cargando distribuidores...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-destructive">
                      <div className="flex flex-col items-center gap-1">
                        <AlertCircle className="h-5 w-5" />
                        <span>Error al cargar distribuidores</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : distribuidoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64">
                      <EmptyState
                        title="No se encontraron distribuidores"
                        description={
                          busqueda
                            ? `No hay resultados para "${busqueda}"`
                            : "No hay distribuidores registrados"
                        }
                        icon={<Building2 className="h-10 w-10 text-muted-foreground/50" />}
                        action={
                          !busqueda && (
                            <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.CREAR}>
                              <Button onClick={() => navigate({ to: '/distribuidores/new' })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Distribuidor
                              </Button>
                            </ProtectedByPermission>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  distribuidoresFiltrados.map((distribuidor) => (
                    <TableRow key={distribuidor.idDistribuidor} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                      <TableCell className="font-medium text-xs pl-4 py-1.5 align-top">
                        {distribuidor.nombre}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-1.5">{distribuidor.codigo || '-'}</TableCell>
                      <TableCell className="text-xs py-1.5 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground">{distribuidor.email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 align-top">
                        <StatusBadge
                          label={distribuidor.activa ? 'Activa' : 'Inactiva'}
                          variant={distribuidor.activa ? 'active' : 'inactive'}
                        />
                      </TableCell>
                      <TableCell className="text-right py-1.5 pr-3">
                        <ProtectedByPermission permissions={[PERMISSIONS.DISTRIBUIDORES.VER, PERMISSIONS.DISTRIBUIDORES.EDITAR, PERMISSIONS.DISTRIBUIDORES.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/distribuidores/${distribuidor.idDistribuidor}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/distribuidores/${distribuidor.idDistribuidor}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setDistribuidorAEliminar(distribuidor.idDistribuidor!)} className="text-destructive focus:text-destructive">
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
              className="shrink-0"
            />
          )}
        </div>
      </div>

      <Dialog open={!!distribuidorAEliminar} onOpenChange={(open) => !open && setDistribuidorAEliminar(null)}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar este distribuidor? Esta acción marcará el distribuidor como inactivo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistribuidorAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
