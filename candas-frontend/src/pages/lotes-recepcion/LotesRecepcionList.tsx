import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLotesRecepcion, useDeleteLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useQueryClient } from '@tanstack/react-query'
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
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Upload,
  MoreHorizontal,
  Package2,
  AlertCircle,
} from 'lucide-react'
import ImportarPaquetesDialog from './ImportarPaquetesDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/utils'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ErrorState } from '@/components/states'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/filters'
import { useListFilters } from '@/hooks/useListFilters'
import { useAgencias } from '@/hooks/useSelectOptions'
import type { LoteRecepcion } from '@/types/lote-recepcion'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'

interface LotesRecepcionFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  tipoLote: string
  idAgencia: number | undefined
  fechaDesde: string
  fechaHasta: string
}

const LOTES_RECEPCION_FILTERS_DEFAULTS: LotesRecepcionFiltersState = {
  page: 0,
  size: 20,
  search: '',
  tipoLote: 'all',
  idAgencia: undefined,
  fechaDesde: '',
  fechaHasta: '',
}

const TIPO_LOTE_LABELS: Record<string, string> = {
  all: 'Todos',
  NORMAL: 'Normal',
  ESPECIAL: 'Especial',
}

function LoteRecepcionRowActions({
  onAbrir,
  onImportar,
  onEditar,
  onEliminar,
}: {
  onAbrir: () => void
  onImportar: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.LOTES_RECEPCION.VER, PERMISSIONS.LOTES_RECEPCION.EDITAR, PERMISSIONS.LOTES_RECEPCION.ELIMINAR]}>
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
          <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.VER}>
            <DropdownMenuItem onClick={onAbrir}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Abrir
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.EDITAR}>
            <DropdownMenuItem onClick={onImportar}>
              <Upload className="h-3.5 w-3.5 mr-2" /> Importar paquetes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.ELIMINAR}>
            <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function LotesRecepcionList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: agenciasOptions = [] } = useAgencias()

  const filtros = useListFilters<LotesRecepcionFiltersState>({
    storageKey: 'lotes-recepcion',
    defaults: LOTES_RECEPCION_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.tipoLote && values.tipoLote !== 'all') {
        chips.push({
          key: 'tipoLote',
          label: `Tipo: ${TIPO_LOTE_LABELS[values.tipoLote] ?? values.tipoLote}`,
          onRemove: () => removeFilter('tipoLote'),
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

  const { page, size, search, tipoLote, idAgencia, fechaDesde, fechaHasta } = filtros.values

  const [loteRecepcionAEliminar, setLoteRecepcionAEliminar] = useState<number | null>(null)
  const [loteRecepcionParaImportar, setLoteRecepcionParaImportar] = useState<number | null>(null)

  const { data, isLoading, error } = useLotesRecepcion({
    page,
    size,
    search: search || undefined,
    tipoLote: tipoLote && tipoLote !== 'all' ? tipoLote : undefined,
    idAgencia: idAgencia,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  })
  const deleteMutation = useDeleteLoteRecepcion()

  const lotesRecepcionFiltrados = data?.content || []

  const handleDelete = async () => {
    if (loteRecepcionAEliminar) {
      try {
        await deleteMutation.mutateAsync(loteRecepcionAEliminar)
        setLoteRecepcionAEliminar(null)
      } catch (_error) {
        // ya manejado en el hook
      }
    }
  }

  const columns = useMemo<DataTableColumn<LoteRecepcion>[]>(() => [
    {
      id: 'numero',
      header: 'Número',
      accessor: (l) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">#{l.idLoteRecepcion}</span>
          <span className="text-xs font-medium text-foreground truncate" title={l.numeroRecepcion ?? undefined}>
            {l.numeroRecepcion || 'Sin número'}
          </span>
        </div>
      ),
      sortValue: (l) => l.numeroRecepcion ?? `#${l.idLoteRecepcion}`,
      width: '220px',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      width: '110px',
      accessor: (l) => (
        <Badge
          variant="secondary"
          className={cn(
            'text-[11px] font-medium',
            l.tipoLote === 'ESPECIAL'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {l.tipoLote === 'ESPECIAL' ? 'Especial' : 'Normal'}
        </Badge>
      ),
      sortValue: (l) => l.tipoLote ?? '',
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
      title="Lotes de Recepción"
      icon={<Package2 className="h-4 w-4" />}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.CREAR}>
          <Button onClick={() => navigate({ to: '/lotes-recepcion/new' })} size="sm" className="h-8 shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
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
            value={tipoLote}
            onChange={(v) => filtros.setFilter('tipoLote', v)}
            options={[
              { value: 'all', label: 'Todos los tipos' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'ESPECIAL', label: 'Especial' },
            ]}
            ariaLabel="Tipo de lote"
          />
          <SelectFilter
            value={idAgencia != null ? String(idAgencia) : 'all'}
            onChange={(v) =>
              filtros.setFilter('idAgencia', v === 'all' ? undefined : Number(v))
            }
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
                ?? getApiErrorMessage(error, 'No se pudieron cargar los lotes de recepción.')
            }
            icon={<AlertCircle className="h-5 w-5" />}
          />
        ) : (
          <DataTable<LoteRecepcion>
            data={lotesRecepcionFiltrados}
            columns={columns}
            rowKey={(l) => l.idLoteRecepcion!}
            storageKey="lotes-recepcion"
            isLoading={isLoadingData}
            emptyState={
              <EmptyState
                title="No se encontraron lotes de recepción"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'No hay lotes de recepción registrados'
                }
                icon={<Package2 className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.CREAR}>
                      <Button onClick={() => navigate({ to: '/lotes-recepcion/new' })} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Lote
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(l) => (
              <LoteRecepcionRowActions
                onAbrir={() => navigate({ to: `/lotes-recepcion/${l.idLoteRecepcion}` })}
                onImportar={() => setLoteRecepcionParaImportar(l.idLoteRecepcion!)}
                onEditar={() => navigate({ to: `/lotes-recepcion/${l.idLoteRecepcion}/edit` })}
                onEliminar={() => setLoteRecepcionAEliminar(l.idLoteRecepcion!)}
              />
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
      <Dialog open={!!loteRecepcionAEliminar} onOpenChange={(open) => !open && setLoteRecepcionAEliminar(null)}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-destructive/10">
            <DialogTitle className="text-destructive">Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este lote de recepción? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLoteRecepcionAEliminar(null)}
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

      {loteRecepcionParaImportar && (
        <ImportarPaquetesDialog
          recepcionId={loteRecepcionParaImportar}
          open={!!loteRecepcionParaImportar}
          onOpenChange={(open) => !open && setLoteRecepcionParaImportar(null)}
          onImportSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['lotes-recepcion'] })
            queryClient.invalidateQueries({ queryKey: ['lotes-recepcion-paquetes'] })
          }}
        />
      )}
    </ListPageLayout>
  )
}
