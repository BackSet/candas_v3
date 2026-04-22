import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useUsuarios, useDeleteUsuario } from '@/hooks/useUsuarios'
import { Button } from '@/components/ui/button'
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
import { Eye, Edit, Trash2, Plus, MoreHorizontal, Users, Mail } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import { useListFilters } from '@/hooks/useListFilters'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, BooleanFilter } from '@/components/filters'
import type { Usuario } from '@/types/usuario'
import { getApiErrorMessage } from '@/lib/api/errors'

interface UsuariosFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activo: 'all' | 'true' | 'false'
}

const USUARIOS_FILTERS_DEFAULTS: UsuariosFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activo: 'all',
}

function UsuarioRowActions({
  onVer,
  onEditar,
  onEliminar,
}: {
  onVer: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.USUARIOS.VER, PERMISSIONS.USUARIOS.EDITAR, PERMISSIONS.USUARIOS.ELIMINAR]}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Acciones de fila"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.USUARIOS.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.USUARIOS.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.USUARIOS.ELIMINAR}>
            <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function UsuariosList() {
  const navigate = useNavigate()

  const filtros = useListFilters<UsuariosFiltersState>({
    storageKey: 'usuarios',
    defaults: USUARIOS_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.activo !== 'all') {
        chips.push({
          key: 'activo',
          label: `Estado: ${values.activo === 'true' ? 'Activos' : 'Inactivos'}`,
          onRemove: () => removeFilter('activo'),
        })
      }
      return chips
    },
  })
  const { page, size, search: busqueda, activo } = filtros.values

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<number | null>(null)

  const activoFilter = activo === 'all' ? undefined : activo === 'true'

  const { data, isLoading, error } = useUsuarios({
    page,
    size,
    search: busqueda || undefined,
    activo: activoFilter,
  })
  const deleteMutation = useDeleteUsuario()

  const handleDelete = async () => {
    if (usuarioAEliminar) {
      try {
        await deleteMutation.mutateAsync(usuarioAEliminar)
        setUsuarioAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const usuariosFiltrados = data?.content || []
  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0
  const isLoadingData = isLoading
  const hayFiltros = filtros.hasActiveFilters

  const columns = useMemo<DataTableColumn<Usuario>[]>(() => [
    {
      id: 'username',
      header: '@username',
      width: '200px',
      accessor: (u) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold uppercase shrink-0 border border-primary/15">
            {u.nombreCompleto?.charAt(0) || u.username?.charAt(0) || '?'}
          </div>
          <span className="font-mono text-xs font-medium text-foreground truncate" title={u.username}>
            @{u.username}
          </span>
        </div>
      ),
      sortValue: (u) => u.username ?? '',
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '110px',
      accessor: (u) => (
        <Badge
          variant="secondary"
          className={`text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold ${
            u.activo !== false
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {u.activo !== false ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      sortValue: (u) => (u.activo !== false ? 1 : 0),
    },
    {
      id: 'nombre',
      header: 'Nombre',
      accessor: (u) => (
        <span className="text-xs font-medium text-foreground truncate" title={u.nombreCompleto}>
          {u.nombreCompleto}
        </span>
      ),
      sortValue: (u) => u.nombreCompleto ?? '',
    },
    {
      id: 'email',
      header: 'Email',
      accessor: (u) => (
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-xs text-muted-foreground truncate" title={u.email}>{u.email}</span>
        </div>
      ),
      sortValue: (u) => u.email ?? '',
    },
  ], [])

  return (
    <ListPageLayout
      title="Usuarios"
      subtitle="Gestión de cuentas y acceso"
      icon={<Users className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.USUARIOS.CREAR}>
          <Button onClick={() => navigate({ to: '/usuarios/new' })} size="sm" className="h-8 shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
      filterBar={
        <FilterBar
          searchValue={busqueda}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por nombre, username o email..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <BooleanFilter
            value={activoFilter}
            onChange={(v) =>
              filtros.setFilter(
                'activo',
                v === undefined ? 'all' : v ? 'true' : 'false'
              )
            }
            ariaLabel="Estado de usuario"
          />
        </FilterBar>
      }
      table={
        error && !isLoadingData ? (
          <ErrorState
            title="Error al cargar usuarios"
            description={getApiErrorMessage(error, 'No se pudieron cargar los usuarios.')}
          />
        ) : (
          <DataTable<Usuario>
            data={usuariosFiltrados}
            columns={columns}
            rowKey={(u) => u.idUsuario!}
            storageKey="usuarios"
            isLoading={isLoadingData}
            emptyState={
              <EmptyState
                title="No se encontraron usuarios"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'Aún no hay usuarios registrados en el sistema.'
                }
                icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.USUARIOS.CREAR}>
                      <Button onClick={() => navigate({ to: '/usuarios/new' })} variant="outline" size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Crear Usuario
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(u) => (
              <UsuarioRowActions
                onVer={() => navigate({ to: `/usuarios/${u.idUsuario}` })}
                onEditar={() => navigate({ to: `/usuarios/${u.idUsuario}/edit` })}
                onEliminar={() => setUsuarioAEliminar(u.idUsuario!)}
              />
            )}
          />
        )
      }
      footer={
        <ListPagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={data?.totalElements}
          size={size}
          onPageChange={(p) => filtros.setFilter('page', p)}
          alwaysShow
          className="border-t-0 pt-0"
        />
      }
    >
      <Dialog open={!!usuarioAEliminar} onOpenChange={(open) => !open && setUsuarioAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageLayout>
  )
}
