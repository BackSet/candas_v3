import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSacas, useDeleteSaca } from '@/hooks/useSacas'
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
import { Eye, Edit, Trash2, Plus, ShoppingBag, MoreHorizontal } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter } from '@/components/filters'
import { useListFilters } from '@/hooks/useListFilters'
import { TamanoSaca, type Saca } from '@/types/saca'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'

const TAMANO_LABELS: Record<string, string> = {
  [TamanoSaca.INDIVIDUAL]: 'Individual',
  [TamanoSaca.PEQUENO]: 'Pequeño',
  [TamanoSaca.MEDIANO]: 'Mediano',
  [TamanoSaca.GRANDE]: 'Grande',
}

interface SacasFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  tamano: string
  idDespacho: string
}

const SACAS_FILTERS_DEFAULTS: SacasFiltersState = {
  page: 0,
  size: 20,
  search: '',
  tamano: 'all',
  idDespacho: '',
}

function SacaRowActions({
  onVer,
  onEditar,
  onEliminar,
}: {
  onVer: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.SACAS.VER, PERMISSIONS.SACAS.EDITAR, PERMISSIONS.SACAS.ELIMINAR]}>
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
          <ProtectedByPermission permission={PERMISSIONS.SACAS.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.SACAS.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.SACAS.ELIMINAR}>
            <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function SacasList() {
  const navigate = useNavigate()

  const filtros = useListFilters<SacasFiltersState>({
    storageKey: 'sacas',
    defaults: SACAS_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.tamano && values.tamano !== 'all') {
        chips.push({
          key: 'tamano',
          label: `Tamaño: ${TAMANO_LABELS[values.tamano] ?? values.tamano}`,
          onRemove: () => removeFilter('tamano'),
        })
      }
      if (values.idDespacho) {
        chips.push({
          key: 'idDespacho',
          label: `Despacho: #${values.idDespacho}`,
          onRemove: () => removeFilter('idDespacho'),
        })
      }
      return chips
    },
  })

  const { page, size, search, tamano, idDespacho } = filtros.values

  const idDespachoNumber =
    idDespacho && /^\d+$/.test(String(idDespacho)) ? Number(idDespacho) : undefined

  const [sacaAEliminar, setSacaAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useSacas({
    page,
    size,
    search: search || undefined,
    tamano: tamano !== 'all' ? tamano : undefined,
    idDespacho: idDespachoNumber,
  })
  const deleteMutation = useDeleteSaca()

  const handleDelete = async () => {
    if (sacaAEliminar) {
      try {
        await deleteMutation.mutateAsync(sacaAEliminar)
        setSacaAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const sacas = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0

  const columns = useMemo<DataTableColumn<Saca>[]>(() => [
    {
      id: 'codigoQr',
      header: 'Código QR',
      accessor: (s) => (
        <span className="font-mono text-xs text-foreground truncate" title={s.codigoQr ?? undefined}>
          {s.codigoQr || '—'}
        </span>
      ),
      sortValue: (s) => s.codigoQr ?? '',
    },
    {
      id: 'orden',
      header: 'Orden',
      width: '90px',
      accessor: (s) => (
        <span className="font-mono text-xs tabular-nums text-foreground">
          {s.numeroOrden ?? '—'}
        </span>
      ),
      sortValue: (s) => s.numeroOrden ?? 0,
    },
    {
      id: 'tamano',
      header: 'Tamaño',
      width: '120px',
      accessor: (s) => <span className="text-xs font-medium text-foreground">{TAMANO_LABELS[s.tamano] ?? s.tamano}</span>,
      sortValue: (s) => s.tamano ?? '',
    },
    {
      id: 'peso',
      header: 'Peso (kg)',
      width: '110px',
      align: 'right',
      accessor: (s) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {s.pesoTotal ?? '—'}
        </span>
      ),
      sortValue: (s) => s.pesoTotal ?? 0,
    },
    {
      id: 'manifiesto',
      header: 'Manifiesto',
      accessor: (s) => (
        <span className="font-mono text-[11px] text-primary truncate" title={s.numeroManifiesto ?? undefined}>
          {s.numeroManifiesto || '—'}
        </span>
      ),
      sortValue: (s) => s.numeroManifiesto ?? '',
    },
  ], [])

  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Sacas"
      icon={<ShoppingBag className="h-4 w-4" />}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.SACAS.CREAR}>
          <Button onClick={() => navigate({ to: '/sacas/new' })} size="sm" className="h-8 shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por código QR o manifiesto..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={tamano}
            onChange={(v) => filtros.setFilter('tamano', v)}
            options={[
              { value: 'all', label: 'Todos los tamaños' },
              { value: TamanoSaca.INDIVIDUAL, label: 'Individual' },
              { value: TamanoSaca.PEQUENO, label: 'Pequeño' },
              { value: TamanoSaca.MEDIANO, label: 'Mediano' },
              { value: TamanoSaca.GRANDE, label: 'Grande' },
            ]}
            ariaLabel="Tamaño de saca"
          />
          <input
            type="number"
            min={1}
            value={idDespacho}
            onChange={(e) => filtros.setFilter('idDespacho', e.target.value)}
            placeholder="ID Despacho"
            className="h-9 w-32 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filtrar por id de despacho"
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar sacas"
            description={
              getInteragencyRestrictionMessage(error)
                ?? getApiErrorMessage(error, 'No se pudieron cargar las sacas.')
            }
          />
        ) : (
          <DataTable<Saca>
            data={sacas}
            columns={columns}
            rowKey={(s) => s.idSaca!}
            storageKey="sacas"
            isLoading={isLoading}
            emptyState={
              <EmptyState
                title="No se encontraron sacas"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'No hay sacas registradas'
                }
                icon={<ShoppingBag className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros ? (
                    <ProtectedByPermission permission={PERMISSIONS.SACAS.CREAR}>
                      <Button onClick={() => navigate({ to: '/sacas/new' })} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Saca
                      </Button>
                    </ProtectedByPermission>
                  ) : undefined
                }
              />
            }
            rowActions={(s) => (
              <SacaRowActions
                onVer={() => navigate({ to: `/sacas/${s.idSaca}` })}
                onEditar={() => navigate({ to: `/sacas/${s.idSaca}/edit` })}
                onEliminar={() => setSacaAEliminar(s.idSaca!)}
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
      <Dialog open={!!sacaAEliminar} onOpenChange={(open) => !open && setSacaAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta saca? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSacaAEliminar(null)} disabled={deleteMutation.isPending}>
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
