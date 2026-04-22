import type { ReactNode } from 'react'
import { Columns, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DataTableColumn } from './types'

interface DataTableToolbarProps<T> {
  columns: DataTableColumn<T>[]
  hiddenColumns: Set<string>
  onToggleColumn: (id: string) => void
  onResetColumns: () => void
  /** Slot principal (búsqueda, filtros) a la izquierda. */
  children?: ReactNode
  /** Slot extra a la derecha del selector de columnas. */
  trailing?: ReactNode
  className?: string
}

export function DataTableToolbar<T>({
  columns,
  hiddenColumns,
  onToggleColumn,
  onResetColumns,
  children,
  trailing,
  className,
}: DataTableToolbarProps<T>) {
  const togglables = columns.filter((c) => !c.alwaysVisible)
  const hasHidden = togglables.some((c) => hiddenColumns.has(c.id))

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">{children}</div>
      <div className="flex items-center gap-2 ml-auto">
        {trailing}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Columnas</span>
              {hasHidden ? (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-medium text-primary">
                  {togglables.filter((c) => !hiddenColumns.has(c.id)).length}/{togglables.length}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {togglables.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={!hiddenColumns.has(col.id)}
                onCheckedChange={() => onToggleColumn(col.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {col.header}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onResetColumns} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
