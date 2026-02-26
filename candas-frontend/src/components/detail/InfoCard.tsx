import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

interface InfoCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function InfoCard({ title, description, icon: Icon, children, className }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

interface InfoFieldProps {
  label: string
  value: ReactNode
  icon?: LucideIcon
  className?: string
}

export function InfoField({ label, value, icon: Icon, className }: InfoFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label variant="muted" className="flex items-center gap-1 text-sm">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      <div className="text-sm">{value ?? '-'}</div>
    </div>
  )
}

/** Fila horizontal label + valor para páginas de detalle. Opcional: icon, href (valor como enlace). */
export interface PropertyProps {
  icon?: LucideIcon
  label: string
  value: ReactNode
  href?: string
  className?: string
}

export function Property({ icon: Icon, label, value, href, className }: PropertyProps) {
  return (
    <div className={cn('flex items-start py-1.5 group', className)}>
      <div className="w-[180px] flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex-1 text-sm font-medium text-foreground break-words">
        {href ? (
          href.startsWith('http') ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-primary underline-offset-4">
              {value}
            </a>
          ) : (
            <Link to={href} className="hover:underline decoration-primary underline-offset-4">
              {value}
            </Link>
          )
        ) : value}
      </div>
    </div>
  )
}
