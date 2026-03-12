import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSacas, useDeleteSaca } from '@/hooks/useSacas'
import { useQuery } from '@tanstack/react-query'
import { sacaService } from '@/lib/api/saca.service'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, Edit, Trash2, Plus, ShoppingBag, MoreHorizontal } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { ListPagination } from '@/components/list/ListPagination'
import { useFiltersStore } from '@/stores/filtersStore'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'

const LIST_KEY = 'sacas' as const

export default function SacasList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [sacaAEliminar, setSacaAEliminar] = useState<number | null>(null)

  const { data, isLoading, error } = useSacas(page, size)
  const deleteMutation = useDeleteSaca()

  // Búsqueda en el backend cuando hay una búsqueda activa
  const { data: sacasBusqueda, isLoading: loadingBusqueda } = useQuery({
    queryKey: ['sacas', 'search', busqueda],
    queryFn: () => sacaService.search(busqueda.trim()),
    enabled: busqueda.trim().length > 0,
    staleTime: 30000,
  })

  const handleDelete = async () => {
    if (sacaAEliminar) {
      try {
        await deleteMutation.mutateAsync(sacaAEliminar)
        setSacaAEliminar(null)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  // Usar resultados de búsqueda del backend si hay búsqueda activa, sino usar datos paginados
  const sacasFiltradas = useMemo(() => {
    if (busqueda.trim().length > 0) {
      return sacasBusqueda || []
    }
    return data?.content || []
  }, [busqueda, sacasBusqueda, data])

  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0

  return (
    <StandardPageLayout
      title="Sacas"
      icon={<ShoppingBag className="h-4 w-4" />}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.SACAS.CREAR}>
          <Button onClick={() => navigate({ to: '/sacas/new' })} size="sm" className="h-8 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
    >

      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por código QR..."
        withBottomBorder={false}
      />

      {/* Content + pagination wrapper */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
        {/* Main Content - Notion Table View */}
        <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative w-full overflow-auto">
            <Table className="notion-table">
              <TableHeader className="bg-muted/40 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-4">Código QR</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Orden</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Tamaño</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Peso (kg)</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Manifiesto</TableHead>
                  <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || loadingBusqueda) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-8">
                      <LoadingState label="Cargando sacas..." />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-8">
                      <ErrorState title="Error al cargar sacas" />
                    </TableCell>
                  </TableRow>
                ) : sacasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <EmptyState
                        title="No se encontraron sacas"
                        description={
                          busqueda
                            ? `No hay resultados para "${busqueda}"`
                            : "No hay sacas registradas"
                        }
                        icon={<ShoppingBag className="h-10 w-10 text-muted-foreground/50" />}
                        action={
                          !busqueda && (
                            <ProtectedByPermission permission={PERMISSIONS.SACAS.CREAR}>
                              <Button onClick={() => navigate({ to: '/sacas/new' })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Saca
                              </Button>
                            </ProtectedByPermission>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  sacasFiltradas.map((saca) => (
                    <TableRow key={saca.idSaca} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                      <TableCell className="font-mono text-xs pl-4 py-1.5">{saca.codigoQr}</TableCell>
                      <TableCell className="font-mono text-xs py-1.5">{saca.numeroOrden}</TableCell>
                      <TableCell className="text-xs py-1.5 font-medium">{saca.tamano}</TableCell>
                      <TableCell className="text-xs py-1.5 tabular-nums text-muted-foreground">{saca.pesoTotal || '-'}</TableCell>
                      <TableCell className="font-mono text-[10px] py-1.5 text-primary hover:underline cursor-pointer">
                        {saca.numeroManifiesto || '-'}
                      </TableCell>
                      <TableCell className="text-right py-1.5 pr-3">
                        <ProtectedByPermission permissions={[PERMISSIONS.SACAS.VER, PERMISSIONS.SACAS.EDITAR, PERMISSIONS.SACAS.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.SACAS.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/sacas/${saca.idSaca}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.SACAS.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/sacas/${saca.idSaca}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.SACAS.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setSacaAEliminar(saca.idSaca!)} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </ProtectedByPermission>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        </div>
        {busqueda.trim().length === 0 && (
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={data?.totalElements}
            size={size}
            onPageChange={setPage}
            className="shrink-0"
          />
        )}
      </div>

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
    </StandardPageLayout>
  )
}
