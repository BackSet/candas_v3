import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAtencionPaquetes, useAtencionPaquetesPendientes, useDeleteAtencionPaquete } from '@/hooks/useAtencionPaquetes'
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
  EstadoAtencion,
  TipoProblemaAtencion,
  TIPO_PROBLEMA_ATENCION_LABELS,
  getTipoProblemaLabel,
  type AtencionPaquete,
} from '@/types/atencion-paquete'
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Printer,
  Loader2,
  CheckCircle,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react'
import { notify } from '@/lib/notify'
import { paqueteService } from '@/lib/api/paquete.service'
import { imprimirAtencionPaquetes } from '@/utils/imprimirAtencionPaquetes'
import type { Paquete } from '@/types/paquete'
import ResolverDialog from './ResolverDialog'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/filters'
import { useListFilters } from '@/hooks/useListFilters'
import {
  showProcessError,
  showProcessStart,
  showProcessSuccess,
} from '@/hooks/mutationFeedback'
import { getApiErrorMessage } from '@/lib/api/errors'

const ESTADO_ATENCION_LABELS: Record<string, string> = {
  [EstadoAtencion.PENDIENTE]: 'Pendiente',
  [EstadoAtencion.EN_REVISION]: 'En revisión',
  [EstadoAtencion.RESUELTO]: 'Resuelto',
  [EstadoAtencion.CANCELADO]: 'Cancelado',
}

interface AtencionPaquetesFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  estado: string
  tipoProblema: string
  fechaDesde: string
  fechaHasta: string
}

const ATENCION_PAQUETES_FILTERS_DEFAULTS: AtencionPaquetesFiltersState = {
  page: 0,
  size: 20,
  search: '',
  estado: 'all',
  tipoProblema: 'all',
  fechaDesde: '',
  fechaHasta: '',
}

function AtencionRowActions({
  onVer,
  onResolver,
  onEditar,
  onEliminar,
}: {
  onVer: () => void
  onResolver: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.ATENCION_PAQUETES.VER, PERMISSIONS.ATENCION_PAQUETES.EDITAR, PERMISSIONS.ATENCION_PAQUETES.ELIMINAR]}>
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
          <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
            <DropdownMenuItem onClick={onResolver}>
              <CheckCircle className="h-3.5 w-3.5 mr-2" /> Resolver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          </ProtectedByPermission>
          <DropdownMenuSeparator />
          <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.ELIMINAR}>
            <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

