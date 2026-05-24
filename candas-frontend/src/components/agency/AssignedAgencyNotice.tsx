import { Building2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAgencias } from '@/hooks/useSelectOptions'
import { SemanticNotice } from '@/components/ui/semantic-notice'
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
      <SemanticNotice
        className={className}
        variant="warning"
        icon={AlertTriangle}
        title="Agencia de asignación"
      >
        No hay una agencia origen activa seleccionada. Cámbiala desde el header.
      </SemanticNotice>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border bg-muted/40 p-3', className)}>
      <div className="flex items-start gap-2.5">
        <Building2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Agencia de asignación
          </p>
          <p className="text-sm font-medium text-foreground">{agencia?.label ?? `#${activeAgencyId}`}</p>
          <p className="text-xs text-muted-foreground">
            Se define por la agencia origen activa en el header.
          </p>
        </div>
      </div>
    </div>
  )
}
