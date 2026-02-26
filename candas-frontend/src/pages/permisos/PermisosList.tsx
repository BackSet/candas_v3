import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePermisos, useDeletePermiso } from '@/hooks/usePermisos'
import { useQuery } from '@tanstack/react-query'
import { permisoService } from '@/lib/api/permiso.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Eye, Edit, Trash2, Plus, Key, MoreHorizontal, Search, Folder, Zap } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { ListPagination } from '@/components/list/ListPagination'
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
    <PageContainer width="full" spacing="0" className="w-full flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0">
        <PageHeader
          className="pb-0 border-b-0"
          icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center"><Key className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>}
          title="Permisos"
          subtitle="Gestión de permisos del sistema"
          actions={
            <ProtectedByPermission permission={PERMISSIONS.PERMISOS.CREAR}>
              <Button onClick={() => navigate({ to: '/permisos/new' })} size="sm" className="h-8 shadow-sm text-xs rounded-lg">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nuevo Permiso
              </Button>
            </ProtectedByPermission>
          }
        />
      </div>

      {/* Search Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-muted/5 flex items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            className="h-9 w-full pl-9 pr-4 text-sm bg-background border-border/40 rounded-lg focus-visible:ring-primary/20 shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline-block">
          <span className="font-medium text-foreground">{permisosFiltrados.length}</span> permisos
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto">
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
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-blue-500 animate-spin" />
                      <span className="text-sm">Cargando permisos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-destructive">
                    <div className="flex flex-col items-center gap-2">
                      <Key className="h-6 w-6 opacity-50" />
                      <span className="text-sm">Error al cargar permisos</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : permisosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto p-8">
                      <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center">
                        <Key className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-foreground">No se encontraron permisos</h3>
                        <p className="text-xs text-muted-foreground">
                          {busqueda.trim().length > 0
                            ? `No hay resultados para "${busqueda}"`
                            : "Aún no hay permisos registrados en el sistema."}
                        </p>
                      </div>
                      {busqueda.trim().length === 0 && (
                        <ProtectedByPermission permission={PERMISSIONS.PERMISOS.CREAR}>
                          <Button onClick={() => navigate({ to: '/permisos/new' })} variant="outline" size="sm" className="mt-1 rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Crear Permiso
                          </Button>
                        </ProtectedByPermission>
                      )}
                    </div>
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
          className="px-4 pb-2"
        />
      )}

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
    </PageContainer>
  )
}
