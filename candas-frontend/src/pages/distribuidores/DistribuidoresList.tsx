import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDistribuidores, useDeleteDistribuidor } from '@/hooks/useDistribuidores'
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
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Building2,
  MoreHorizontal,
} from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import { useListFilters } from '@/hooks/useListFilters'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter } from '@/components/filters'
import type { Distribuidor } from '@/types/distribuidor'
import { getApiErrorMessage } from '@/lib/api/errors'

interface DistribuidoresFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activa: 'all' | 'true' | 'false'
}

const DISTRIBUIDORES_FILTERS_DEFAULTS: DistribuidoresFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activa: 'all',
}

function DistribuidorRowActions({
  onVer,
  onEditar,
  onEliminar,
}: {
  onVer: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission
      permissions={[
        PERMISSIONS.DISTRIBUIDORES.VER,
        PERMISSIONS.DISTRIBUIDORES.EDITAR,
        PERMISSIONS.DISTRIBUIDORES.ELIMINAR,
      ]}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Acciones de fila"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.ELIMINAR}>
            <DropdownMenuItem
              onClick={onEliminar}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function DistribuidoresList() {
  const navigate = useNavigate()
  const filtros = useListFilters<DistribuidoresFiltersState>({
    storageKey: 'distribuidores',
    defaults: DISTRIBUIDORES_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.activa !== 'all') {
        chips.push({
          key: 'activa',
          label: values.activa === 'true' ? 'Activos' : 'Inactivos',
          onRemove: () => removeFilter('activa'),
        })
      }
      return chips
    },
  })
  const { page, size, search, activa } = filtros.values
  const activaBool = activa === 'all' ? undefined : activa === 'true'

  const [distribuidorAEliminar, setDistribuidorAEliminar] = useState<
    number | null
  >(null)

  const { data, isLoading, error } = useDistribuidores({
    page,
    size,
    search: search || undefined,
    activa: activaBool,
  })
  const deleteMutation = useDeleteDistribuidor()

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

  const distribuidoresFiltrados = data?.content ?? []

  const columns = useMemo<DataTableColumn<Distribuidor>[]>(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        width: '110px',
        accessor: (d) => (
          <span className="font-mono text-xs text-muted-foreground">
            {d.codigo || '—'}
          </span>
        ),
        sortValue: (d) => d.codigo ?? '',
      },
      {
        id: 'nombre',
        header: 'Distribuidor',
        accessor: (d) => (
          <span
            className="text-xs font-medium text-foreground truncate block"
            title={d.nombre}
          >
            {d.nombre}
          </span>
        ),
        sortValue: (d) => d.nombre ?? '',
      },
      {
        id: 'estado',
        header: 'Estado',
        width: '110px',
        accessor: (d) => (
          <StatusBadge
            label={d.activa ? 'Activo' : 'Inactivo'}
            variant={d.activa ? 'active' : 'inactive'}
          />
        ),
        sortValue: (d) => (d.activa ? 1 : 0),
      },
      {
        id: 'email',
        header: 'Email',
        defaultHidden: true,
        accessor: (d) => (
          <span
            className="text-xs text-foreground truncate block"
            title={d.email ?? undefined}
          >
            {d.email || '—'}
          </span>
        ),
        sortValue: (d) => d.email ?? '',
      },
    ],
    []
  )

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Distribuidores"
      icon={<Building2 className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.DISTRIBUIDORES.CREAR}>
          <Button
            onClick={() => navigate({ to: '/distribuidores/new' })}
            size="sm"
            className="h-8 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por nombre, código o email..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={activa}
            onChange={(v) => filtros.setFilter('activa', v as DistribuidoresFiltersState['activa'])}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            ariaLabel="Estado del distribuidor"
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar distribuidores"
            description={getApiErrorMessage(
              error,
              'No se pudieron cargar los distribuidores.'
            )}
          />
        ) : (
          <DataTable<Distribuidor>
            data={distribuidoresFiltrados}
            columns={columns}
            rowKey={(d) => d.idDistribuidor!}
            storageKey="distribuidores"
            isLoading={isLoading}
            emptyState={
              <EmptyState
                title="No se encontraron distribuidores"
                description={
                  hayFiltros
                    ? 'No hay resultados con los filtros aplicados'
                    : 'No hay distribuidores registrados'
                }
                icon={
                  <Building2 className="h-10 w-10 text-muted-foreground/50" />
                }
                action={
                  !hayFiltros && (
                    <ProtectedByPermission
                      permission={PERMISSIONS.DISTRIBUIDORES.CREAR}
                    >
                      <Button
                        onClick={() => navigate({ to: '/distribuidores/new' })}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Distribuidor
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(d) => (
              <DistribuidorRowActions
                onVer={() =>
                  navigate({ to: `/distribuidores/${d.idDistribuidor}` })
                }
                onEditar={() =>
                  navigate({ to: `/distribuidores/${d.idDistribuidor}/edit` })
                }
                onEliminar={() => setDistribuidorAEliminar(d.idDistribuidor!)}
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
      <Dialog
        open={!!distribuidorAEliminar}
        onOpenChange={(open) => !open && setDistribuidorAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar este distribuidor? Esta
                  acción marcará el distribuidor como inactivo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDistribuidorAEliminar(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageLayout>
  )
}
