import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useDistribuidor, useDeleteDistribuidor } from '@/hooks/useDistribuidores'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, ArrowLeft, Building2, Mail, Hash, FileText } from 'lucide-react'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { Property } from '@/components/detail/InfoCard'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { QuickActions } from '@/components/detail/QuickActions'
import { EmptyState, LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'

export default function DistribuidorDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const canEdit = useHasPermission(PERMISSIONS.DISTRIBUIDORES.EDITAR)
  const canDelete = useHasPermission(PERMISSIONS.DISTRIBUIDORES.ELIMINAR)

  const { data: distribuidor, isLoading } = useDistribuidor(id ? Number(id) : undefined)
  const deleteMutation = useDeleteDistribuidor()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/distribuidores' })
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
          onClick: () => navigate({ to: `/distribuidores/${id}/edit` }),
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
    return <LoadingState label="Cargando distribuidor..." />
  }

  if (!distribuidor) {
    return (
      <EmptyState
        title="Distribuidor no encontrado"
        action={
          <Button onClick={() => navigate({ to: '/distribuidores' })} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  const isActiva = distribuidor.activa !== false

  return (
    <DetailPageLayout
      title={distribuidor.nombre}
      subtitle={distribuidor.codigo ? `Código: ${distribuidor.codigo}` : `ID: #${distribuidor.idDistribuidor ?? '-'}`}
      backUrl="/distribuidores"
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
              <Property label="Nombre / Razón Social" value={distribuidor.nombre} />
              <Property icon={Hash} label="Código Interno" value={distribuidor.codigo || 'No asignado'} />
              <Property icon={Mail} label="Email de Contacto" value={distribuidor.email || 'No registrado'} />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle title="Estado" variant="detail" as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm flex items-center justify-between">
              <span className="text-sm font-medium">Estado</span>
              <StatusBadge label={isActiva ? 'Activa' : 'Inactiva'} variant={isActiva ? 'active' : 'inactive'} />
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
                  ¿Estás seguro de que deseas eliminar el distribuidor <strong>{distribuidor.nombre}</strong>? Esta acción marcará el distribuidor como inactivo.
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
