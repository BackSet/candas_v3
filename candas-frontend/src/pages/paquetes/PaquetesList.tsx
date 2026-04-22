import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePaquetes, useDeletePaquete } from '@/hooks/usePaquetes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogContentPresets,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EstadoPaquete, TipoPaquete } from '@/types/paquete'
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Upload,
  Printer,
  Package,
  MoreHorizontal,
  PackagePlus,
  PackageMinus,
  Link2,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { notify } from '@/lib/notify'
import ImportarPaquetesDialog from './ImportarPaquetesDialog'
import ImportarRefDialog from './ImportarRefDialog'
import ImportarActualizarPaquetesDialog from './ImportarActualizarPaquetesDialog'
import ImportarPaquetesEspecialesMiamiDialog from './ImportarPaquetesEspecialesMiamiDialog'
import AsociarClementinaLoteDialog from './AsociarClementinaLoteDialog'
import AsociarCadenitaDialog from './AsociarCadenitaDialog'
import AsociarSepararDialog from './AsociarSepararDialog'
import ImprimirPaqueteDialog, { type ModoImpresionPaquete } from '@/components/paquetes/ImprimirPaqueteDialog'
import { useQueryClient } from '@tanstack/react-query'
import { imprimirEtiqueta, imprimirEtiquetasMultiples } from '@/utils/imprimirEtiqueta'
import { imprimirEtiquetaZebraPaquete, imprimirEtiquetasZebraPaquetes } from '@/utils/imprimirEtiquetaZebraPaquete'
import type { Paquete } from '@/types/paquete'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { cn } from '@/lib/utils'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { PERMISSIONS } from '@/types/permissions'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { getEstadoPaqueteBadgeVariant } from '@/utils/paqueteEstado'
import { useListFilters } from '@/hooks/useListFilters'
import { useAgencias } from '@/hooks/useSelectOptions'
import { formatearFechaCorta } from '@/utils/fechas'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/filters'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'

interface PaquetesFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  estado: string
  tipo: string
  idAgencia: number | undefined
  idLote: number | undefined
  fechaDesde: string
  fechaHasta: string
}

const PAQUETES_FILTERS_DEFAULTS: PaquetesFiltersState = {
  page: 0,
  size: 20,
  search: '',
  estado: 'all',
  tipo: 'all',
  idAgencia: undefined,
  idLote: undefined,
  fechaDesde: '',
  fechaHasta: '',
}

