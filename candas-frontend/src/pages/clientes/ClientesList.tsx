import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useClientes, useDeleteCliente } from '@/hooks/useClientes'
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
  MoreHorizontal,
  Users,
} from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { ListPagination } from '@/components/list/ListPagination'
import { PERMISSIONS } from '@/types/permissions'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import { useListFilters } from '@/hooks/useListFilters'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter } from '@/components/filters'
import type { Cliente } from '@/types/cliente'
import { getApiErrorMessage } from '@/lib/api/errors'

interface ClientesFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  activo: 'all' | 'true' | 'false'
}

const CLIENTES_FILTERS_DEFAULTS: ClientesFiltersState = {
  page: 0,
  size: 20,
  search: '',
  activo: 'all',
}

function ClienteRowActions({
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
        PERMISSIONS.CLIENTES.VER,
        PERMISSIONS.CLIENTES.EDITAR,
        PERMISSIONS.CLIENTES.ELIMINAR,
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
          <ProtectedByPermission permission={PERMISSIONS.CLIENTES.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.CLIENTES.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.CLIENTES.ELIMINAR}>
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

export default function ClientesList() {
  const navigate = useNavigate()
  const filtros = useListFilters<ClientesFiltersState>({
    storageKey: 'clientes',
    defaults: CLIENTES_FILTERS_DEFAULTS,
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

  const [clienteAEliminar, setClienteAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useClientes({
    page,
    size,
    search: search || undefined,
    activo: activoBool,
  })
  const deleteMutation = useDeleteCliente()

  const handleDelete = async () => {
    if (clienteAEliminar) {
      try {
        await deleteMutation.mutateAsync(clienteAEliminar)
        setClienteAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  const clientesFiltrados = data?.content ?? []

  const columns = useMemo<DataTableColumn<Cliente>[]>(
    () => [
      {
        id: 'documento',
        header: 'Documento',
        width: '150px',
        accessor: (c) => (
          <span className="font-mono text-xs text-muted-foreground">
            {c.documentoIdentidad || '—'}
          </span>
        ),
        sortValue: (c) => c.documentoIdentidad ?? '',
      },
      {
        id: 'nombre',
        header: 'Nombre',
        accessor: (c) => (
          <span
            className="text-xs font-medium text-foreground truncate block"
            title={c.nombreCompleto}
          >
            {c.nombreCompleto}
          </span>
        ),
        sortValue: (c) => c.nombreCompleto ?? '',
      },
      {
        id: 'estado',
        header: 'Estado',
        width: '110px',
        accessor: (c) => (
          <StatusBadge
            label={c.activo !== false ? 'Activo' : 'Inactivo'}
            variant={c.activo !== false ? 'active' : 'inactive'}
          />
        ),
        sortValue: (c) => (c.activo !== false ? 1 : 0),
      },
      {
        id: 'email',
        header: 'Email',
        accessor: (c) => (
          <span
            className="text-xs text-foreground truncate block"
            title={c.email ?? undefined}
          >
            {c.email || '—'}
          </span>
        ),
        sortValue: (c) => c.email ?? '',
      },
      {
        id: 'telefono',
        header: 'Teléfono',
        defaultHidden: true,
        width: '160px',
        accessor: (c) => (
          <span className="font-mono text-xs text-muted-foreground">
            {c.telefono || '—'}
          </span>
        ),
        sortValue: (c) => c.telefono ?? '',
      },
    ],
    []
  )

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Clientes"
      icon={<Users className="h-4 w-4" />}
      className="py-2 animate-in fade-in duration-500"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.CLIENTES.CREAR}>
          <Button
            onClick={() => navigate({ to: '/clientes/new' })}
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
          searchPlaceholder="Buscar por nombre, documento o teléfono..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={activo}
            onChange={(v) => filtros.setFilter('activo', v as ClientesFiltersState['activo'])}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            ariaLabel="Estado del cliente"
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar clientes"
            description={getApiErrorMessage(
              error,
              'No se pudieron cargar los clientes.'
            )}
          />
        ) : (
          <DataTable<Cliente>
            data={clientesFiltrados}
            columns={columns}
            rowKey={(c) => c.idCliente!}
            storageKey="clientes"
            isLoading={isLoading}
            emptyState={
              <EmptyState
                title="No se encontraron clientes"
                description={
                  hayFiltros
                    ? 'No hay resultados con los filtros aplicados'
                    : 'No hay clientes registrados'
                }
                icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.CLIENTES.CREAR}>
                      <Button
                        onClick={() => navigate({ to: '/clientes/new' })}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Cliente
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(c) => (
              <ClienteRowActions
                onVer={() => navigate({ to: `/clientes/${c.idCliente}` })}
                onEditar={() =>
                  navigate({ to: `/clientes/${c.idCliente}/edit` })
                }
                onEliminar={() => setClienteAEliminar(c.idCliente!)}
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
        open={!!clienteAEliminar}
        onOpenChange={(open) => !open && setClienteAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClienteAEliminar(null)}
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
