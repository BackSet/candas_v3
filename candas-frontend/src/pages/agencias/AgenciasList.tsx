import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAgencias, useDeleteAgencia } from '@/hooks/useAgencias'
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
  MapPin,
} from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import { useListFilters } from '@/hooks/useListFilters'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter } from '@/components/filters'
import type { Agencia } from '@/types/agencia'
import { getApiErrorMessage } from '@/lib/api/errors'

interface AgenciasFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activa: 'all' | 'true' | 'false'
}

const AGENCIAS_FILTERS_DEFAULTS: AgenciasFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activa: 'all',
}

function AgenciaRowActions({
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
        PERMISSIONS.AGENCIAS.VER,
        PERMISSIONS.AGENCIAS.EDITAR,
        PERMISSIONS.AGENCIAS.ELIMINAR,
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
          <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.ELIMINAR}>
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

export default function AgenciasList() {
  const navigate = useNavigate()
  const filtros = useListFilters<AgenciasFiltersState>({
    storageKey: 'agencias',
    defaults: AGENCIAS_FILTERS_DEFAULTS,
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
          label: values.activa === 'true' ? 'Activas' : 'Inactivas',
          onRemove: () => removeFilter('activa'),
        })
      }
      return chips
    },
  })
  const { page, size, search, activa } = filtros.values
  const activaBool = activa === 'all' ? undefined : activa === 'true'

  const [agenciaAEliminar, setAgenciaAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useAgencias({
    page,
    size,
    search: search || undefined,
    activa: activaBool,
  })
  const deleteMutation = useDeleteAgencia()

  const handleDelete = async () => {
    if (agenciaAEliminar) {
      try {
        await deleteMutation.mutateAsync(agenciaAEliminar)
        setAgenciaAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  const agenciasFiltradas = data?.content ?? []

  const columns = useMemo<DataTableColumn<Agencia>[]>(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        width: '110px',
        accessor: (a) => (
          <span className="font-mono text-xs text-muted-foreground">
            {a.codigo || '—'}
          </span>
        ),
        sortValue: (a) => a.codigo ?? '',
      },
      {
        id: 'nombre',
        header: 'Agencia',
        accessor: (a) => (
          <span
            className="text-xs font-medium text-foreground truncate block"
            title={a.nombre}
          >
            {a.nombre}
          </span>
        ),
        sortValue: (a) => a.nombre ?? '',
      },
      {
        id: 'estado',
        header: 'Estado',
        width: '110px',
        accessor: (a) => (
          <StatusBadge
            label={a.activa !== false ? 'Activa' : 'Inactiva'}
            variant={a.activa !== false ? 'active' : 'inactive'}
          />
        ),
        sortValue: (a) => (a.activa !== false ? 1 : 0),
      },
      {
        id: 'canton',
        header: 'Cantón',
        accessor: (a) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            {a.canton ? <MapPin className="h-3 w-3 shrink-0" /> : null}
            <span className="truncate" title={a.canton ?? undefined}>
              {a.canton || '—'}
            </span>
          </div>
        ),
        sortValue: (a) => a.canton ?? '',
      },
      {
        id: 'contacto',
        header: 'Contacto',
        defaultHidden: true,
        accessor: (a) => {
          const telefonoPrincipal =
            a.telefonos?.find((t) => t.principal)?.numero ||
            a.telefonos?.[0]?.numero
          const valor = a.email || telefonoPrincipal || '—'
          return (
            <span
              className="text-xs text-muted-foreground truncate block"
              title={valor}
            >
              {valor}
            </span>
          )
        },
        sortValue: (a) =>
          a.email ||
          a.telefonos?.find((t) => t.principal)?.numero ||
          a.telefonos?.[0]?.numero ||
          '',
      },
    ],
    []
  )

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Agencias"
      icon={<Building2 className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.CREAR}>
          <Button
            onClick={() => navigate({ to: '/agencias/new' })}
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
          searchPlaceholder="Buscar por nombre, código, cantón..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={activa}
            onChange={(v) => filtros.setFilter('activa', v as AgenciasFiltersState['activa'])}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'true', label: 'Activas' },
              { value: 'false', label: 'Inactivas' },
            ]}
            ariaLabel="Estado de la agencia"
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar agencias"
            description={getApiErrorMessage(
              error,
              'No se pudieron cargar las agencias.'
            )}
          />
        ) : (
          <DataTable<Agencia>
            data={agenciasFiltradas}
            columns={columns}
            rowKey={(a) => a.idAgencia!}
            storageKey="agencias"
            isLoading={isLoading}
            emptyState={
              <EmptyState
                title="No se encontraron agencias"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'No hay agencias registradas'
                }
                icon={<Building2 className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.CREAR}>
                      <Button
                        onClick={() => navigate({ to: '/agencias/new' })}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Agencia
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(a) => (
              <AgenciaRowActions
                onVer={() => navigate({ to: `/agencias/${a.idAgencia}` })}
                onEditar={() =>
                  navigate({ to: `/agencias/${a.idAgencia}/edit` })
                }
                onEliminar={() => setAgenciaAEliminar(a.idAgencia!)}
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
        open={!!agenciaAEliminar}
        onOpenChange={(open) => !open && setAgenciaAEliminar(null)}
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
                  ¿Estás seguro de que deseas eliminar esta agencia? Esta acción
                  no se puede deshacer.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAgenciaAEliminar(null)}
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