export default function PaquetesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: agenciasOptions = [] } = useAgencias()

  const filtros = useListFilters<PaquetesFiltersState>({
    storageKey: 'paquetes',
    defaults: PAQUETES_FILTERS_DEFAULTS,
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
          label: `Estado: ${values.estado}`,
          onRemove: () => removeFilter('estado'),
        })
      }
      if (values.tipo && values.tipo !== 'all') {
        chips.push({
          key: 'tipo',
          label: `Tipo: ${values.tipo}`,
          onRemove: () => removeFilter('tipo'),
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
      if (values.idLote != null) {
        chips.push({
          key: 'idLote',
          label: `Lote: #${values.idLote}`,
          onRemove: () => removeFilter('idLote'),
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

  const { page, size, search, estado, tipo, idAgencia, idLote, fechaDesde, fechaHasta } = filtros.values

  const [paqueteAEliminar, setPaqueteAEliminar] = useState<number | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importRefDialogOpen, setImportRefDialogOpen] = useState(false)
  const [importActualizarDialogOpen, setImportActualizarDialogOpen] = useState(false)
  const [importEspecialesMiamiDialogOpen, setImportEspecialesMiamiDialogOpen] = useState(false)
  const [asociarClementinaDialogOpen, setAsociarClementinaDialogOpen] = useState(false)
  const [asociarCadenitaDialogOpen, setAsociarCadenitaDialogOpen] = useState(false)
  const [asociarSepararDialogOpen, setAsociarSepararDialogOpen] = useState(false)
  const [paquetesSeleccionados, setPaquetesSeleccionados] = useState<Set<string | number>>(new Set())
  const [imprimirPaqueteDialogOpen, setImprimirPaqueteDialogOpen] = useState(false)
  const [imprimirPaqueteDialogMode, setImprimirPaqueteDialogMode] = useState<ModoImpresionPaquete>('multi')
  const [paqueteParaImprimir, setPaqueteParaImprimir] = useState<Paquete | null>(null)
  const refreshPaquetes = () => queryClient.invalidateQueries({ queryKey: ['paquetes'] })

  const { data, isLoading, error } = usePaquetes({
    page,
    size,
    search: search || undefined,
    estado: estado !== 'all' ? estado : undefined,
    tipo: tipo !== 'all' ? tipo : undefined,
    idAgencia,
    idLote,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  })

  const deleteMutation = useDeletePaquete()

  const handleDelete = async () => {
    if (paqueteAEliminar) {
      try {
        await deleteMutation.mutateAsync(paqueteAEliminar)
        setPaqueteAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  const paquetesFiltrados = data?.content ?? []
  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  const togglePaquete = useCallback((id: string | number) => {
    setPaquetesSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAllPaquetes = useCallback((rows: Paquete[]) => {
    setPaquetesSeleccionados((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.has(r.idPaquete!))
      if (allSelected) {
        const next = new Set(prev)
        rows.forEach((r) => next.delete(r.idPaquete!))
        return next
      }
      const next = new Set(prev)
      rows.forEach((r) => next.add(r.idPaquete!))
      return next
    })
  }, [])

  const paquetesParaImprimir = useMemo(
    () => paquetesFiltrados.filter((p) => paquetesSeleccionados.has(p.idPaquete!)),
    [paquetesFiltrados, paquetesSeleccionados],
  )

  const handleImprimirSeleccionadosNormal = () => {
    if (paquetesParaImprimir.length === 0) {
      notify.error('No hay paquetes seleccionados')
      return
    }
    imprimirEtiquetasMultiples(paquetesParaImprimir)
  }

  const handleImprimirSeleccionadosZebra = () => {
    if (paquetesParaImprimir.length === 0) {
      notify.error('No hay paquetes seleccionados')
      return
    }
    imprimirEtiquetasZebraPaquetes(paquetesParaImprimir)
  }

  const columns = useMemo<DataTableColumn<Paquete>[]>(() => [
    {
      id: 'guia',
      header: 'Guía',
      width: '180px',
      accessor: (p) => (
        <span
          className={cn(
            'font-mono text-xs font-medium',
            !p.numeroGuia && 'text-muted-foreground italic',
          )}
        >
          {p.numeroGuia || 'N/A'}
        </span>
      ),
      sortValue: (p) => p.numeroGuia ?? '',
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '140px',
      accessor: (p) => (
        <StatusBadge
          label={p.estado}
          variant={getEstadoPaqueteBadgeVariant(p.estado)}
        />
      ),
      sortValue: (p) => p.estado ?? '',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      hideOn: 'md',
      accessor: (p) => (
        <span className="text-xs text-foreground/80">{p.tipoPaquete ?? '—'}</span>
      ),
      sortValue: (p) => p.tipoPaquete ?? '',
    },
    {
      id: 'ref',
      header: 'REF',
      hideOn: 'lg',
      accessor: (p) => (
        <span className="text-xs text-muted-foreground truncate" title={p.ref ?? undefined}>
          {p.ref || '—'}
        </span>
      ),
      sortValue: (p) => p.ref ?? '',
    },
    {
      id: 'despacho',
      header: 'Despacho',
      hideOn: 'sm',
      accessor: (p) =>
        p.numeroManifiesto ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate({ to: `/despachos/${p.idDespacho}` })
            }}
            className="h-auto max-w-[140px] truncate px-0 text-xs font-mono"
          >
            {p.numeroManifiesto}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
      sortValue: (p) => p.numeroManifiesto ?? '',
    },
    {
      id: 'peso',
      header: 'Peso',
      align: 'right',
      width: '90px',
      hideOn: 'lg',
      accessor: (p) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {p.pesoKilos ? `${p.pesoKilos} kg` : '—'}
        </span>
      ),
      sortValue: (p) => p.pesoKilos ?? 0,
    },
    {
      id: 'registro',
      header: 'Registro',
      defaultHidden: true,
      accessor: (p) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatearFechaCorta(p.fechaRegistro)}
        </span>
      ),
      sortValue: (p) => (p.fechaRegistro ? new Date(p.fechaRegistro) : null),
    },
  ], [navigate])

  const hayFiltros = filtros.hasActiveFilters

  return (
    <ListPageLayout
      title="Paquetes"
      icon={<Package className="h-4 w-4" />}
      actions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {paquetesSeleccionados.size > 0 && (
            <ProtectedByPermission permission={PERMISSIONS.PAQUETES.IMPRIMIR}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImprimirPaqueteDialogMode('multi')
                  setPaqueteParaImprimir(null)
                  setImprimirPaqueteDialogOpen(true)
                }}
                className="h-8 text-xs shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Imprimir ({paquetesSeleccionados.size})
              </Button>
            </ProtectedByPermission>
          )}

          <ProtectedByPermission permissions={[PERMISSIONS.PAQUETES.CREAR, PERMISSIONS.PAQUETES.EDITAR]}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs shadow-sm">
                  <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Importaciones</DropdownMenuLabel>
                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                  <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                    <Upload className="h-3.5 w-3.5 mr-2" /> Importar Excel
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                  <DropdownMenuItem
                    onClick={() => setImportActualizarDialogOpen(true)}
                    className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-700 dark:data-[highlighted]:text-red-300"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-2 text-red-600 dark:text-red-400" /> Importar y Actualizar Excel
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                  <DropdownMenuItem onClick={() => setImportRefDialogOpen(true)}>
                    <Tag className="h-3.5 w-3.5 mr-2" /> Importar REF
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                  <DropdownMenuItem onClick={() => setImportEspecialesMiamiDialogOpen(true)}>
                    <Tag className="h-3.5 w-3.5 mr-2" /> Importar paquetes especiales (MIAMI)
                  </DropdownMenuItem>
                </ProtectedByPermission>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Asociaciones</DropdownMenuLabel>
                <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                  <DropdownMenuItem onClick={() => setAsociarClementinaDialogOpen(true)}>
                    <PackagePlus className="h-3.5 w-3.5 mr-2" /> Asociar Clementina
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAsociarCadenitaDialogOpen(true)}>
                    <Link2 className="h-3.5 w-3.5 mr-2" /> Asociar Cadenita
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAsociarSepararDialogOpen(true)}>
                    <PackageMinus className="h-3.5 w-3.5 mr-2" /> Marcar como Separar
                  </DropdownMenuItem>
                </ProtectedByPermission>
              </DropdownMenuContent>
            </DropdownMenu>
          </ProtectedByPermission>

          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
            <Button onClick={() => navigate({ to: '/paquetes/new' })} size="sm" className="h-8 shadow-sm">
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
          searchPlaceholder="Buscar por guía, REF o master..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <SelectFilter
            value={estado}
            onChange={(v) => filtros.setFilter('estado', v)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              ...Object.values(EstadoPaquete).map((e) => ({ value: e, label: e })),
            ]}
            ariaLabel="Estado del paquete"
          />
          <SelectFilter
            value={tipo}
            onChange={(v) => filtros.setFilter('tipo', v)}
            options={[
              { value: 'all', label: 'Todos los tipos' },
              ...Object.values(TipoPaquete).map((t) => ({ value: t, label: t })),
            ]}
            ariaLabel="Tipo de paquete"
          />
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
            ariaLabel="Agencia destino"
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
        error && !isLoading ? (
          <ErrorState
            title="Error al cargar paquetes"
            description={
              getInteragencyRestrictionMessage(error)
                ?? getApiErrorMessage(error, 'No se pudieron cargar los paquetes.')
            }
          />
        ) : (
          <DataTable<Paquete>
            data={paquetesFiltrados}
            columns={columns}
            rowKey={(p) => p.idPaquete!}
            storageKey="paquetes"
            isLoading={isLoading}
            selection={{
              selected: paquetesSeleccionados,
              getId: (p) => p.idPaquete!,
              onToggle: togglePaquete,
              onToggleAll: toggleAllPaquetes,
            }}
            emptyState={
              <EmptyState
                title="No se encontraron paquetes"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'No hay paquetes registrados'
                }
                icon={<Package className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros && (
                    <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                      <Button onClick={() => navigate({ to: '/paquetes/new' })} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Paquete
                      </Button>
                    </ProtectedByPermission>
                  )
                }
              />
            }
            rowActions={(paquete) => (
              <ProtectedByPermission
                permissions={[
                  PERMISSIONS.PAQUETES.VER,
                  PERMISSIONS.PAQUETES.IMPRIMIR,
                  PERMISSIONS.PAQUETES.EDITAR,
                  PERMISSIONS.PAQUETES.ELIMINAR,
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
                    <ProtectedByPermission permission={PERMISSIONS.PAQUETES.VER}>
                      <DropdownMenuItem onClick={() => navigate({ to: `/paquetes/${paquete.idPaquete}` })}>
                        <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                    <ProtectedByPermission permission={PERMISSIONS.PAQUETES.IMPRIMIR}>
                      <DropdownMenuItem
                        onClick={() => {
                          setPaqueteParaImprimir(paquete)
                          setImprimirPaqueteDialogMode('single')
                          setImprimirPaqueteDialogOpen(true)
                        }}
                      >
                        <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                    <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                      <DropdownMenuItem onClick={() => navigate({ to: `/paquetes/${paquete.idPaquete}/edit` })}>
                        <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                    <DropdownMenuSeparator />
                    <ProtectedByPermission permission={PERMISSIONS.PAQUETES.ELIMINAR}>
                      <DropdownMenuItem
                        onClick={() => setPaqueteAEliminar(paquete.idPaquete!)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ProtectedByPermission>
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
      <Dialog open={!!paqueteAEliminar} onOpenChange={(open) => !open && setPaqueteAEliminar(null)}>
        <DialogContent className={cn(dialogContentPresets.compact, 'p-0 gap-0 overflow-hidden')}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-destructive/5">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <div className="h-8 w-8 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </div>
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el paquete.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar este paquete? Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <Button variant="outline" onClick={() => setPaqueteAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportarPaquetesDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImportSuccess={refreshPaquetes} />
      <ImportarRefDialog open={importRefDialogOpen} onOpenChange={setImportRefDialogOpen} onImportSuccess={refreshPaquetes} />
      <ImportarActualizarPaquetesDialog open={importActualizarDialogOpen} onOpenChange={setImportActualizarDialogOpen} onImportSuccess={refreshPaquetes} />
      <ImportarPaquetesEspecialesMiamiDialog open={importEspecialesMiamiDialogOpen} onOpenChange={setImportEspecialesMiamiDialogOpen} onImportSuccess={refreshPaquetes} />
      <AsociarClementinaLoteDialog open={asociarClementinaDialogOpen} onOpenChange={(open) => { setAsociarClementinaDialogOpen(open); if (!open) refreshPaquetes() }} />
      <AsociarCadenitaDialog open={asociarCadenitaDialogOpen} onOpenChange={(open) => { setAsociarCadenitaDialogOpen(open); if (!open) refreshPaquetes() }} />
      <AsociarSepararDialog open={asociarSepararDialogOpen} onOpenChange={(open) => { setAsociarSepararDialogOpen(open); if (!open) refreshPaquetes() }} />

      <ImprimirPaqueteDialog
        open={imprimirPaqueteDialogOpen}
        onOpenChange={(open) => {
          setImprimirPaqueteDialogOpen(open)
          if (!open) setPaqueteParaImprimir(null)
        }}
        mode={imprimirPaqueteDialogMode}
        onElegirNormal={() => {
          if (imprimirPaqueteDialogMode === 'multi') {
            handleImprimirSeleccionadosNormal()
          } else if (paqueteParaImprimir) {
            imprimirEtiqueta(paqueteParaImprimir)
            setPaqueteParaImprimir(null)
          }
        }}
        onElegirZebra={() => {
          if (imprimirPaqueteDialogMode === 'multi') {
            handleImprimirSeleccionadosZebra()
          } else if (paqueteParaImprimir) {
            imprimirEtiquetaZebraPaquete(paqueteParaImprimir)
            setPaqueteParaImprimir(null)
          }
        }}
      />
    </ListPageLayout>
  )
}
