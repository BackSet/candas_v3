import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageContainer } from './PageContainer'
import { PageHeader } from './PageHeader'

export interface ListPageLayoutProps {
  /** Título principal de la página */
  title: ReactNode
  /** Subtítulo opcional */
  subtitle?: ReactNode
  /** Icono opcional (se muestra en la cabecera) */
  icon?: ReactNode
  /** Acciones (botones) en la cabecera */
  actions?: ReactNode
  /** Barra de filtros fija debajo del header (instancia de `<FilterBar>`). */
  filterBar?: ReactNode
  /** Tabla principal (instancia de `<DataTable>`). */
  table: ReactNode
  /** Pie de página fijo (paginación). Siempre visible si se provee. */
  footer?: ReactNode
  /** Ancho del contenedor (por defecto full para listas). */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Clases adicionales para el contenedor raíz */
  className?: string
  /** Clases adicionales para la barra de cabecera */
  headerClassName?: string
  /** Clases adicionales para PageHeader */
  pageHeaderClassName?: string
  /** Clases para el wrapper scrollable que envuelve a la tabla. */
  contentClassName?: string
  /** Contenido adicional renderizado dentro del layout (típicamente dialogs/modales). */
  children?: ReactNode
}

/**
 * Layout unificado para todas las pantallas de listado del sistema.
 *
 * Estructura:
 *   ┌─────────────────────────────────────────────────┐
 *   │ Header (PageHeader: icon + title + actions)      │  ← shrink-0
 *   ├─────────────────────────────────────────────────┤
 *   │ FilterBar (search + filtros + chips)             │  ← shrink-0
 *   ├─────────────────────────────────────────────────┤
 *   │                                                 │
 *   │ Tabla (DataTable, scrollable)                   │
 *   │                                                 │
 *   ├─────────────────────────────────────────────────┤
 *   │ Footer (Paginación, siempre visible)            │  ← shrink-0
 *   └─────────────────────────────────────────────────┘
 *
 * Las tres barras (header, filterBar, footer) son shrink-0; solo el área central
 * con la tabla hace scroll.
 */
export function ListPageLayout({
  title,
  subtitle,
  icon,
  actions,
  filterBar,
  table,
  footer,
  width = 'full',
  className,
  headerClassName,
  pageHeaderClassName,
  contentClassName,
  children,
}: ListPageLayoutProps) {
  return (
    <PageContainer
      width={width}
      spacing="0"
      className={cn(
        'w-full flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20',
        className
      )}
    >
      <div
        className={cn(
          'px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0',
          headerClassName
        )}
      >
        <PageHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          actions={actions}
          className={cn(
            'pb-0 border-b-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
            pageHeaderClassName
          )}
        />
      </div>

      {filterBar}

      <div className={cn('flex-1 min-h-0 px-4 sm:px-6 py-3 overflow-auto', contentClassName)}>
        {table}
      </div>

      {footer && (
        <div className="px-4 sm:px-6 py-2 border-t border-border/30 bg-background/70 backdrop-blur-md shrink-0">
          {footer}
        </div>
      )}

      {children}
    </PageContainer>
  )
}
