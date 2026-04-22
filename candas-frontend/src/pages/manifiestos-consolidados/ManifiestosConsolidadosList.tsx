import { useState, useMemo } from 'react'
import {
  useManifiestosConsolidados,
  useManifiestoConsolidado,
  useDeleteManifiestoConsolidado,
} from '@/hooks/useManifiestosConsolidados'
import { manifiestoConsolidadoService } from '@/lib/api/manifiesto-consolidado.service'
import type {
  ManifiestoConsolidadoDetalle,
  ManifiestoConsolidadoResumen,
} from '@/types/manifiesto-consolidado'
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
  Plus,
  Printer,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Calendar,
  ArrowRight,
  Clock,
} from 'lucide-react'
import GenerarManifiestoConsolidadoDialog from './GenerarManifiestoConsolidadoDialog'
import ExportarExcelDialog from './ExportarExcelDialog'
import SeleccionarTipoImpresionDialog from '@/components/manifiestos-consolidados/SeleccionarTipoImpresionDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { notify } from '@/lib/notify'
import { ListPageLayout } from '@/app/layout/ListPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { FilterBar, SelectFilter } from '@/components/filters'
import { useListFilters } from '@/hooks/useListFilters'
import { useAgencias } from '@/hooks/useSelectOptions'

const formatearFecha = (fecha: string) => {
  const date = new Date(fecha)
  const dia = date.getDate().toString().padStart(2, '0')
  const mes = (date.getMonth() + 1).toString().padStart(2, '0')
  const anio = date.getFullYear()
  const horas = date.getHours().toString().padStart(2, '0')
  const minutos = date.getMinutes().toString().padStart(2, '0')
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`
}

const PeriodoCell = ({ periodo }: { periodo: string }) => {
  const match = periodo.match(/Del (\d{2}\/\d{2}\/\d{4}) al (\d{2}\/\d{2}\/\d{4})/)

  if (match) {
    const [, inicio, fin] = match
    if (inicio === fin) {
      return (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Fecha Única
            </span>
            <span className="text-xs font-medium tabular-nums">{inicio}</span>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium tabular-nums">{inicio}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium tabular-nums">{fin}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/60">Rango</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>
      <span className="text-xs font-medium">{periodo}</span>
    </div>
  )
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const ANIOS_OPTIONS = (() => {
  const actual = new Date().getFullYear()
  const out: { value: number; label: string }[] = []
  for (let y = actual; y >= actual - 5; y--) {
    out.push({ value: y, label: String(y) })
  }
  return out
})()

interface ManifiestosFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  idAgencia: number | undefined
  mes: number | undefined
  anio: number | undefined
}

const MANIFIESTOS_FILTERS_DEFAULTS: ManifiestosFiltersState = {
  page: 0,
  size: 20,
  search: '',
  idAgencia: undefined,
  mes: undefined,
  anio: undefined,
}

export default function ManifiestosConsolidadosList() {
  const { data: agenciasOptions = [] } = useAgencias()

  const filtros = useListFilters<ManifiestosFiltersState>({
    storageKey: 'manifiestos-consolidados',
    defaults: MANIFIESTOS_FILTERS_DEFAULTS,
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
      if (values.mes != null) {
        const mes = MESES.find((m) => m.value === values.mes)
        chips.push({
          key: 'mes',
          label: `Mes: ${mes?.label ?? values.mes}`,
          onRemove: () => removeFilter('mes'),
        })
      }
      if (values.anio != null) {
        chips.push({
          key: 'anio',
          label: `Año: ${values.anio}`,
          onRemove: () => removeFilter('anio'),
        })
      }
      return chips
    },
  })

  const { page, size, search, idAgencia, mes, anio } = filtros.values

  const [mostrarDialogGenerar, setMostrarDialogGenerar] = useState(false)
  const [manifiestoDetalle, setManifiestoDetalle] = useState<number | null>(null)
  const [manifiestoAEliminar, setManifiestoAEliminar] = useState<number | null>(null)
  const [mostrarExportarExcel, setMostrarExportarExcel] = useState(false)
  const [mostrarDialogImpresion, setMostrarDialogImpresion] = useState(false)
  const [manifiestoParaAccion, setManifiestoParaAccion] = useState<ManifiestoConsolidadoDetalle | null>(null)

  const { data, isLoading, error } = useManifiestosConsolidados({
    page,
    size,
    search: search || undefined,
    idAgencia,
    mes,
    anio,
  })
  const { data: manifiestoDetalleData, isLoading: loadingDetalle } = useManifiestoConsolidado(
    manifiestoDetalle ?? undefined,
  )
  const deleteMutation = useDeleteManifiestoConsolidado()

  const handleDelete = async () => {
    if (manifiestoAEliminar) {
      try {
        await deleteMutation.mutateAsync(manifiestoAEliminar)
        setManifiestoAEliminar(null)
      } catch {
        // hook
      }
    }
  }

  const manifiestosFiltrados = data?.content || []

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  const abrirAccion = async (id: number, accion: 'excel' | 'imprimir') => {
    try {
      const detalles = await manifiestoConsolidadoService.findById(id)
      setManifiestoParaAccion(detalles)
      if (accion === 'excel') {
        setMostrarExportarExcel(true)
      } else {
        setMostrarDialogImpresion(true)
      }
    } catch (error) {
      notify.error(error, 'Error al obtener los detalles del manifiesto')
    }
  }

  const abrirAccionDesdeDetalle = (accion: 'excel' | 'imprimir') => {
    if (!manifiestoDetalleData) return
    setManifiestoParaAccion(manifiestoDetalleData)
    if (accion === 'excel') {
      setMostrarExportarExcel(true)
    } else {
      setMostrarDialogImpresion(true)
    }
  }

  const isLoadingData = isLoading
  const hayFiltros = filtros.hasActiveFilters

  const columns = useMemo<DataTableColumn<ManifiestoConsolidadoResumen>[]>(() => [
    {
      id: 'manifiesto',
      header: 'Manifiesto',
      width: '180px',
      accessor: (m) => (
        <div className="font-mono text-xs font-semibold text-foreground bg-muted/30 px-2 py-1 rounded-md w-fit border border-border/20">
          {m.numeroManifiesto || '—'}
        </div>
      ),
      sortValue: (m) => m.numeroManifiesto ?? '',
    },
    {
      id: 'periodo',
      header: 'Período',
      width: '220px',
      accessor: (m) => <PeriodoCell periodo={m.periodo} />,
      sortValue: (m) => m.periodo ?? '',
    },
    {
      id: 'agencia',
      header: 'Agencia',
      accessor: (m) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-xs text-foreground truncate" title={m.nombreAgencia}>
            {m.nombreAgencia}
          </span>
          <span className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
            {m.codigoAgencia}
            {m.cantonAgencia ? ` • ${m.cantonAgencia}` : ''}
          </span>
        </div>
      ),
      sortValue: (m) => m.nombreAgencia ?? '',
    },
    {
      id: 'despachos',
      header: 'Despachos',
      align: 'right',
      width: '110px',
      accessor: (m) => (
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
          {m.totalDespachos}
        </span>
      ),
      sortValue: (m) => m.totalDespachos ?? 0,
    },
    {
      id: 'sacas',
      header: 'Sacas',
      align: 'right',
      width: '90px',
      hideOn: 'sm',
      accessor: (m) => (
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
          {m.totalSacas}
        </span>
      ),
      sortValue: (m) => m.totalSacas ?? 0,
    },
    {
      id: 'paquetes',
      header: 'Paquetes',
      align: 'right',
      width: '100px',
      accessor: (m) => (
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
          {m.totalPaquetes}
        </span>
      ),
      sortValue: (m) => m.totalPaquetes ?? 0,
    },
    {
      id: 'fecha',
      header: 'Fecha',
      width: '170px',
      hideOn: 'lg',
      accessor: (m) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="tabular-nums">{formatearFecha(m.fechaGeneracion)}</span>
        </div>
      ),
      sortValue: (m) => (m.fechaGeneracion ? new Date(m.fechaGeneracion) : null),
    },
    {
      id: 'usuario',
      header: 'Usuario',
      defaultHidden: true,
      accessor: (m) => (
        <span className="text-xs text-muted-foreground truncate" title={m.usuarioGenerador}>
          {m.usuarioGenerador || '—'}
        </span>
      ),
      sortValue: (m) => m.usuarioGenerador ?? '',
    },
  ], [])

  return (
    <ListPageLayout
      title="Manifiestos Consolidados"
      subtitle="Gestión de manifiestos y reportes"
      icon={
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
      }
      actions={
        <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.GENERAR}>
          <Button
            onClick={() => setMostrarDialogGenerar(true)}
            size="sm"
            className="h-8 shadow-sm text-xs rounded-lg"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Generar Manifiesto
          </Button>
        </ProtectedByPermission>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por número o agencia..."
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
          <SelectFilter
            value={mes != null ? String(mes) : 'all'}
            onChange={(v) => filtros.setFilter('mes', v === 'all' ? undefined : Number(v))}
            options={[
              { value: 'all', label: 'Todos los meses' },
              ...MESES.map((m) => ({ value: String(m.value), label: m.label })),
            ]}
            ariaLabel="Mes"
            triggerClassName="w-[160px]"
            searchable={false}
          />
          <SelectFilter
            value={anio != null ? String(anio) : 'all'}
            onChange={(v) => filtros.setFilter('anio', v === 'all' ? undefined : Number(v))}
            options={[
              { value: 'all', label: 'Todos los años' },
              ...ANIOS_OPTIONS.map((a) => ({ value: String(a.value), label: a.label })),
            ]}
            ariaLabel="Año"
            triggerClassName="w-[140px]"
            searchable={false}
          />
        </FilterBar>
      }
      table={
        error && !isLoadingData ? (
          <ErrorState
            title="Error al cargar manifiestos"
            description={
              getInteragencyRestrictionMessage(error)
                ?? getApiErrorMessage(error, 'No se pudieron cargar los manifiestos.')
            }
          />
        ) : (
          <DataTable<ManifiestoConsolidadoResumen>
            data={manifiestosFiltrados}
            columns={columns}
            rowKey={(m) => m.idManifiestoConsolidado}
            storageKey="manifiestos-consolidados"
            isLoading={isLoadingData}
            emptyState={
              <EmptyState
                title="No hay manifiestos"
                description={
                  hayFiltros
                    ? 'No se encontraron resultados para los filtros seleccionados'
                    : 'Aún no se han generado manifiestos consolidados. Comienza creando uno nuevo.'
                }
                icon={<FileText className="h-10 w-10 text-muted-foreground/50" />}
                action={
                  !hayFiltros ? (
                    <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.GENERAR}>
                      <Button
                        onClick={() => setMostrarDialogGenerar(true)}
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Generar Ahora
                      </Button>
                    </ProtectedByPermission>
                  ) : undefined
                }
              />
            }
            rowActions={(manifiesto) => (
              <ProtectedByPermission
                permissions={[
                  PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER,
                  PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.IMPRIMIR,
                  PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.ELIMINAR,
                ]}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                      aria-label="Acciones de fila"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/50">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER}>
                      <DropdownMenuItem onClick={() => setManifiestoDetalle(manifiesto.idManifiestoConsolidado)}>
                        <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalles
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                    <DropdownMenuSeparator />
                    <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.VER}>
                      <DropdownMenuItem onClick={() => abrirAccion(manifiesto.idManifiestoConsolidado, 'excel')}>
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Exportar Excel
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                    <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.IMPRIMIR}>
                      <DropdownMenuItem onClick={() => abrirAccion(manifiesto.idManifiestoConsolidado, 'imprimir')}>
                        <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir / Descargar
                      </DropdownMenuItem>
                    </ProtectedByPermission>
                    <DropdownMenuSeparator />
                    <ProtectedByPermission permission={PERMISSIONS.MANIFIESTOS_CONSOLIDADOS.ELIMINAR}>
                      <DropdownMenuItem
                        onClick={() => setManifiestoAEliminar(manifiesto.idManifiestoConsolidado)}
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
      <GenerarManifiestoConsolidadoDialog
        open={mostrarDialogGenerar}
        onOpenChange={setMostrarDialogGenerar}
      />

      <Dialog open={!!manifiestoDetalle} onOpenChange={(open) => !open && setManifiestoDetalle(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border-border/50 p-0 gap-0">
          <DialogHeader className="p-6 border-b border-border/30 bg-gradient-to-b from-muted/20 to-transparent">
            <DialogTitle className="text-lg">Detalles del Manifiesto</DialogTitle>
            <DialogDescription>
              Información completa del manifiesto consolidado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto flex items-center justify-center text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">{manifiestoDetalleData?.numeroManifiesto}</h3>
              <p className="text-sm text-muted-foreground">
                AGENCIA: {manifiestoDetalleData?.nombreAgencia}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30 px-4">
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/40 dark:border-blue-900/20">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                  {manifiestoDetalleData?.totales.totalDespachos}
                </div>
                <div className="text-[10px] text-blue-600/60 dark:text-blue-400/60 uppercase tracking-wider font-bold mt-1">
                  Despachos
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/40 dark:border-amber-900/20">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {manifiestoDetalleData?.totales.totalSacas}
                </div>
                <div className="text-[10px] text-amber-600/60 dark:text-amber-400/60 uppercase tracking-wider font-bold mt-1">
                  Sacas
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/40 dark:border-emerald-900/20">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {manifiestoDetalleData?.totales.totalPaquetes}
                </div>
                <div className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-wider font-bold mt-1">
                  Paquetes
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60 mt-2 italic">
              Para ver el detalle completo, genere el archivo Excel o imprima el reporte.
            </p>
          </div>
          <DialogFooter className="p-4 border-t border-border/20 bg-muted/5 gap-2">
            <Button
              variant="outline"
              onClick={() => setManifiestoDetalle(null)}
              className="rounded-lg"
            >
              Cerrar
            </Button>
            <Button
              variant="outline"
              onClick={() => abrirAccionDesdeDetalle('excel')}
              disabled={loadingDetalle || !manifiestoDetalleData}
              className="rounded-lg"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button
              onClick={() => abrirAccionDesdeDetalle('imprimir')}
              disabled={loadingDetalle || !manifiestoDetalleData}
              className="rounded-lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!manifiestoAEliminar}
        onOpenChange={(open) => !open && setManifiestoAEliminar(null)}
      >
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este manifiesto consolidado? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManifiestoAEliminar(null)}
              disabled={deleteMutation.isPending}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mostrarExportarExcel && manifiestoParaAccion && (
        <ExportarExcelDialog
          manifiesto={manifiestoParaAccion}
          open={mostrarExportarExcel}
          onOpenChange={(open) => {
            setMostrarExportarExcel(open)
            if (!open) setManifiestoParaAccion(null)
          }}
        />
      )}

      {mostrarDialogImpresion && manifiestoParaAccion && (
        <SeleccionarTipoImpresionDialog
          manifiesto={manifiestoParaAccion}
          open={mostrarDialogImpresion}
          onOpenChange={(open) => {
            setMostrarDialogImpresion(open)
            if (!open) setManifiestoParaAccion(null)
          }}
        />
      )}
    </ListPageLayout>
  )
}
