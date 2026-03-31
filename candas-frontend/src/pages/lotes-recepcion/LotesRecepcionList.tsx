import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLotesRecepcion, useDeleteLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useQuery } from '@tanstack/react-query'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Upload,
  MoreHorizontal,
  Package2,
  AlertCircle
} from 'lucide-react'
import ImportarPaquetesDialog from './ImportarPaquetesDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ErrorState, LoadingState } from '@/components/states'
import { ListPagination } from '@/components/list/ListPagination'
import { useFiltersStore } from '@/stores/filtersStore'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import type { LoteRecepcion } from '@/types/lote-recepcion'
import { getApiErrorMessage, getInteragencyRestrictionMessage } from '@/lib/api/errors'

const LIST_KEY = 'lotes-recepcion' as const

function LoteRecepcionRowActions({
  loteRecepcion,
  onAbrir,
  onImportar,
  onEditar,
  onEliminar,
  variant = 'desktop',
}: {
  loteRecepcion: LoteRecepcion
  onAbrir: () => void
  onImportar: () => void
  onEditar: () => void
  onEliminar: () => void
  variant?: 'desktop' | 'mobile'
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.LOTES_RECEPCION.VER, PERMISSIONS.LOTES_RECEPCION.EDITAR, PERMISSIONS.LOTES_RECEPCION.ELIMINAR]}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={
              variant === 'desktop'
                ? 'h-7 w-7 text-muted-foreground hover:text-foreground opacity-100 transition-opacity'
                : 'h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground'
            }
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
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, search: busqueda = '', filtroTipoLote = 'all' } = { ...stored }
  const filtroTipoLoteValue = typeof filtroTipoLote === 'string' ? filtroTipoLote : 'all'
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const setFiltroTipoLote = (v: string) => setFiltersAction(LIST_KEY, { filtroTipoLote: v, page: 0 })
  const [loteRecepcionAEliminar, setLoteRecepcionAEliminar] = useState<number | null>(null)
  const [loteRecepcionParaImportar, setLoteRecepcionParaImportar] = useState<number | null>(null)

  const tipoLoteParam = filtroTipoLoteValue !== 'all' ? filtroTipoLoteValue : undefined
  const { data, isLoading, error } = useLotesRecepcion(page, 20, tipoLoteParam)
  const deleteMutation = useDeleteLoteRecepcion()

  // Búsqueda en el backend cuando hay una búsqueda activa
  const { data: lotesBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['lotes-recepcion', 'search', busqueda],
    queryFn: () => loteRecepcionService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  // Usar resultados de búsqueda del backend si hay búsqueda activa, sino usar datos paginados
  const lotesRecepcionFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return lotesBusqueda || []
    }
    return data?.content || []
  }, [busqueda, lotesBusqueda, data])

  const handleDelete = async () => {
    if (loteRecepcionAEliminar) {
      try {
        await deleteMutation.mutateAsync(loteRecepcionAEliminar)
        setLoteRecepcionAEliminar(null)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  return (
    <StandardPageLayout
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
    >
      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar..."
        withBottomBorder={false}
        filters={
          <Select value={filtroTipoLoteValue} onValueChange={setFiltroTipoLote}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Tipo de lote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="ESPECIAL">Especial</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Content + pagination wrapper */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
        {/* Main Content - Notion Table View */}
        <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          {(isLoading || loadingBusqueda) ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <LoadingState label="Cargando lotes..." />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Error al cargar los datos"
                description={
                  getInteragencyRestrictionMessage(error)
                    ?? getApiErrorMessage(error, 'No se pudieron cargar los lotes de recepción.')
                }
                icon={<AlertCircle className="h-5 w-5" />}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-auto hidden md:block">
                <Table className="notion-table">
                  <TableHeader className="bg-muted/40 border-b border-border">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="w-[180px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Número</TableHead>
                      <TableHead className="w-[90px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Tipo</TableHead>
                      <TableHead className="min-w-[200px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Detalles</TableHead>
                      <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Fecha</TableHead>
                      <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-right h-9 pr-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotesRecepcionFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64">
                          <EmptyState
                            title="No se encontraron lotes de recepción"
                            description={
                              busqueda
                                ? `No hay resultados para "${busqueda}"`
                                : "No hay lotes de recepción registrados"
                            }
                            icon={<Package2 className="h-10 w-10 text-muted-foreground/50" />}
                            action={
                              !busqueda && (
                                <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.CREAR}>
                                  <Button onClick={() => navigate({ to: '/lotes-recepcion/new' })} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Lote
                                  </Button>
                                </ProtectedByPermission>
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      lotesRecepcionFiltrados.map((loteRecepcion) => {
                        const totalPaquetes = loteRecepcion.totalPaquetes || 0
                        const paquetesDespachados = loteRecepcion.paquetesDespachados || 0
                        const paquetesPendientes = loteRecepcion.paquetesPendientes || 0

                        return (
                          <TableRow key={loteRecepcion.idLoteRecepcion} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-10">
                            <TableCell className="font-medium py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">#{loteRecepcion.idLoteRecepcion}</span>
                                <span className="text-sm text-foreground">{loteRecepcion.numeroRecepcion || 'Sin número'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                loteRecepcion.tipoLote === 'ESPECIAL'
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {loteRecepcion.tipoLote === 'ESPECIAL' ? 'Especial' : 'Normal'}
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex flex-col gap-0.5">
                                {loteRecepcion.nombreAgencia ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <span>{loteRecepcion.nombreAgencia}</span>
                                    {loteRecepcion.cantonAgencia && <span className="text-muted-foreground text-xs">({loteRecepcion.cantonAgencia})</span>}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">-</span>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  {loteRecepcion.usuarioRegistro || 'Desconocido'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="text-sm text-muted-foreground">
                                {loteRecepcion.fechaRecepcion
                                  ? new Date(loteRecepcion.fechaRecepcion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5" title="Total">
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                                  {totalPaquetes}
                                </span>
                                {paquetesDespachados > 0 && (
                                  <span className="flex items-center gap-1.5 text-success" title="Despachados">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                                    {paquetesDespachados}
                                  </span>
                                )}
                                {paquetesPendientes > 0 && (
                                  <span className="flex items-center gap-1.5 text-warning" title="Pendientes">
                                    <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                                    {paquetesPendientes}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2 pr-4">
                              <LoteRecepcionRowActions
                                loteRecepcion={loteRecepcion}
                                onAbrir={() => navigate({ to: `/lotes-recepcion/${loteRecepcion.idLoteRecepcion}` })}
                                onImportar={() => setLoteRecepcionParaImportar(loteRecepcion.idLoteRecepcion!)}
                                onEditar={() => navigate({ to: `/lotes-recepcion/${loteRecepcion.idLoteRecepcion}/edit` })}
                                onEliminar={() => setLoteRecepcionAEliminar(loteRecepcion.idLoteRecepcion!)}
                                variant="desktop"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Vista en cards para móvil */}
              <div className="flex-1 min-h-0 overflow-auto block md:hidden p-2 space-y-2">
                {lotesRecepcionFiltrados.map((loteRecepcion) => {
                  const totalPaquetes = loteRecepcion.totalPaquetes || 0
                  const paquetesDespachados = loteRecepcion.paquetesDespachados || 0
                  const paquetesPendientes = loteRecepcion.paquetesPendientes || 0
                  return (
                    <div
                      key={loteRecepcion.idLoteRecepcion}
                      className="rounded-lg border border-border bg-card p-3 shadow-sm flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">#{loteRecepcion.idLoteRecepcion}</span>
                            <span className="text-sm font-medium text-foreground truncate">{loteRecepcion.numeroRecepcion || 'Sin número'}</span>
                          </div>
                          <span className={cn(
                            "inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full",
                            loteRecepcion.tipoLote === 'ESPECIAL'
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {loteRecepcion.tipoLote === 'ESPECIAL' ? 'Especial' : 'Normal'}
                          </span>
                        </div>
                        <LoteRecepcionRowActions
                          loteRecepcion={loteRecepcion}
                          onAbrir={() => navigate({ to: `/lotes-recepcion/${loteRecepcion.idLoteRecepcion}` })}
                          onImportar={() => setLoteRecepcionParaImportar(loteRecepcion.idLoteRecepcion!)}
                          onEditar={() => navigate({ to: `/lotes-recepcion/${loteRecepcion.idLoteRecepcion}/edit` })}
                          onEliminar={() => setLoteRecepcionAEliminar(loteRecepcion.idLoteRecepcion!)}
                          variant="mobile"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {loteRecepcion.fechaRecepcion
                          ? new Date(loteRecepcion.fechaRecepcion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '-'}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5" title="Total">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          {totalPaquetes} paq.
                        </span>
                        {paquetesDespachados > 0 && (
                          <span className="flex items-center gap-1.5 text-success" title="Despachados">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            {paquetesDespachados}
                          </span>
                        )}
                        {paquetesPendientes > 0 && (
                          <span className="flex items-center gap-1.5 text-warning" title="Pendientes">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                            {paquetesPendientes}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && !loadingBusqueda && busqueda.trim().length === 0 && (
        <ListPagination
          page={data?.number || 0}
          totalPages={data?.totalPages || 0}
          totalItems={data?.totalElements}
          size={20}
          onPageChange={setPage}
          className="shrink-0"
        />
      )}

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
            // Refrescar datos
            window.location.reload()
          }}
        />
      )}
    </StandardPageLayout>
  )
}
