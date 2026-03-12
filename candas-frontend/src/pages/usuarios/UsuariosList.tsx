import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useUsuarios, useDeleteUsuario } from '@/hooks/useUsuarios'
import { useQuery } from '@tanstack/react-query'
import { usuarioService } from '@/lib/api/usuario.service'
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
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2, Plus, MoreHorizontal, Users, Mail, Shield } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { ListToolbar } from '@/components/list/ListToolbar'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { useFiltersStore } from '@/stores/filtersStore'

const LIST_KEY = 'usuarios' as const

export default function UsuariosList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useUsuarios(page, size)
  const deleteMutation = useDeleteUsuario()

  const { data: usuariosBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['usuarios', 'search', busqueda],
    queryFn: () => usuarioService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const handleDelete = async () => {
    if (usuarioAEliminar) {
      try {
        await deleteMutation.mutateAsync(usuarioAEliminar)
        setUsuarioAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const usuariosFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return usuariosBusqueda || []
    }
    return data?.content || []
  }, [busqueda, usuariosBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <StandardPageLayout
      title="Usuarios"
      subtitle="Gestión de cuentas y acceso"
      icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.USUARIOS.CREAR}>
          <Button onClick={() => navigate({ to: '/usuarios/new' })} size="sm" className="h-8 shadow-sm text-xs rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
    >
      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre, username o email..."
        withBottomBorder={false}
        actions={
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            <span className="font-medium text-foreground">{usuariosFiltrados.length}</span> usuarios
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
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-4 w-44">Usuario</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                <TableHead className="h-10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-24">Estado</TableHead>
                <TableHead className="h-10 text-right pr-6 w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || loadingBusqueda) ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <LoadingState label="Cargando usuarios..." />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <ErrorState title="Error al cargar usuarios" />
                  </TableCell>
                </TableRow>
              ) : usuariosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <EmptyState
                      title="No se encontraron usuarios"
                      description={busqueda.trim().length > 0 ? `No hay resultados para "${busqueda}"` : 'Aún no hay usuarios registrados en el sistema.'}
                      icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
                      action={busqueda.trim().length === 0 ? (
                        <ProtectedByPermission permission={PERMISSIONS.USUARIOS.CREAR}>
                          <Button onClick={() => navigate({ to: '/usuarios/new' })} variant="outline" size="sm" className="rounded-lg">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Crear Usuario
                          </Button>
                        </ProtectedByPermission>
                      ) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <TableRow key={usuario.idUsuario} className="group hover:bg-muted/20 border-b border-border/30 last:border-0 transition-colors duration-150">
                    <TableCell className="pl-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary text-xs font-bold uppercase shrink-0 border border-primary/10">
                          {usuario.nombreCompleto?.charAt(0) || usuario.username?.charAt(0) || '?'}
                        </div>
                        <span className="font-mono text-xs font-medium text-foreground">@{usuario.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <span className="text-xs font-medium text-foreground">{usuario.nombreCompleto}</span>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs text-muted-foreground">{usuario.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold ${usuario.activo !== false
                            ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-100/80 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                      >
                        {usuario.activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 align-top text-right pr-4">
                      <ProtectedByPermission permissions={[PERMISSIONS.USUARIOS.VER, PERMISSIONS.USUARIOS.EDITAR, PERMISSIONS.USUARIOS.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.USUARIOS.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/usuarios/${usuario.idUsuario}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.USUARIOS.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/usuarios/${usuario.idUsuario}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.USUARIOS.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setUsuarioAEliminar(usuario.idUsuario!)} className="text-destructive focus:text-destructive">
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
      <Dialog open={!!usuarioAEliminar} onOpenChange={(open) => !open && setUsuarioAEliminar(null)}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioAEliminar(null)} disabled={deleteMutation.isPending} className="rounded-lg">
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
