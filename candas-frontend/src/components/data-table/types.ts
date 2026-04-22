import type { ReactNode } from 'react'

export type ColumnAlign = 'left' | 'right' | 'center'

export type ResponsiveBreakpoint = 'sm' | 'md' | 'lg' | 'xl'

export interface DataTableColumn<T> {
  /** Identificador estable de la columna (para sort y persistencia). */
  id: string
  /** Texto de cabecera. */
  header: string
  /** Render de la celda. */
  accessor: (row: T) => ReactNode
  /** Valor para ordenamiento (si se omite, la columna no es ordenable). */
  sortValue?: (row: T) => string | number | Date | null | undefined
  /** Alineación de la celda. */
  align?: ColumnAlign
  /** Ancho fijo (clase Tailwind o CSS), opcional. */
  width?: string
  /** Oculta la columna debajo del breakpoint indicado. */
  hideOn?: ResponsiveBreakpoint
  /** Si true, la columna nace oculta hasta que el usuario la active. */
  defaultHidden?: boolean
  /** Si true, la columna NO se puede ocultar desde el selector. */
  alwaysVisible?: boolean
  /** Clase extra para `<TableCell>`. */
  cellClassName?: string
  /** Clase extra para `<TableHead>`. */
  headerClassName?: string
}
