import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useRoles, useDeleteRol } from '@/hooks/useRoles'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Eye, Edit, Trash2, Plus, Shield, MoreHorizontal } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import { useListFilters } from '@/hooks/useListFilters'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, BooleanFilter } from '@/components/filters'
import type { Rol } from '@/types/rol'
import { getApiErrorMessage } from '@/lib/api/errors'

interface RolesFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activo: 'all' | 'true' | 'false'
}

const ROLES_FILTERS_DEFAULTS: RolesFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activo: 'all',
}

function RolRowActions({
  onVer,
  onEditar,
  onEliminar,
}: {
  onVer: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.ROLES.VER, PERMISSIONS.ROLES.EDITAR, PERMISSIONS.ROLES.ELIMINAR]}>
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
          <ProtectedByPermission permission={PERMISSIONS.ROLES.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.ROLES.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.ROLES.ELIMINAR}>
            <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function RolesList() {
  const navigate = useNavigate()

  const filtros = useListFilters<RolesFiltersState>({
    storageKey: 'roles',
    defaults: ROLES_FILTERS_DEFAULTS,
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

  const [rolAEliminar, setRolAEliminar] = useState<number | null>(null)

  const activoFilter = activo === 'all' ? undefined : activo === 'true'

  const { data, isLoading, error } = useRoles({
    page,
    size,
    search: busqueda || undefined,
    activo: activoFilter,
  })
  const deleteMutation = useDeleteRol()

  const handleDelete = async () => {
    if (rolAEliminar) {
      try {
        await deleteMutation.mutateAsync(rolAEliminar)
        setRolAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const rolesFiltrados = data?.content || []
  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0
  const isLoadingData = isLoading
  const hayFiltros = filtros.hasActiveFilters

  const columns = useMemo<DataTableColumn<Rol>[]>(() => [
    {
      id: 'nombre',
      header: 'Rol',
      width: '220px',
      accessor: (r) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-mono text-xs font-semibold text-foreground truncate" title={r.nombre}>
            {r.nombre}
          </span>
        </div>
      ),
      sortValue: (r) => r.nombre ?? '',
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '110px',
      accessor: (r) => (
        <Badge
          variant="secondary"
          className={`text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold ${
            r.activo !== false
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {r.activo !== false ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      sortValue: (r) => (r.activo !== false ? 1 : 0),
    },
    {
      id: 'permisos',
      header: '# Permisos',
      width: '110px',
      align: 'right',
      accessor: (r) => (
        <span className="text-xs font-medium text-foreground tabular-nums">
          {r.permisos?.length ?? 0}
        </span>
      ),
      sortValue: (r) => r.permisos?.length ?? 0,
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      defaultHidden: true,
      accessor: (r) => (
        <span className="text-xs text-muted-foreground truncate max-w-[320px]" title={r.descripcion}>
          {r.descripcion || <span className="italic opacity-50">Sin descripción</span>}
        </span>
      ),
      sortValue: (r) => r.descripcion ?? '',
    },
  ], [])

  return (
    <ListPageLayout
      title="Roles"
      subtitle="Gestión de roles y permisos"
      icon={<Shield className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.ROLES.CREAR}>
          <Button onClick={() => navigate({ to: '/roles/new' })} size="sm" className="h-8 shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
      filterBar={
        <FilterBar
          searchValue={busqueda}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por nombre..."
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
            ariaLabel="Estado del rol"
          />
        </FilterBar>
      }
      table={
        error && !isLoadingData ? (
          <ErrorState
            title="Error al cargar roles"
            description={getApiErrorMessage(error, 'No se pudieron cargar los roles.')}
          />
        ) : (
          <DataTable<Rol>
            data={rolesFiltrados}
            columns={columns}
            rowKey={(r) => r.idRol!}
            storageKey="roles"
            isLoading={isLoadingData}
            emptyState={
              <EmptyState
                title="No se encontraron roles"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'Aún no hay roles registrados en el sistema.'
                }
                icon={<Shield className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.ROLES.CREAR}>
                      <Button onClick={() => navigate({ to: '/roles/new' })} variant="outline" size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Crear Rol
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(r) => (
              <RolRowActions
                onVer={() => navigate({ to: `/roles/${r.idRol}` })}
                onEditar={() => navigate({ to: `/roles/${r.idRol}/edit` })}
                onEliminar={() => setRolAEliminar(r.idRol!)}
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
      <Dialog open={!!rolAEliminar} onOpenChange={(open) => !open && setRolAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolAEliminar(null)} disabled={deleteMutation.isPending}>
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
