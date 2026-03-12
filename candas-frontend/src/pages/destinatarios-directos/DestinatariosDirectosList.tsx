import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDestinatariosDirectos, useSearchDestinatariosDirectos, useDeleteDestinatarioDirecto } from '@/hooks/useDestinatariosDirectos'
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
import { Eye, Edit, Trash2, Plus, Home, MoreHorizontal } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { useFiltersStore } from '@/stores/filtersStore'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'

const LIST_KEY = 'destinatarios-directos' as const

export default function DestinatariosDirectosList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { search: busqueda = '' } = { ...stored }
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v })
  const [destinatarioAEliminar, setDestinatarioAEliminar] = useState<number | null>(null)

  const hasSearch = busqueda.trim().length > 0
  const { data, isLoading, error } = useDestinatariosDirectos()
  const { data: searchData, isLoading: loadingBusqueda } = useSearchDestinatariosDirectos(busqueda.trim())
  const deleteMutation = useDeleteDestinatarioDirecto()

  const destinatariosFiltrados = useMemo(() => {
    if (hasSearch) return searchData ?? []
    return data ?? []
  }, [hasSearch, searchData, data])

  const isLoadingList = hasSearch ? loadingBusqueda : isLoading

  const handleDelete = async () => {
    if (destinatarioAEliminar) {
      try {
        await deleteMutation.mutateAsync(destinatarioAEliminar)
        setDestinatarioAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  return (
    <StandardPageLayout
      title="Destinatarios"
      icon={<Home className="h-4 w-4" />}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}>
          <Button onClick={() => navigate({ to: '/destinatarios-directos/new' })} size="sm" className="h-8 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
    >

      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre, dirección..."
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
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-4">Nombre</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Teléfono</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Dirección</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Registro</TableHead>
                  <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingList) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8">
                      <LoadingState label="Cargando destinatarios..." />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8">
                      <ErrorState title="Error al cargar destinatarios" />
                    </TableCell>
                  </TableRow>
                ) : destinatariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64">
                      <EmptyState
                        title="No se encontraron destinatarios"
                        description={
                          busqueda
                            ? `No hay resultados para "${busqueda}"`
                            : "No hay destinatarios registrados"
                        }
                        icon={<Home className="h-10 w-10 text-muted-foreground/50" />}
                        action={
                          !busqueda && (
                            <ProtectedByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}>
                              <Button onClick={() => navigate({ to: '/destinatarios-directos/new' })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Destinatario
                              </Button>
                            </ProtectedByPermission>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  destinatariosFiltrados.map((destinatario) => (
                    <TableRow key={destinatario.idDestinatarioDirecto} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                      <TableCell className="font-medium text-xs pl-4 py-1.5 align-top">
                        <div>
                          <div>{destinatario.nombreDestinatario}</div>
                          {destinatario.nombreEmpresa && (
                            <div className="text-muted-foreground font-normal text-[11px] mt-0.5">{destinatario.nombreEmpresa}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-1.5 font-mono text-muted-foreground">{destinatario.telefonoDestinatario || '-'}</TableCell>
                      <TableCell className="text-xs py-1.5 align-top max-w-xs truncate" title={destinatario.direccionDestinatario}>
                        {destinatario.direccionDestinatario || '-'}
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-muted-foreground tabular-nums">
                        {destinatario.fechaRegistro
                          ? new Date(destinatario.fechaRegistro).toLocaleDateString('es-ES')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right py-1.5 pr-3">
                        <ProtectedByPermission permissions={[PERMISSIONS.DESTINATARIOS_DIRECTOS.VER, PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR, PERMISSIONS.DESTINATARIOS_DIRECTOS.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/destinatarios-directos/${destinatario.idDestinatarioDirecto}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/destinatarios-directos/${destinatario.idDestinatarioDirecto}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setDestinatarioAEliminar(destinatario.idDestinatarioDirecto!)} className="text-destructive focus:text-destructive">
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
      </div>

      <Dialog open={!!destinatarioAEliminar} onOpenChange={(open) => !open && setDestinatarioAEliminar(null)}>
        <DialogContent className="p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-destructive/5">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <div className="h-8 w-8 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </div>
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el destinatario directo.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar este destinatario directo? Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
            <Button variant="outline" onClick={() => setDestinatarioAEliminar(null)} disabled={deleteMutation.isPending}>
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
