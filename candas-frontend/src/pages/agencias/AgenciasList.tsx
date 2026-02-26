import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAgencias, useDeleteAgencia } from '@/hooks/useAgencias'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Eye, Edit, Trash2, Plus, Building2, MoreHorizontal, Loader2, MapPin, AlertCircle } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { ListPagination } from '@/components/list/ListPagination'
import { useFiltersStore } from '@/stores/filtersStore'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import { Label } from '@/components/ui/label'

const LIST_KEY = 'agencias' as const

export default function AgenciasList() {
  const navigate = useNavigate()
  const stored = useFiltersStore((state) => state.filters[LIST_KEY])
  const setFiltersAction = useFiltersStore((state) => state.setFilters)
  const { page = 0, size = 20, search: busqueda = '', nombre = '', codigo = '', activa: activaStore = '' } = { ...stored }
  const setPage = (p: number) => setFiltersAction(LIST_KEY, { page: p })
  const setBusqueda = (v: string) => setFiltersAction(LIST_KEY, { search: v, page: 0 })
  const [agenciaAEliminar, setAgenciaAEliminar] = useState<number | null>(null)

  const filters = useMemo(() => {
    const f: { search?: string; nombre?: string; codigo?: string; activa?: boolean } = {}
    if (busqueda?.trim()) f.search = busqueda.trim()
    if (nombre?.trim()) f.nombre = nombre.trim()
    if (codigo?.trim()) f.codigo = codigo.trim()
    if (activaStore === 'true') f.activa = true
    if (activaStore === 'false') f.activa = false
    return Object.keys(f).length > 0 ? f : undefined
  }, [busqueda, nombre, codigo, activaStore])

  const { data, isLoading, error } = useAgencias(page, size, filters)
  const deleteMutation = useDeleteAgencia()

  const handleDelete = async () => {
    if (agenciaAEliminar) {
      try {
        await deleteMutation.mutateAsync(agenciaAEliminar)
        setAgenciaAEliminar(null)
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  // Un solo listado paginado con filtros en backend
  const agenciasFiltradas = data?.content ?? []
  const totalPages = data?.totalPages || 0
  const currentPage = data?.number ?? 0

  const applyAdvancedFilters = (vals: { nombre?: string; codigo?: string; activa?: string }) => {
    setFiltersAction(LIST_KEY, { ...vals, page: 0 })
  }
  const clearAdvancedFilters = () => {
    setFiltersAction(LIST_KEY, { nombre: '', codigo: '', activa: '', page: 0 })
  }

  return (
    <PageContainer width="full" className="flex flex-col h-full min-h-0 overflow-hidden">
      <PageHeader
        icon={<Building2 className="h-4 w-4" />}
        title="Agencias"
        className="shrink-0"
        actions={
          <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.CREAR}>
            <Button onClick={() => navigate({ to: '/agencias/new' })} size="sm" className="h-8 shadow-sm text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nueva Agencia
            </Button>
          </ProtectedByPermission>
        }
      />

      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre, código, ubicación..."
        advancedFilters={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                placeholder="Nombre agencia"
                value={nombre}
                onChange={(e) => setFiltersAction(LIST_KEY, { nombre: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input
                placeholder="Código"
                value={codigo}
                onChange={(e) => setFiltersAction(LIST_KEY, { codigo: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={activaStore || 'all'}
                onValueChange={(v) => setFiltersAction(LIST_KEY, { activa: v === 'all' ? '' : v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Activas</SelectItem>
                  <SelectItem value="false">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={clearAdvancedFilters}>
                Limpiar
              </Button>
              <Button type="button" size="sm" className="h-9" onClick={() => applyAdvancedFilters({ nombre, codigo, activa: activaStore })}>
                Aplicar
              </Button>
            </div>
          </div>
        }
      />

      {/* Content + pagination wrapper */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Main Content - Notion Table View */}
        <div className="flex-1 min-h-0 rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative w-full overflow-auto">
            <Table className="notion-table">
              <TableHeader className="bg-muted/40 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-4">Agencia</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Código</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Contacto</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Cantón</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Cargando agencias...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-destructive">
                      <div className="flex flex-col items-center gap-1">
                        <AlertCircle className="h-5 w-5" />
                        <span>Error al cargar agencias</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : agenciasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <EmptyState
                        title="No se encontraron agencias"
                        description={
                          filters
                            ? 'No hay resultados con los filtros aplicados'
                            : "No hay agencias registradas"
                        }
                        icon={<Building2 className="h-10 w-10 text-muted-foreground/50" />}
                        action={
                          !filters && (
                            <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.CREAR}>
                              <Button onClick={() => navigate({ to: '/agencias/new' })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Agencia
                              </Button>
                            </ProtectedByPermission>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  agenciasFiltradas.map((agencia) => (
                    <TableRow key={agencia.idAgencia} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                      <TableCell className="font-medium text-xs pl-4 py-1.5 align-top">
                        {agencia.nombre}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-1.5 text-muted-foreground">{agencia.codigo || '-'}</TableCell>
                      <TableCell className="text-xs py-1.5 align-top">
                        <div className="flex flex-col gap-0.5">
                          {agencia.email && <span className="text-foreground">{agencia.email}</span>}
                          {agencia.telefonos && agencia.telefonos.length > 0 && (
                            <span className={cn("text-muted-foreground", agencia.email && "text-[10px]")}>
                              {agencia.telefonos.find(t => t.principal)?.numero || agencia.telefonos[0].numero}
                            </span>
                          )}
                          {!agencia.email && (!agencia.telefonos || agencia.telefonos.length === 0) && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-1.5 align-top">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {agencia.canton && <MapPin className="h-3 w-3" />}
                          <span>{agencia.canton || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 align-top">
                        <StatusBadge
                          label={agencia.activa !== false ? 'Activa' : 'Inactiva'}
                          variant={agencia.activa !== false ? 'active' : 'inactive'}
                        />
                      </TableCell>
                      <TableCell className="text-right py-1.5 pr-3">
                        <ProtectedByPermission permissions={[PERMISSIONS.AGENCIAS.VER, PERMISSIONS.AGENCIAS.EDITAR, PERMISSIONS.AGENCIAS.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/agencias/${agencia.idAgencia}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/agencias/${agencia.idAgencia}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.AGENCIAS.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setAgenciaAEliminar(agencia.idAgencia!)} className="text-destructive focus:text-destructive">
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

          {!isLoading && (
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
      </div>

      <Dialog open={!!agenciaAEliminar} onOpenChange={(open) => !open && setAgenciaAEliminar(null)}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar esta agencia? Esta acción no se puede deshacer.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgenciaAEliminar(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
