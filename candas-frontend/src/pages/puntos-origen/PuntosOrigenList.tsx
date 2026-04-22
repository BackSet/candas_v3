import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePuntosOrigen, useDeletePuntoOrigen } from '@/hooks/usePuntosOrigen'
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
import { Eye, Edit, Trash2, Plus, MapPin, MoreHorizontal } from 'lucide-react'
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
import type { PuntoOrigen } from '@/types/punto-origen'
import { getApiErrorMessage } from '@/lib/api/errors'

interface PuntosOrigenFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activo: 'all' | 'true' | 'false'
}

const PUNTOS_ORIGEN_FILTERS_DEFAULTS: PuntosOrigenFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activo: 'all',
}

function PuntoOrigenRowActions({
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
        PERMISSIONS.PUNTOS_ORIGEN.VER,
        PERMISSIONS.PUNTOS_ORIGEN.EDITAR,
        PERMISSIONS.PUNTOS_ORIGEN.ELIMINAR,
      ]}
    >
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
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.ELIMINAR}>
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

export default function PuntosOrigenList() {
  const navigate = useNavigate()
  const filtros = useListFilters<PuntosOrigenFiltersState>({
    storageKey: 'puntos-origen',
    defaults: PUNTOS_ORIGEN_FILTERS_DEFAULTS,
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
          label: values.activo === 'true' ? 'Activos' : 'Inactivos',
          onRemove: () => removeFilter('activo'),
        })
      }
      return chips
    },
  })
  const { page, size, search, activo } = filtros.values
  const activoBool = activo === 'all' ? undefined : activo === 'true'

  const [origenAEliminar, setOrigenAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = usePuntosOrigen({
    page,
    size,
    search: search || undefined,
    activo: activoBool,
  })
  const deleteMutation = useDeletePuntoOrigen()

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

  const origenesFiltrados = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const hayFiltros = filtros.hasActiveFilters

  const columns = useMemo<DataTableColumn<PuntoOrigen>[]>(
    () => [
      {
        id: 'nombre',
        header: 'Nombre',
        accessor: (o) => (
          <span
            className="text-xs font-medium text-foreground truncate"
            title={o.nombrePuntoOrigen}
          >
            {o.nombrePuntoOrigen}
          </span>
        ),
        sortValue: (o) => o.nombrePuntoOrigen ?? '',
      },
      {
        id: 'estado',
        header: 'Estado',
        width: '120px',
        accessor: (o) => (
          <StatusBadge
            label={o.activo !== false ? 'Activo' : 'Inactivo'}
            variant={o.activo !== false ? 'active' : 'inactive'}
          />
        ),
        sortValue: (o) => (o.activo !== false ? 1 : 0),
      },
    ],
    []
  )

  return (
    <ListPageLayout
      title="Puntos de Origen"
      icon={<MapPin className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.CREAR}>
          <Button
            onClick={() => navigate({ to: '/puntos-origen/new' })}
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
          searchPlaceholder="Buscar por nombre..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={activo}
            onChange={(v) => filtros.setFilter('activo', v as PuntosOrigenFiltersState['activo'])}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            ariaLabel="Estado del punto de origen"
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar puntos de origen"
            description={getApiErrorMessage(
              error,
              'No se pudieron cargar los puntos de origen.'
            )}
          />
        ) : (
          <DataTable<PuntoOrigen>
            data={origenesFiltrados}
            columns={columns}
            rowKey={(o) => o.idPuntoOrigen!}
            storageKey="puntos-origen"
            isLoading={isLoading}
            emptyState={
              <EmptyState
                title="No se encontraron puntos de origen"
                description={
                  hayFiltros
                    ? 'No hay resultados con los filtros aplicados'
                    : 'No hay puntos de origen registrados'
                }
                icon={<MapPin className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.PUNTOS_ORIGEN.CREAR}>
                      <Button
                        onClick={() => navigate({ to: '/puntos-origen/new' })}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Punto de Origen
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(o) => (
              <PuntoOrigenRowActions
                onVer={() => navigate({ to: `/puntos-origen/${o.idPuntoOrigen}` })}
                onEditar={() => navigate({ to: `/puntos-origen/${o.idPuntoOrigen}/edit` })}
                onEliminar={() => setOrigenAEliminar(o.idPuntoOrigen!)}
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
    </ListPageLayout>
  )
}
