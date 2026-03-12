import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLotesEspeciales, useDeleteLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useQuery } from '@tanstack/react-query'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import { Button } from '@/components/ui/button'
import { ListToolbar } from '@/components/list/ListToolbar'
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
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Tag,
  AlertCircle
} from 'lucide-react'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ErrorState, LoadingState } from '@/components/states'
import { ListPagination } from '@/components/list/ListPagination'

export default function LotesEspecialesList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [loteAEliminar, setLoteAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useLotesEspeciales(page, 20)
  const deleteMutation = useDeleteLoteRecepcion()

  const { data: lotesBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['lotes-especiales', 'search', busqueda],
    queryFn: () => loteRecepcionService.searchEspeciales(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const lotesFiltrados = useMemo(() => {
    if (busqueda.trim().length > 0) return lotesBusqueda || []
    return data?.content || []
  }, [busqueda, lotesBusqueda, data])

  const handleDelete = async () => {
    if (loteAEliminar) {
      try {
        await deleteMutation.mutateAsync(loteAEliminar)
        setLoteAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  return (
    <StandardPageLayout
      title="Lotes especiales"
      icon={<Tag className="h-4 w-4" />}
      actions={
        <Button onClick={() => navigate({ to: '/lotes-especiales/new' })} size="sm" className="h-8 shadow-sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuevo
        </Button>
      }
    >
      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar..."
        withBottomBorder={false}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
        <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          {(isLoading || loadingBusqueda) ? (
            <div className="p-12">
              <LoadingState label="Cargando..." />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState title="Error al cargar los datos" icon={<AlertCircle className="h-5 w-5" />} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <Table className="notion-table">
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[180px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Número</TableHead>
                  <TableHead className="min-w-[200px] h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Detalles</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Fecha</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-right h-9 pr-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Tag className="h-8 w-8 text-muted-foreground/30" />
                        <p>No hay lotes especiales</p>
                        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/lotes-especiales/new' })}>
                          Crear el primero
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  lotesFiltrados.map((lote) => {
                    const totalPaquetes = lote.totalPaquetes || 0
                    const paquetesDespachados = lote.paquetesDespachados || 0
                    const paquetesPendientes = lote.paquetesPendientes || 0
                    return (
                      <TableRow key={lote.idLoteRecepcion} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-10">
                        <TableCell className="font-medium py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">#{lote.idLoteRecepcion}</span>
                            <span className="text-sm text-foreground">{lote.numeroRecepcion || 'Sin número'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-col gap-0.5">
                            {lote.nombreAgencia ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <span>{lote.nombreAgencia}</span>
                                {lote.cantonAgencia && <span className="text-muted-foreground text-xs">({lote.cantonAgencia})</span>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">-</span>
                            )}
                            <div className="text-xs text-muted-foreground">{lote.usuarioRegistro || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="text-sm text-muted-foreground">
                            {lote.fechaRecepcion
                              ? new Date(lote.fechaRecepcion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5" title="Total">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                              {totalPaquetes}
                            </span>
                            {paquetesDespachados > 0 && (
                              <span className="flex items-center gap-1.5 text-green-600" title="Despachados">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {paquetesDespachados}
                              </span>
                            )}
                            {paquetesPendientes > 0 && (
                              <span className="flex items-center gap-1.5 text-amber-600" title="Pendientes">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {paquetesPendientes}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2 pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate({ to: `/lotes-especiales/${lote.idLoteRecepcion}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Abrir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate({ to: `/lotes-especiales/${lote.idLoteRecepcion}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setLoteAEliminar(lote.idLoteRecepcion!)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
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
      </div>

      <Dialog open={!!loteAEliminar} onOpenChange={(open) => !open && setLoteAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este lote especial? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoteAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardPageLayout>
  )
}
