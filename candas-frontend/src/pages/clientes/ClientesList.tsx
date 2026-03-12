import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useClientes, useDeleteCliente } from '@/hooks/useClientes'
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
import { Eye, Edit, Trash2, Plus, MoreHorizontal, Users } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { ListPagination } from '@/components/list/ListPagination'
import { PERMISSIONS } from '@/types/permissions'
import { ListToolbar } from '@/components/list/ListToolbar'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { Label } from '@/components/ui/label'
import { usePersistedListFilters } from '@/hooks/usePersistedListFilters'

const LIST_KEY = 'clientes' as const

export default function ClientesList() {
  const navigate = useNavigate()
  const { stored, setFilters, setPage, setSearch } = usePersistedListFilters<{
    page?: number
    size?: number
    search?: string
    nombre?: string
    documento?: string
    email?: string
    activo?: string
  }>(LIST_KEY)
  const { page = 0, size = 20, search: busqueda = '', nombre = '', documento = '', email: emailFilter = '', activo: activoStore = '' } = { ...stored }
  const setBusqueda = (v: string) => setSearch(v)
  const [clienteAEliminar, setClienteAEliminar] = useState<number | null>(null)

  const filters = useMemo(() => {
    const f: { search?: string; nombre?: string; documento?: string; email?: string; activo?: boolean } = {}
    if (busqueda?.trim()) f.search = busqueda.trim()
    if (nombre?.trim()) f.nombre = nombre.trim()
    if (documento?.trim()) f.documento = documento.trim()
    if (emailFilter?.trim()) f.email = emailFilter.trim()
    if (activoStore === 'true') f.activo = true
    if (activoStore === 'false') f.activo = false
    return Object.keys(f).length > 0 ? f : undefined
  }, [busqueda, nombre, documento, emailFilter, activoStore])

  const { data, isLoading, error } = useClientes(page, size, filters)
  const deleteMutation = useDeleteCliente()

  const handleDelete = async () => {
    if (clienteAEliminar) {
      try {
        await deleteMutation.mutateAsync(clienteAEliminar)
        setClienteAEliminar(null)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  // Un solo listado paginado con filtros en backend
  const clientesFiltrados = data?.content ?? []
  const totalPages = data?.totalPages || 0
  const currentPage = data?.number ?? 0

  const clearAdvancedFilters = () => {
    setFilters({ nombre: '', documento: '', email: '', activo: '', page: 0 })
  }

  return (
    <StandardPageLayout
      title="Clientes"
      icon={<Users className="h-4 w-4" />}
      actions={
        <ProtectedByPermission permission={PERMISSIONS.CLIENTES.CREAR}>
          <Button onClick={() => navigate({ to: '/clientes/new' })} size="sm" className="h-8 shadow-sm text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo
          </Button>
        </ProtectedByPermission>
      }
    >

      <ListToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Buscar por nombre, documento..."
        withBottomBorder={false}
        advancedFilters={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nombre</Label>
              <Input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setFilters({ nombre: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Documento</Label>
              <Input
                placeholder="Documento"
                value={documento}
                onChange={(e) => setFilters({ documento: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                placeholder="Email"
                value={emailFilter}
                onChange={(e) => setFilters({ email: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Estado</Label>
              <Select
                value={activoStore || 'all'}
                onValueChange={(v) => setFilters({ activo: v === 'all' ? '' : v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={clearAdvancedFilters}>
                Limpiar
              </Button>
              <Button type="button" size="sm" className="h-9" onClick={() => setFilters({ page: 0 })}>
                Aplicar
              </Button>
            </div>
          </div>
        }
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
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Datos de Contacto</TableHead>
                  <TableHead className="h-9 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="h-9 text-right pr-4 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading) ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8">
                      <LoadingState label="Cargando clientes..." />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8">
                      <ErrorState title="Error al cargar clientes" />
                    </TableCell>
                  </TableRow>
                ) : clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64">
                      <EmptyState
                        title="No se encontraron clientes"
                        description={
                          filters
                            ? 'No hay resultados con los filtros aplicados'
                            : "No hay clientes registrados"
                        }
                        icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
                        action={
                          !filters && (
                            <ProtectedByPermission permission={PERMISSIONS.CLIENTES.CREAR}>
                              <Button onClick={() => navigate({ to: '/clientes/new' })} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Cliente
                              </Button>
                            </ProtectedByPermission>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.idCliente} className="group hover:bg-muted/50 border-b border-border/50 last:border-0 h-9">
                      <TableCell className="font-medium text-xs pl-4 py-1.5 align-top">
                        <div className="flex flex-col">
                          <span>{cliente.nombreCompleto}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{cliente.documentoIdentidad}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-1.5 align-top">
                        <div className="flex flex-col gap-0.5">
                          {cliente.email && <span className="text-foreground">{cliente.email}</span>}
                          {cliente.telefono && <span className={cn("text-muted-foreground", cliente.email && "text-[10px]")}>{cliente.telefono}</span>}
                          {!cliente.email && !cliente.telefono && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 align-top">
                        <StatusBadge
                          label={cliente.activo !== false ? 'Activo' : 'Inactivo'}
                          variant={cliente.activo !== false ? 'active' : 'inactive'}
                        />
                      </TableCell>
                      <TableCell className="text-right py-1.5 pr-3">
                        <ProtectedByPermission permissions={[PERMISSIONS.CLIENTES.VER, PERMISSIONS.CLIENTES.EDITAR, PERMISSIONS.CLIENTES.ELIMINAR]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.CLIENTES.VER}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/clientes/${cliente.idCliente}` })}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Detalles
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <ProtectedByPermission permission={PERMISSIONS.CLIENTES.EDITAR}>
                              <DropdownMenuItem onClick={() => navigate({ to: `/clientes/${cliente.idCliente}/edit` })}>
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            </ProtectedByPermission>
                            <DropdownMenuSeparator />
                            <ProtectedByPermission permission={PERMISSIONS.CLIENTES.ELIMINAR}>
                              <DropdownMenuItem onClick={() => setClienteAEliminar(cliente.idCliente!)} className="text-destructive focus:text-destructive">
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

      <Dialog open={!!clienteAEliminar} onOpenChange={(open) => !open && setClienteAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteAEliminar(null)} disabled={deleteMutation.isPending}>
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
