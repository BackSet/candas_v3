import { useMemo, type ReactNode } from 'react'
import { ChevronDown, ChevronsUpDown, ChevronUp, Inbox } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DataTableColumn, ResponsiveBreakpoint } from './types'
import { useTableState, type SortState } from './useTableState'
import { DataTableToolbar } from './DataTableToolbar'

const HIDE_ON_CLASSES: Record<ResponsiveBreakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

interface SelectionConfig<T> {
  /** Set con los IDs seleccionados. */
  selected: Set<string | number>
  /** Función que extrae el ID seleccionable de la fila. */
  getId: (row: T) => string | number
  /** Toggle de una fila. */
  onToggle: (id: string | number) => void
  /** Toggle "seleccionar todos" sobre `data` actualmente visible. */
  onToggleAll: (rows: T[]) => void
  /** Si true, deshabilita la selección por fila. */
  isDisabled?: (row: T) => boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string | number
  /** Clave de persistencia (sort + columnas ocultas). */
  storageKey: string
  selection?: SelectionConfig<T>
  /** Render de filtros/búsqueda en el toolbar. */
  toolbar?: ReactNode
  /** Slot a la derecha del selector de columnas. */
  toolbarTrailing?: ReactNode
  /** Slot debajo del toolbar (chips, contadores). */
  subToolbar?: ReactNode
  /** Vista cuando no hay datos. */
  emptyState?: ReactNode
  /** Mensaje simple si no se pasa `emptyState`. */
  emptyMessage?: string
  /** Icono opcional cuando se usa el `emptyMessage` por defecto. */
  emptyIcon?: ReactNode
  isLoading?: boolean
  /** Skeleton: número de filas a renderizar. */
  loadingRows?: number
  /** Render de la columna de acciones (alineada a la derecha). */
  rowActions?: (row: T) => ReactNode
  /** Click en la fila (excluye click en checkbox y acciones). */
  onRowClick?: (row: T) => void
  density?: 'compact' | 'default'
  /** Clase para el contenedor exterior. */
  className?: string
  /** Clase para `<TableRow>` por fila. */
  rowClassName?: (row: T) => string
}

function alignClass(align: DataTableColumn<unknown>['align']) {
  if (align === 'right') return 'text-right justify-end'
  if (align === 'center') return 'text-center justify-center'
  return 'text-left'
}

function SortIcon({ id, sort }: { id: string; sort: SortState | null }) {
  if (!sort || sort.id !== id) {
    return <ChevronsUpDown className="h-3 w-3 opacity-40" />
  }
  return sort.dir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="h-3 w-3 text-primary" />
  )
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  storageKey,
  selection,
  toolbar,
  toolbarTrailing,
  subToolbar,
  emptyState,
  emptyMessage = 'No hay registros para mostrar.',
  emptyIcon,
  isLoading = false,
  loadingRows = 8,
  rowActions,
  onRowClick,
  density = 'default',
  className,
  rowClassName,
}: DataTableProps<T>) {
  const { sort, toggleSort, hiddenColumns, toggleColumn, showAllColumns, visibleColumns, sortData } =
    useTableState<T>({ storageKey, columns })

  const sortedData = useMemo(() => sortData(data), [data, sortData])

  const allSelectedOnPage =
    !!selection &&
    sortedData.length > 0 &&
    sortedData.every((r) => selection.selected.has(selection.getId(r)))
  const someSelectedOnPage =
    !!selection &&
    !allSelectedOnPage &&
    sortedData.some((r) => selection.selected.has(selection.getId(r)))

  const totalCols =
    visibleColumns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0)

  const cellPaddingY = density === 'compact' ? 'py-1.5' : 'py-2.5'
  const headerPaddingY = density === 'compact' ? 'py-1.5' : 'py-2'

  return (
    <div className={cn('flex flex-col min-h-0 gap-3', className)}>
      {(toolbar || columns.length > 0) && (
        <DataTableToolbar
          columns={columns}
          hiddenColumns={hiddenColumns}
          onToggleColumn={toggleColumn}
          onResetColumns={showAllColumns}
          trailing={toolbarTrailing}
        >
          {toolbar}
        </DataTableToolbar>
      )}
      {subToolbar}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border/60 bg-card shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/60">
            <TableRow className="hover:bg-transparent border-b-0">
              {selection && (
                <TableHead className={cn('w-10 pl-3', headerPaddingY)}>
                  <Checkbox
                    checked={
                      allSelectedOnPage
                        ? true
                        : someSelectedOnPage
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={() => selection.onToggleAll(sortedData)}
                    aria-label="Seleccionar todos"
                    disabled={sortedData.length === 0}
                  />
                </TableHead>
              )}
              {visibleColumns.map((col) => {
                const sortable = !!col.sortValue
                return (
                  <TableHead
                    key={col.id}
                    className={cn(
                      headerPaddingY,
                      col.hideOn ? HIDE_ON_CLASSES[col.hideOn] : null,
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.headerClassName
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 select-none uppercase tracking-wider text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors',
                          alignClass(col.align)
                        )}
                      >
                        <span>{col.header}</span>
                        <SortIcon id={col.id} sort={sort} />
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center uppercase tracking-wider text-[11px] font-medium text-muted-foreground',
                          alignClass(col.align)
                        )}
                      >
                        {col.header}
                      </span>
                    )}
                  </TableHead>
                )
              })}
              {rowActions && (
                <TableHead
                  className={cn('text-right pr-3 w-16', headerPaddingY)}
                  aria-label="Acciones"
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, idx) => (
                <TableRow key={`row-skel-${idx}`} className="border-b-0 hover:bg-transparent">
                  {selection && (
                    <TableCell className={cn('pl-3', cellPaddingY)}>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                  )}
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        cellPaddingY,
                        col.hideOn ? HIDE_ON_CLASSES[col.hideOn] : null,
                        col.cellClassName
                      )}
                    >
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className={cn('pr-3 text-right', cellPaddingY)}>
                      <Skeleton className="ml-auto h-7 w-7 rounded" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={totalCols} className="p-0">
                  {emptyState ?? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                      {emptyIcon ?? <Inbox className="h-8 w-8 opacity-50" />}
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => {
                const id = rowKey(row)
                const isSelected =
                  selection && selection.selected.has(selection.getId(row))
                const selectionDisabled =
                  selection?.isDisabled?.(row) ?? false
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      rowClassName?.(row)
                    )}
                    onClick={(e) => {
                      if (!onRowClick) return
                      const target = e.target as HTMLElement
                      if (
                        target.closest(
                          'button, a, input, [role=checkbox], [data-row-action]'
                        )
                      ) {
                        return
                      }
                      onRowClick(row)
                    }}
                  >
                    {selection && (
                      <TableCell className={cn('pl-3', cellPaddingY)}>
                        <Checkbox
                          checked={!!isSelected}
                          disabled={selectionDisabled}
                          onCheckedChange={() =>
                            selection.onToggle(selection.getId(row))
                          }
                          aria-label="Seleccionar fila"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          cellPaddingY,
                          col.hideOn ? HIDE_ON_CLASSES[col.hideOn] : null,
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.cellClassName
                        )}
                      >
                        {col.accessor(row)}
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell
                        className={cn('pr-3 text-right', cellPaddingY)}
                        data-row-action="true"
                      >
                        {rowActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
