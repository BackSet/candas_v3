import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useRoles, useDeleteRol } from '@/hooks/useRoles'
import { useQuery } from '@tanstack/react-query'
import { rolService } from '@/lib/api/rol.service'
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
import { Eye, Edit, Trash2, Plus, Shield, MoreHorizontal, Key } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { ListToolbar } from '@/components/list/ListToolbar'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { useFiltersStore } from '@/stores/filtersStore'

const LIST_KEY = 'roles' as const

export default function RolesList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [rolAEliminar, setRolAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useRoles(page, size)
  const deleteMutation = useDeleteRol()

  const { data: rolesBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['roles', 'search', busqueda],
    queryFn: () => rolService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const handleDelete = async () => {
    if (rolAEliminar) {
      try {
        await deleteMutation.mutateAsync(rolAEliminar)
        setRolAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const rolesFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return rolesBusqueda || []
    }
    return data?.content || []
  }, [busqueda, rolesBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <StandardPageLayout
      title="Roles"
      subtitle="Gestión de roles y permisos"
      icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center"><Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.ROLES.CREAR}>
          <Button onClick={() => navigate({ to: '/roles/new' })} size="sm" className="h-8 shadow-sm text-xs rounded-lg">
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
        actions={
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            <span className="font-medium text-foreground">{rolesFiltrados.length}</span> roles
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
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-4 w-48">Rol</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Descripción</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-28">Permisos</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-24">Estado</TableHead>
                <TableHead className="h-10 text-right pr-6 w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || loadingBusqueda) ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <LoadingState label="Cargando roles..." />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <ErrorState title="Error al cargar roles" />
                  </TableCell>
                </TableRow>
              ) : rolesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <EmptyState
                      title="No se encontraron roles"
                      description={busqueda.trim().length > 0 ? `No hay resultados para "${busqueda}"` : 'Aún no hay roles registrados en el sistema.'}
                      icon={<Shield className="h-10 w-10 text-muted-foreground/50" />}
                      action={busqueda.trim().length === 0 ? (
                        <ProtectedByPermission permission={PERMISSIONS.ROLES.CREAR}>
                          <Button onClick={() => navigate({ to: '/roles/new' })} variant="outline" size="sm" className="rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Crear Rol
                          </Button>
                        </ProtectedByPermission>
                      ) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rolesFiltrados.map((rol) => (
                  <TableRow key={rol.idRol} className="group hover:bg-muted/20 border-b border-border/30 last:border-0 transition-colors duration-150">
                    <TableCell className="pl-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center shrink-0 border border-violet-500/10">
                          <Shield className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="font-mono text-xs font-semibold text-foreground">{rol.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top text-xs text-muted-foreground max-w-[250px] truncate" title={rol.descripcion}>
                      {rol.descripcion || <span className="italic opacity-50">Sin descripción</span>}
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <Key className="h-3 w-3 mr-1" />
                        {rol.permisos?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold ${rol.activo !== false
                            ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-100/80 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                      >
                        {rol.activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 align-top text-right pr-4">
                      <ProtectedByPermission permissions={[PERMISSIONS.ROLES.VER, PERMISSIONS.ROLES.EDITAR, PERMISSIONS.ROLES.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.ROLES.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/roles/${rol.idRol}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.ROLES.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/roles/${rol.idRol}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.ROLES.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setRolAEliminar(rol.idRol!)} className="text-destructive focus:text-destructive">
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
      <Dialog open={!!rolAEliminar} onOpenChange={(open) => !open && setRolAEliminar(null)}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolAEliminar(null)} disabled={deleteMutation.isPending} className="rounded-lg">
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