export default function AtencionPaquetesList() {
  const navigate = useNavigate()

  const filtros = useListFilters<AtencionPaquetesFiltersState>({
    storageKey: 'atencion-paquetes',
    defaults: ATENCION_PAQUETES_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.estado && values.estado !== 'all') {
        chips.push({
          key: 'estado',
          label: `Estado: ${ESTADO_ATENCION_LABELS[values.estado] ?? values.estado}`,
          onRemove: () => removeFilter('estado'),
        })
      }
      if (values.tipoProblema && values.tipoProblema !== 'all') {
        chips.push({
          key: 'tipoProblema',
          label: `Tipo: ${getTipoProblemaLabel(values.tipoProblema)}`,
          onRemove: () => removeFilter('tipoProblema'),
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

  const { page, size, search, estado, tipoProblema, fechaDesde, fechaHasta } = filtros.values

  const [atencionAEliminar, setAtencionAEliminar] = useState<number | null>(null)
  const [atencionParaSolucion, setAtencionParaSolucion] = useState<number | null>(null)
  const [atencionesSeleccionadas, setAtencionesSeleccionadas] = useState<Set<string | number>>(new Set())
  const [exportando, setExportando] = useState(false)

  const { data, isLoading, error } = useAtencionPaquetes({
    page,
    size,
    estado: estado !== 'all' ? estado : undefined,
    search: search || undefined,
    tipoProblema: tipoProblema !== 'all' ? tipoProblema : undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  })
  const { data: pendientes } = useAtencionPaquetesPendientes()
  const deleteMutation = useDeleteAtencionPaquete()

  const handleDelete = async () => {
    if (atencionAEliminar) {
      try {
        await deleteMutation.mutateAsync(atencionAEliminar)
        setAtencionAEliminar(null)
      } catch { /* hook */ }
    }
  }

  const atencionesFiltradas = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0

  const handleToggleAll = (rows: AtencionPaquete[]) => {
    const allSelected = rows.length > 0 && rows.every((r) => atencionesSeleccionadas.has(r.idAtencion!))
    if (allSelected) {
      setAtencionesSeleccionadas(new Set())
    } else {
      setAtencionesSeleccionadas(new Set(rows.map((r) => r.idAtencion!)))
    }
  }

  const handleToggleOne = (id: string | number) => {
    setAtencionesSeleccionadas((prev) => {
      const next = new Set(prev)
      const numId = Number(id)
      if (next.has(numId)) next.delete(numId)
      else next.add(numId)
      return next
    })
  }

  const handleExportarSeleccionadas = async () => {
    const atencionesParaExportar = atencionesFiltradas.filter((a) =>
      atencionesSeleccionadas.has(a.idAtencion!)
    )
    if (atencionesParaExportar.length === 0) {
      notify.error('No hay atenciones seleccionadas')
      return
    }
    setExportando(true)
    const toastId = showProcessStart('Preparando impresión de atenciones...')
    try {
      const paquetesPromises = atencionesParaExportar.map((atencion) =>
        paqueteService.findById(atencion.idPaquete).catch(() => ({
          idPaquete: atencion.idPaquete,
          numeroGuia: atencion.numeroGuia,
        } as Paquete))
      )
      const paquetes = await Promise.all(paquetesPromises)
      const paquetesMap = new Map<number, Paquete>()
      paquetes.forEach((p) => { if (p.idPaquete) paquetesMap.set(p.idPaquete, p) })

      const paquetesClementina = paquetes.filter((p) => p.tipoPaquete === 'CLEMENTINA' && p.idPaquete)
      const hijosPromises = paquetesClementina.map((paquete) =>
        paqueteService.findHijos(paquete.idPaquete!).then((hijos) => ({
          idPaquetePadre: paquete.idPaquete!, hijos,
        })).catch(() => ({ idPaquetePadre: paquete.idPaquete!, hijos: [] as Paquete[] }))
      )
      const hijosResultados = await Promise.all(hijosPromises)
      const hijosMap = new Map<number, Paquete[]>()
      hijosResultados.forEach(({ idPaquetePadre, hijos }) => {
        hijosMap.set(idPaquetePadre, hijos)
        hijos.forEach((hijo) => { if (hijo.idPaquete) paquetesMap.set(hijo.idPaquete, hijo) })
      })

      imprimirAtencionPaquetes(atencionesParaExportar, paquetesMap, hijosMap)
      showProcessSuccess(
        toastId,
        `Se generó el PDF con ${atencionesParaExportar.length} paquete(s) para impresión`
      )
    } catch (error: unknown) {
      showProcessError(toastId, error, 'No se pudo exportar las atenciones seleccionadas.')
    } finally {
      setExportando(false)
    }
  }

  const columns = useMemo<DataTableColumn<AtencionPaquete>[]>(() => [
    {
      id: 'guia',
      header: 'Guía',
      width: '200px',
      accessor: (a) => (
        <div className="flex flex-col min-w-0">
          <span
            className="font-mono text-xs font-semibold text-foreground hover:text-primary cursor-pointer truncate"
            onClick={() => navigate({ to: `/atencion-paquetes/${a.idAtencion}` })}
            title={a.numeroGuia ?? `#${a.idPaquete}`}
          >
            {a.numeroGuia || `#${a.idPaquete}`}
          </span>
          {a.numeroGuia && (
            <span className="text-[10px] text-muted-foreground/60">ID: {a.idPaquete}</span>
          )}
        </div>
      ),
      sortValue: (a) => a.numeroGuia ?? `#${a.idPaquete}`,
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '120px',
      accessor: (a) => (
        <StatusBadge
          label={a.estado}
          variant={
            a.estado === EstadoAtencion.RESUELTO
              ? 'completed'
              : a.estado === EstadoAtencion.PENDIENTE
                ? 'pending'
                : 'in-progress'
          }
        />
      ),
      sortValue: (a) => a.estado ?? '',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      width: '160px',
      accessor: (a) => (
        <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground bg-muted/30 border-border/40 px-2 py-0.5 rounded-md">
          {getTipoProblemaLabel(a.tipoProblema)}
        </Badge>
      ),
      sortValue: (a) => getTipoProblemaLabel(a.tipoProblema),
    },
    {
      id: 'motivo',
      header: 'Motivo',
      accessor: (a) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[320px]" title={a.motivo}>
          {a.motivo}
        </p>
      ),
      sortValue: (a) => a.motivo ?? '',
    },
    {
      id: 'fecha',
      header: 'Fecha',
      width: '150px',
      accessor: (a) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>{a.fechaSolicitud ? new Date(a.fechaSolicitud).toLocaleDateString() : '—'}</span>
          {a.fechaSolicitud && (
            <span className="text-[10px] text-muted-foreground/50">
              {new Date(a.fechaSolicitud).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      ),
      sortValue: (a) => (a.fechaSolicitud ? new Date(a.fechaSolicitud) : null),
    },
  ], [navigate])

  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Atención Paquetes"
      subtitle="Gestión de incidencias y problemas"
      icon={<AlertCircle className="h-4 w-4" />}
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          {atencionesSeleccionadas.size > 0 && (
            <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportarSeleccionadas}
                disabled={exportando}
                className="h-8 text-xs shadow-sm"
              >
                {exportando ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generando...</>
                ) : (
                  <><Printer className="h-3.5 w-3.5 mr-1.5" />Imprimir ({atencionesSeleccionadas.size})</>
                )}
              </Button>
            </ProtectedByPermission>
          )}
          <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.CREAR}>
            <Button onClick={() => navigate({ to: '/atencion-paquetes/new' })} size="sm" className="h-8 shadow-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nuevo
            </Button>
          </ProtectedByPermission>
        </div>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por guía, motivo o tipo..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
          trailing={
            pendientes && pendientes.length > 0 ? (
              <Button
                type="button"
                variant={estado === EstadoAtencion.PENDIENTE ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  filtros.setFilter(
                    'estado',
                    estado === EstadoAtencion.PENDIENTE ? 'all' : EstadoAtencion.PENDIENTE,
                  )
                }
                className="h-9 text-xs"
              >
                Pendientes
                <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
                  {pendientes.length}
                </span>
              </Button>
            ) : undefined
          }
        >
          <SelectFilter
            value={estado}
            onChange={(v) => filtros.setFilter('estado', v)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: EstadoAtencion.PENDIENTE, label: 'Pendiente' },
              { value: EstadoAtencion.EN_REVISION, label: 'En revisión' },
              { value: EstadoAtencion.RESUELTO, label: 'Resuelto' },
              { value: EstadoAtencion.CANCELADO, label: 'Cancelado' },
            ]}
            ariaLabel="Estado de atención"
          />
          <SelectFilter
            value={tipoProblema}
            onChange={(v) => filtros.setFilter('tipoProblema', v)}
            options={[
              { value: 'all', label: 'Todos los tipos' },
              ...Object.values(TipoProblemaAtencion).map((t) => ({
                value: t,
                label: TIPO_PROBLEMA_ATENCION_LABELS[t],
              })),
            ]}
            ariaLabel="Tipo de problema"
            triggerClassName="w-[240px]"
            searchable
            searchPlaceholder="Buscar tipo..."
          />
          <DateRangeFilter
            desde={fechaDesde}
            hasta={fechaHasta}
            onChange={({ desde, hasta }) => filtros.setFilters({ fechaDesde: desde, fechaHasta: hasta })}
          />
        </FilterBar>
      }
      table={
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar las atenciones"
            description={getApiErrorMessage(error, 'No se pudieron cargar las atenciones de paquetes.')}
            icon={<AlertCircle className="h-5 w-5" />}
          />
        ) : (
          <DataTable<AtencionPaquete>
            data={atencionesFiltradas}
            columns={columns}
            rowKey={(a) => a.idAtencion!}
            storageKey="atencion-paquetes"
            isLoading={isLoading}
            selection={{
              selected: atencionesSeleccionadas,
              getId: (a) => a.idAtencion!,
              onToggle: handleToggleOne,
              onToggleAll: handleToggleAll,
            }}
            emptyState={
              <EmptyState
                title="No hay solicitudes"
                description={
                  hayFiltros
                    ? 'No se encontraron resultados para los filtros seleccionados'
                    : 'No hay solicitudes de atención registradas.'
                }
                icon={<AlertCircle className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros ? (
                    <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.CREAR}>
                      <Button onClick={() => navigate({ to: '/atencion-paquetes/new' })} variant="outline" size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Nuevo
                      </Button>
                    </ProtectedByPermission>
                  ) : undefined
                }
              />
            }
            rowActions={(a) => (
              <AtencionRowActions
                onVer={() => navigate({ to: `/atencion-paquetes/${a.idAtencion}` })}
                onResolver={() => setAtencionParaSolucion(a.idAtencion!)}
                onEditar={() => navigate({ to: `/atencion-paquetes/${a.idAtencion}/edit` })}
                onEliminar={() => setAtencionAEliminar(a.idAtencion!)}
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
      <Dialog open={!!atencionAEliminar} onOpenChange={(open) => !open && setAtencionAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta solicitud de atención? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtencionAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {atencionParaSolucion && (
        <ResolverDialog
          atencionId={atencionParaSolucion}
          open={!!atencionParaSolucion}
          onOpenChange={(open) => !open && setAtencionParaSolucion(null)}
          allowEstadoChange
        />
      )}
    </ListPageLayout>
  )
}
