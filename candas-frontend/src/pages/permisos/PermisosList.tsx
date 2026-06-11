import { ListPageLayout } from '@/app/layout/ListPageLayout'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { DataTable,type DataTableColumn } from '@/components/data-table'
import { FilterBar } from '@/components/filters'
import { AppIcon,ModulePageIcon } from '@/components/icons'
import { ListPagination } from '@/components/list/ListPagination'
import { ErrorState } from '@/components/states'
import { EmptyState } from '@/components/states/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import { useListFilters } from '@/hooks/useListFilters'
import { usePermisos } from '@/hooks/usePermisos'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { Permiso } from '@/types/permiso'
import { PERMISSIONS } from '@/types/permissions'
import { useNavigate } from '@tanstack/react-router'
import { Edit,Eye,Folder,Key,MoreHorizontal,Zap } from 'lucide-react'
import { useEffect,useMemo,useState } from 'react'

interface PermisosFiltersState extends Record<string, string | number | undefined> {
  page: number
  size: number
  search: string
  recurso: string
  accion: string
}

const PERMISOS_FILTERS_DEFAULTS: PermisosFiltersState = {
  page: 0,
  size: 20,
  search: '',
  recurso: '',
  accion: '',
}

function PermisoRowActions({
  onVer,
  onEditar,
}: {
  onVer: () => void
  onEditar: () => void
}) {
  return (
    <ProtectedByPermission permissions={[PERMISSIONS.PERMISOS.VER, PERMISSIONS.PERMISOS.EDITAR]}>
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
          <ProtectedByPermission permission={PERMISSIONS.PERMISOS.VER}>
            <DropdownMenuItem onClick={onVer}>
              <Eye className="h-3.5 w-3.5 mr-2" /> Ver detalles
            </DropdownMenuItem>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.PERMISOS.EDITAR}>
            <DropdownMenuItem onClick={onEditar}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar nombre
            </DropdownMenuItem>
          </ProtectedByPermission>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProtectedByPermission>
  )
}

interface DebouncedTextFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  icon?: React.ReactNode
}

function DebouncedTextFilter({ value, onChange, placeholder, ariaLabel, icon }: DebouncedTextFilterProps) {
  const [local, setLocal] = useState(value)
  const debounced = useDebounce(local, 300)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <div className="relative w-40">
      {icon && (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      )}
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`h-9 text-sm ${icon ? 'pl-7' : ''}`}
      />
    </div>
  )
}

export default function PermisosList() {
  const navigate = useNavigate()

  const filtros = useListFilters<PermisosFiltersState>({
    storageKey: 'permisos',
    defaults: PERMISOS_FILTERS_DEFAULTS,
    buildChips: (values, { removeFilter }) => {
      const chips = []
      if (values.search) {
        chips.push({
          key: 'search',
          label: `Buscar: "${values.search}"`,
          onRemove: () => removeFilter('search'),
        })
      }
      if (values.recurso) {
        chips.push({
          key: 'recurso',
          label: `Recurso: "${values.recurso}"`,
          onRemove: () => removeFilter('recurso'),
        })
      }
      if (values.accion) {
        chips.push({
          key: 'accion',
          label: `Acción: "${values.accion}"`,
          onRemove: () => removeFilter('accion'),
        })
      }
      return chips
    },
  })
  const { page, size, search: busqueda, recurso, accion } = filtros.values

  const { data, isLoading, error, refetch } = usePermisos({
    page,
    size,
    search: busqueda || undefined,
    recurso: recurso || undefined,
    accion: accion || undefined,
  })

  const permisosFiltrados = data?.content || []
  const totalPages = data?.totalPages || 0
  const currentPage = data?.number || 0
  const isLoadingData = isLoading
  const hayFiltros = filtros.hasActiveFilters

  const columns = useMemo<DataTableColumn<Permiso>[]>(() => [
    {
      id: 'nombre',
      header: 'Permiso',
      width: '240px',
      accessor: (p) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-info/10 flex items-center justify-center shrink-0 border border-info/15">
            <Key className="h-3.5 w-3.5 text-info" />
          </div>
          <span className="text-xs font-semibold text-foreground truncate" title={p.nombre}>
            {p.nombre}
          </span>
        </div>
      ),
      sortValue: (p) => p.nombre ?? '',
    },
    {
      id: 'recurso',
      header: 'Recurso',
      width: '160px',
      accessor: (p) =>
        p.recurso ? (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-medium bg-warning/10 text-warning">
            <Folder className="h-3 w-3 mr-1" />
            {p.recurso}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/40 italic">—</span>
        ),
      sortValue: (p) => p.recurso ?? '',
    },
    {
      id: 'accion',
      header: 'Acción',
      width: '140px',
      accessor: (p) =>
        p.accion ? (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-medium bg-info/10 text-info">
            <Zap className="h-3 w-3 mr-1" />
            {p.accion}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/40 italic">—</span>
        ),
      sortValue: (p) => p.accion ?? '',
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      defaultHidden: true,
      accessor: (p) => (
        <span className="text-xs text-muted-foreground truncate max-w-[320px]" title={p.descripcion}>
          {p.descripcion || <span className="italic opacity-50">Sin descripción</span>}
        </span>
      ),
      sortValue: (p) => p.descripcion ?? '',
    },
  ], [])

  return (
    <ListPageLayout
      title="Permisos"
      subtitle="Consulta y renombrado. Los permisos se registran en código (DataInitializer)."
      icon={<ModulePageIcon module="permisos" />}
      className="py-2 animate-in fade-in duration-500"
      filterBar={
        <FilterBar
          searchValue={busqueda}
          onSearchChange={(v) => filtros.setFilter('search', v)}
          searchPlaceholder="Buscar por nombre o descripción..."
          chips={filtros.activeChips}
          onClearAll={filtros.clearAll}
        >
          <DebouncedTextFilter
            value={recurso}
            onChange={(v) => filtros.setFilter('recurso', v)}
            placeholder="Recurso..."
            ariaLabel="Filtrar por recurso"
            icon={<AppIcon icon={Folder} size="xs" />}
          />
          <DebouncedTextFilter
            value={accion}
            onChange={(v) => filtros.setFilter('accion', v)}
            placeholder="Acción..."
            ariaLabel="Filtrar por acción"
            icon={<AppIcon icon={Zap} size="xs" />}
          />
        </FilterBar>
      }
      table={
        error && !isLoadingData ? (
          <ErrorState
            title="Error al cargar permisos"
            description={getApiErrorMessage(error, 'No se pudieron cargar los permisos.')}
            onRetry={() => void refetch()}
          />
        ) : (
          <DataTable<Permiso>
            data={permisosFiltrados}
            columns={columns}
            rowKey={(p) => p.idPermiso!}
            storageKey="permisos"
            isLoading={isLoadingData}
            emptyState={
              <EmptyState
                title="No se encontraron permisos"
                description={
                  hayFiltros
                    ? 'No hay resultados para los filtros seleccionados'
                    : 'Los permisos se crean al iniciar la aplicación desde el código del sistema.'
                }
                icon={<ModulePageIcon module="permisos" variant="empty" />}
              />
            }
            rowActions={(p) => (
              <PermisoRowActions
                onVer={() => navigate({ to: `/permisos/${p.idPermiso}` })}
                onEditar={() => navigate({ to: `/permisos/${p.idPermiso}/edit` })}
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
    />
  )
}
