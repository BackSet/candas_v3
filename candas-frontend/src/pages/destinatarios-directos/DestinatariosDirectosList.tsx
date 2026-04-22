import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useDestinatariosDirectos,
  useDeleteDestinatarioDirecto,
} from '@/hooks/useDestinatariosDirectos'
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
  Home,
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
import type { DestinatarioDirecto } from '@/types/destinatario-directo'
import { getApiErrorMessage } from '@/lib/api/errors'

interface DestinatariosFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activo: 'all' | 'true' | 'false'
}

const DESTINATARIOS_FILTERS_DEFAULTS: DestinatariosFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activo: 'all',
}

function DestinatarioRowActions({
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
        PERMISSIONS.DESTINATARIOS_DIRECTOS.VER,
        PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR,
        PERMISSIONS.DESTINATARIOS_DIRECTOS.ELIMINAR,
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
          <ProtectedByPermission
            permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.VER}
          >
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission
            permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR}
          >
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission
            permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.ELIMINAR}
          >
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

export default function DestinatariosDirectosList() {
  const navigate = useNavigate()
  const filtros = useListFilters<DestinatariosFiltersState>({
    storageKey: 'destinatarios-directos',
    defaults: DESTINATARIOS_FILTERS_DEFAULTS,
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

  const [destinatarioAEliminar, setDestinatarioAEliminar] = useState<
    number | null
  >(null)

  const { data, isLoading, error } = useDestinatariosDirectos({
    page,
    size,
    search: search || undefined,
    activo: activoBool,
  })
  const deleteMutation = useDeleteDestinatarioDirecto()

  const handleDelete = async () => {
    if (destinatarioAEliminar) {
      try {
        await deleteMutation.mutateAsync(destinatarioAEliminar)
        setDestinatarioAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  const destinatariosFiltrados = data?.content ?? []

  const columns = useMemo<DataTableColumn<DestinatarioDirecto>[]>(
    () => [
      {
        id: 'nombre',
        header: 'Nombre',
        accessor: (d) => (
          <div className="flex flex-col min-w-0">
            <span
              className="text-xs font-medium text-foreground truncate"
              title={d.nombreDestinatario}
            >
              {d.nombreDestinatario}
            </span>
            {d.nombreEmpresa ? (
              <span
                className="text-[11px] text-muted-foreground truncate"
                title={d.nombreEmpresa}
              >
                {d.nombreEmpresa}
              </span>
            ) : null}
          </div>
        ),
        sortValue: (d) => d.nombreDestinatario ?? '',
      },
      {
        id: 'telefono',
        header: 'Teléfono',
        width: '160px',
        accessor: (d) => (
          <span className="font-mono text-xs text-muted-foreground">
            {d.telefonoDestinatario || '—'}
          </span>
        ),
        sortValue: (d) => d.telefonoDestinatario ?? '',
      },
      {
        id: 'codigo',
        header: 'Código',
        width: '110px',
        defaultHidden: true,
        accessor: (d) => (
          <span className="font-mono text-xs text-muted-foreground">
            {d.codigo || '—'}
          </span>
        ),
        sortValue: (d) => d.codigo ?? '',
      },
      {
        id: 'direccion',
        header: 'Dirección',
        accessor: (d) => (
          <span
            className="text-xs text-muted-foreground truncate block max-w-xs"
            title={d.direccionDestinatario ?? undefined}
          >
            {d.direccionDestinatario || '—'}
          </span>
        ),
        sortValue: (d) => d.direccionDestinatario ?? '',
      },
      {
        id: 'estado',
        header: 'Estado',
        width: '110px',
        accessor: (d) => (
          <StatusBadge
            label={d.activo !== false ? 'Activo' : 'Inactivo'}
            variant={d.activo !== false ? 'active' : 'inactive'}
          />
        ),
        sortValue: (d) => (d.activo !== false ? 1 : 0),
      },
      {
        id: 'registro',
        header: 'Registro',
        defaultHidden: true,
        width: '130px',
        accessor: (d) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {d.fechaRegistro
              ? new Date(d.fechaRegistro).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        ),
        sortValue: (d) =>
          d.fechaRegistro ? new Date(d.fechaRegistro) : null,
      },
    ],
    []
  )

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Destinatarios"
      icon={<Home className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission
          permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}
        >
          <Button
            onClick={() => navigate({ to: '/destinatarios-directos/new' })}
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
          searchPlaceholder="Buscar por nombre, teléfono o código..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={activo}
            onChange={(v) => filtros.setFilter('activo', v as DestinatariosFiltersState['activo'])}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            ariaLabel="Estado del destinatario"
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar destinatarios"
            description={getApiErrorMessage(
              error,
              'No se pudieron cargar los destinatarios.'
            )}
          />
        ) : (
          <DataTable<DestinatarioDirecto>
            data={destinatariosFiltrados}
            columns={columns}
            rowKey={(d) => d.idDestinatarioDirecto!}
            storageKey="destinatarios-directos"
            isLoading={isLoading}
            emptyState={
              <EmptyState
                title="No se encontraron destinatarios"
                description={
                  hayFiltros
                    ? 'No hay resultados con los filtros aplicados'
                    : 'No hay destinatarios registrados'
                }
                icon={<Home className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission
                      permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}
                    >
                      <Button
                        onClick={() =>
                          navigate({ to: '/destinatarios-directos/new' })
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Destinatario
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(d) => (
              <DestinatarioRowActions
                onVer={() =>
                  navigate({
                    to: `/destinatarios-directos/${d.idDestinatarioDirecto}`,
                  })
                }
                onEditar={() =>
                  navigate({
                    to: `/destinatarios-directos/${d.idDestinatarioDirecto}/edit`,
                  })
                }
                onEliminar={() =>
                  setDestinatarioAEliminar(d.idDestinatarioDirecto!)
                }
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
        open={!!destinatarioAEliminar}
        onOpenChange={(open) => !open && setDestinatarioAEliminar(null)}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-destructive/5">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <div className="h-8 w-8 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </div>
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el destinatario directo.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar este destinatario directo?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <Button
              variant="outline"
              onClick={() => setDestinatarioAEliminar(null)}
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
