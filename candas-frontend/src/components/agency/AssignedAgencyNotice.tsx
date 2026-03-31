import { Building2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAgencias } from '@/hooks/useSelectOptions'
import { cn } from '@/lib/utils'

interface AssignedAgencyNoticeProps {
  className?: string
}

export function AssignedAgencyNotice({ className }: AssignedAgencyNoticeProps) {
  const activeAgencyId = useAuthStore((state) => state.activeAgencyId)
  const { data: agencias = [] } = useAgencias()
  const agencia = agencias.find((a) => a.value === activeAgencyId)

  if (activeAgencyId == null) {
    return (
      <div className={cn('rounded-lg border border-amber-300/40 bg-amber-50/50 p-3 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-200', className)}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Agencia de asignacion</p>
            <p className="text-sm">No hay una agencia activa seleccionada. Cambiala desde el header.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-3', className)}>
      <div className="flex items-start gap-2">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agencia de asignacion</p>
          <p className="text-sm font-medium text-foreground">{agencia?.label ?? `#${activeAgencyId}`}</p>
          <p className="text-xs text-muted-foreground">Se define por el entorno activo en el header.</p>
        </div>
      </div>
    </div>
  )
}
