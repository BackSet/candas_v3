import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageContainer } from './PageContainer'
import { PageHeader } from './PageHeader'

export interface StandardPageLayoutProps {
  /** Título principal de la página */
  title: ReactNode
  /** Subtítulo opcional */
  subtitle?: ReactNode
  /** Icono opcional (se muestra en la cabecera) */
  icon?: ReactNode
  /** Acciones (botones) en la cabecera */
  actions?: ReactNode
  /** Contenido debajo de la cabecera (toolbar, tabla, formulario, etc.) */
  children: ReactNode
  /** Ancho del contenedor (por defecto full para listas/formularios) */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Espaciado interno del contenedor (0 para listas con scroll) */
  spacing?: '0' | '4' | '6' | '8'
  /** Clases adicionales para el contenedor raíz */
  className?: string
  /** Clases adicionales para la barra de cabecera */
  headerClassName?: string
  /** Clases adicionales para PageHeader */
  pageHeaderClassName?: string
}

/**
 * Layout estándar para listas y formularios (variante B: barra con blur).
 * Encapsula PageContainer + barra de cabecera (gradient, blur) + PageHeader.
 * Responsive: cabecera con flex-col sm:flex-row y wrap para móvil; padding px-4 sm:px-6;
 * usar actions con flex-wrap para que los botones pasen a nueva línea en pantallas estrechas.
 */
export function StandardPageLayout({
  title,
  subtitle,
  icon,
  actions,
  children,
  width = 'full',
  spacing = '0',
  className,
  headerClassName,
  pageHeaderClassName,
}: StandardPageLayoutProps) {
  return (
    <PageContainer
      width={width}
      spacing={spacing}
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
      {children}
    </PageContainer>
  )
}
