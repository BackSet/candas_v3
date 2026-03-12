import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePermisos, useDeletePermiso } from '@/hooks/usePermisos'
import { useQuery } from '@tanstack/react-query'
import { permisoService } from '@/lib/api/permiso.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Eye, Edit, Trash2, Plus, Key, MoreHorizontal, Folder, Zap } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { ListToolbar } from '@/components/list/ListToolbar'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { useFiltersStore } from '@/stores/filtersStore'

const LIST_KEY = 'permisos' as const

export default function PermisosList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [permisoAEliminar, setPermisoAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = usePermisos(page, size)
  const deleteMutation = useDeletePermiso()

  const { data: permisosBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['permisos', 'search', busqueda],
    queryFn: () => permisoService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const handleDelete = async () => {
    if (permisoAEliminar) {
      try {
        await deleteMutation.mutateAsync(permisoAEliminar)
        setPermisoAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const permisosFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return permisosBusqueda || []
    }
    return data?.content || []
  }, [busqueda, permisosBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <StandardPageLayout
      title="Permisos"
      subtitle="Gestión de permisos del sistema"
      icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center"><Key className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.PERMISOS.CREAR}>
          <Button onClick={() => navigate({ to: '/permisos/new' })} size="sm" className="h-8 shadow-sm text-xs rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
    >
      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre o descripción..."
        withBottomBorder={false}
        actions={
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            <span className="font-medium text-foreground">{permisosFiltrados.length}</span> permisos
          </span>
        }
      />

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
        <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative w-full overflow-auto">
            <Table className="notion-table w-full relative">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-4 w-52">Permiso</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Descripción</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-32">Recurso</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-28">Acción</TableHead>
                <TableHead className="h-10 text-right pr-6 w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || loadingBusqueda) ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <LoadingState label="Cargando permisos..." />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <ErrorState title="Error al cargar permisos" />
                  </TableCell>
                </TableRow>
              ) : permisosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <EmptyState
                      title="No se encontraron permisos"
                      description={busqueda.trim().length > 0 ? `No hay resultados para "${busqueda}"` : 'Aún no hay permisos registrados en el sistema.'}
                      icon={<Key className="h-10 w-10 text-muted-foreground/50" />}
                      action={busqueda.trim().length === 0 ? (
                        <ProtectedByPermission permission={PERMISSIONS.PERMISOS.CREAR}>
                          <Button onClick={() => navigate({ to: '/permisos/new' })} variant="outline" size="sm" className="rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Crear Permiso
                          </Button>
                        </ProtectedByPermission>
                      ) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                permisosFiltrados.map((permiso) => (
                  <TableRow key={permiso.idPermiso} className="group hover:bg-muted/20 border-b border-border/30 last:border-0 transition-colors duration-150">
                    <TableCell className="pl-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center shrink-0 border border-blue-500/10">
                          <Key className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{permiso.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top text-xs text-muted-foreground max-w-[250px] truncate" title={permiso.descripcion}>
                      {permiso.descripcion || <span className="italic opacity-50">Sin descripción</span>}
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      {permiso.recurso ? (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-medium bg-amber-100/80 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                          <Folder className="h-3 w-3 mr-1" />
                          {permiso.recurso}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      {permiso.accion ? (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-medium bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          <Zap className="h-3 w-3 mr-1" />
                          {permiso.accion}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 align-top text-right pr-4">
                      <ProtectedByPermission permissions={[PERMISSIONS.PERMISOS.VER, PERMISSIONS.PERMISOS.EDITAR, PERMISSIONS.PERMISOS.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.PERMISOS.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/permisos/${permiso.idPermiso}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.PERMISOS.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/permisos/${permiso.idPermiso}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.PERMISOS.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setPermisoAEliminar(permiso.idPermiso!)} className="text-destructive focus:text-destructive">
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
            className="shrink-0"
          />
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!permisoAEliminar} onOpenChange={(open) => !open && setPermisoAEliminar(null)}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este permiso? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermisoAEliminar(null)} disabled={deleteMutation.isPending} className="rounded-lg">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardPageLayout>
  )
}
