import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLotesEspeciales, useDeleteLoteRecepcion } from '@/hooks/useLotesRecepcion'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Tag,
  AlertCircle,
} from 'lucide-react'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ErrorState } from '@/components/states'
import { EmptyState } from '@/components/states/EmptyState'
import { ListPagination } from '@/components/list/ListPagination'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/filters'
import { useListFilters } from '@/hooks/useListFilters'
import { useAgencias } from '@/hooks/useSelectOptions'
import type { LoteRecepcion } from '@/types/lote-recepcion'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'

interface LotesEspecialesFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  idAgencia: number | undefined
  fechaDesde: string
  fechaHasta: string
}

const LOTES_ESPECIALES_FILTERS_DEFAULTS: LotesEspecialesFiltersState = {
  page: 0,
  size: 20,
  search: '',
  idAgencia: undefined,
  fechaDesde: '',
  fechaHasta: '',
}

export default function LotesEspecialesList() {
  const navigate = useNavigate()
  const { data: agenciasOptions = [] } = useAgencias()

  const filtros = useListFilters<LotesEspecialesFiltersState>({
    storageKey: 'lotes-especiales',
    defaults: LOTES_ESPECIALES_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.idAgencia != null) {
        const ag = agenciasOptions.find((a) => a.value === values.idAgencia)
        chips.push({
          key: 'idAgencia',
          label: `Agencia: ${ag?.label ?? values.idAgencia}`,
          onRemove: () => removeFilter('idAgencia'),
        })
      }
      if (values.fechaDesde || values.fechaHasta) {
        const desde = values.fechaDesde || '...'
        const hasta = values.fechaHasta || '...'
        chips.push({
          key: 'fechaRango',
          label: `Fecha: ${desde} → ${hasta}`,
          onRemove: () => filtros.setFilters({ fechaDesde: '', fechaHasta: '' }),
        })
      }
      return chips
    },
  })

  const { page, size, search, idAgencia, fechaDesde, fechaHasta } = filtros.values

  const [loteAEliminar, setLoteAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useLotesEspeciales({
    page,
    size,
    search: search || undefined,
    idAgencia,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  })
  const deleteMutation = useDeleteLoteRecepcion()

  const lotesFiltrados = data?.content || []

  const handleDelete = async () => {
    if (loteAEliminar) {
      try {
        await deleteMutation.mutateAsync(loteAEliminar)
        setLoteAEliminar(null)
      } catch {
        // ya manejado en el hook
      }
    }
  }

  const columns = useMemo<DataTableColumn<LoteRecepcion>[]>(() => [
    {
      id: 'numero',
      header: 'Número',
      width: '220px',
      accessor: (l) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">#{l.idLoteRecepcion}</span>
          <span className="text-xs font-medium text-foreground truncate" title={l.numeroRecepcion ?? undefined}>
            {l.numeroRecepcion || 'Sin número'}
          </span>
        </div>
      ),
      sortValue: (l) => l.numeroRecepcion ?? `#${l.idLoteRecepcion}`,
    },
    {
      id: 'fecha',
      header: 'Fecha',
      width: '130px',
      accessor: (l) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {l.fechaRecepcion
            ? new Date(l.fechaRecepcion).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
      sortValue: (l) => (l.fechaRecepcion ? new Date(l.fechaRecepcion) : null),
    },
    {
      id: 'estado',
      header: 'Despachados / Pendientes',
      width: '180px',
      accessor: (l) => {
        const desp = l.paquetesDespachados ?? 0
        const pend = l.paquetesPendientes ?? 0
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {desp}
            </span>
            <span className="flex items-center gap-1.5 text-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              {pend}
            </span>
          </div>
        )
      },
      sortValue: (l) => l.paquetesPendientes ?? 0,
    },
    {
      id: 'total',
      header: 'Total paq.',
      align: 'right',
      width: '110px',
      defaultHidden: true,
      accessor: (l) => (
        <span className="text-xs font-medium text-foreground tabular-nums">
          {l.totalPaquetes ?? 0}
        </span>
      ),
      sortValue: (l) => l.totalPaquetes ?? 0,
    },
    {
      id: 'agencia',
      header: 'Agencia',
      defaultHidden: true,
      accessor: (l) =>
        l.nombreAgencia ? (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-foreground truncate" title={l.nombreAgencia}>
              {l.nombreAgencia}
            </span>
            {l.cantonAgencia ? (
              <span className="text-[11px] text-muted-foreground truncate">{l.cantonAgencia}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">—</span>
        ),
      sortValue: (l) => l.nombreAgencia ?? '',
    },
    {
      id: 'usuario',
      header: 'Usuario',
      defaultHidden: true,
      accessor: (l) => (
        <span className="text-xs text-muted-foreground">{l.usuarioRegistro || '—'}</span>
      ),
      sortValue: (l) => l.usuarioRegistro ?? '',
    },
  ], [])

  const isLoadingData = isLoading
  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Lotes especiales"
      icon={<Tag className="h-4 w-4" />}
      actions={
        <Button onClick={() => navigate({ to: '/lotes-especiales/new' })} size="sm" className="h-8 shadow-sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuevo
        </Button>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por número o usuario..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={idAgencia != null ? String(idAgencia) : 'all'}
            onChange={(v) => filtros.setFilter('idAgencia', v === 'all' ? undefined : Number(v))}
            options={[
              { value: 'all', label: 'Todas las agencias' },
              ...agenciasOptions.map((a) => ({
                value: String(a.value),
                label: a.label,
                description: a.description,
              })),
            ]}
            ariaLabel="Agencia"
            triggerClassName="w-[220px]"
            searchable
            searchPlaceholder="Buscar por agencia, cantón o provincia..."
          />
          <DateRangeFilter
            desde={fechaDesde}
            hasta={fechaHasta}
            onChange={({ desde, hasta }) => filtros.setFilters({ fechaDesde: desde, fechaHasta: hasta })}
          />
        </FilterBar>
      }
      table={
        error && !isLoadingData ? (
          <ErrorState
            title="Error al cargar los datos"
            description={
              getInteragencyRestrictionMessage(error)
                ?? getApiErrorMessage(error, 'No se pudieron cargar los lotes especiales.')
            }
            icon={<AlertCircle className="h-5 w-5" />}
          />
        ) : (
          <DataTable<LoteRecepcion>
            data={lotesFiltrados}
            columns={columns}
            rowKey={(l) => l.idLoteRecepcion!}
            storageKey="lotes-especiales"
            isLoading={isLoadingData}
            emptyState={
              <EmptyState
                title="No hay lotes especiales"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'Aún no se han registrado lotes especiales'
                }
                icon={<Tag className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <Button onClick={() => navigate({ to: '/lotes-especiales/new' })} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear el primero
                    </Button>
                  )
                }
              />
            }
            rowActions={(l) => (
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
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate({ to: `/lotes-especiales/${l.idLoteRecepcion}` })}>
                    <Eye className="h-3.5 w-3.5 mr-2" /> Abrir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: `/lotes-especiales/${l.idLoteRecepcion}/edit` })}>
                    <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLoteAEliminar(l.idLoteRecepcion!)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        )
      }
      footer={
        <ListPagination
          page={data?.number || 0}
          totalPages={data?.totalPages || 0}
          totalItems={data?.totalElements}
          size={size}
          onPageChange={(p) => filtros.setFilter('page', p)}
          alwaysShow
          className="border-t-0 pt-0"
        />
      }
    >
      <Dialog open={!!loteAEliminar} onOpenChange={(open) => !open && setLoteAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este lote especial? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLoteAEliminar(null)}
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
