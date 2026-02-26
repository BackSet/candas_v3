import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useAgencia, useDeleteAgencia } from '@/hooks/useAgencias'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, ArrowLeft, MapPin, Phone, Mail, Clock, User, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { Property } from '@/components/detail/InfoCard'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { QuickActions } from '@/components/detail/QuickActions'
import { EmptyState, LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'

export default function AgenciaDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const canEdit = useHasPermission(PERMISSIONS.AGENCIAS.EDITAR)
  const canDelete = useHasPermission(PERMISSIONS.AGENCIAS.ELIMINAR)

  const { data: agencia, isLoading } = useAgencia(id ? Number(id) : undefined)
  const deleteMutation = useDeleteAgencia()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/agencias' })
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  const secondaryActions = [
    ...(canEdit
      ? [{
          label: 'Editar',
          icon: Edit,
          onClick: () => navigate({ to: `/agencias/${id}/edit` }),
          variant: 'outline' as const,
        }]
      : []),
    ...(canDelete
      ? [{
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => setShowDeleteDialog(true),
          variant: 'destructive' as const,
        }]
      : []),
  ]

  if (isLoading) {
    return <LoadingState label="Cargando agencia..." />
  }

  if (!agencia) {
    return (
      <EmptyState
        title="Agencia no encontrada"
        action={
          <Button onClick={() => navigate({ to: '/agencias' })} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  const isActiva = agencia.activa !== false

  return (
    <DetailPageLayout
      title={agencia.nombre}
      subtitle={agencia.codigo ? `Código: ${agencia.codigo}` : `ID: #${agencia.idAgencia}`}
      backUrl="/agencias"
      status={{
        label: isActiva ? 'Activa' : 'Inactiva',
        variant: isActiva ? 'active' : 'inactive',
      }}
      actions={<QuickActions secondary={secondaryActions} />}
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          <section>
            <SectionTitle title="Información general" variant="detail" icon={<FileText className="h-4 w-4" />} as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
              <Property label="Nombre Agencia" value={agencia.nombre} />
              <Property icon={Mail} label="Email" value={agencia.email || 'No registrado'} />
              <Property label="Código" value={agencia.codigo ?? 'No asignado'} />
            </div>
          </section>

          <section>
            <SectionTitle title="Ubicación" variant="detail" icon={<MapPin className="h-4 w-4" />} as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
              <Property label="Cantón" value={agencia.canton || '-'} />
              <Property label="Dirección" value={agencia.direccion || 'No registrada'} />
            </div>
          </section>

          {(agencia.nombrePersonal || agencia.horarioAtencion) && (
            <section>
              <SectionTitle title="Detalles adicionales" variant="detail" icon={<Clock className="h-4 w-4" />} as="h3" />
              <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                {agencia.nombrePersonal && (
                  <Property icon={User} label="Contacto personal" value={agencia.nombrePersonal} />
                )}
                {agencia.horarioAtencion && (
                  <Property
                    label="Horario de atención"
                    value={
                      <pre className="text-sm font-sans whitespace-pre-wrap text-muted-foreground bg-muted/20 p-2 rounded-md border border-border/20">
                        {agencia.horarioAtencion}
                      </pre>
                    }
                  />
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle title="Estado" variant="detail" as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm flex items-center justify-between">
              <span className="text-sm font-medium">Estado</span>
              <StatusBadge label={isActiva ? 'Activa' : 'Inactiva'} variant={isActiva ? 'active' : 'inactive'} />
            </div>
          </section>

          <section>
            <SectionTitle title="Teléfonos" variant="detail" icon={<Phone className="h-4 w-4" />} as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-3">
              {agencia.telefonos && agencia.telefonos.length > 0 ? (
                agencia.telefonos.map((tel, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                    <span className="font-mono">{tel.numero}</span>
                    {tel.principal && <Badge variant="secondary" className="text-[10px] h-4 px-1">Principal</Badge>}
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">Sin teléfonos registrados</span>
              )}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar la agencia <strong>{agencia.nombre}</strong>? Esta acción no se puede deshacer.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  )
}
