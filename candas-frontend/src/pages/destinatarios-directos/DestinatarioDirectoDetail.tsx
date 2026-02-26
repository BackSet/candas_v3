import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useDestinatarioDirecto, useDeleteDestinatarioDirecto } from '@/hooks/useDestinatariosDirectos'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, ArrowLeft, User, Phone, MapPin, FileText, History } from 'lucide-react'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { Property } from '@/components/detail/InfoCard'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { QuickActions } from '@/components/detail/QuickActions'
import { EmptyState, LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'

export default function DestinatarioDirectoDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const canEdit = useHasPermission(PERMISSIONS.DESTINATARIOS_DIRECTOS.EDITAR)
  const canDelete = useHasPermission(PERMISSIONS.DESTINATARIOS_DIRECTOS.ELIMINAR)

  const { data: destinatario, isLoading } = useDestinatarioDirecto(id ? Number(id) : undefined)
  const deleteMutation = useDeleteDestinatarioDirecto()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/destinatarios-directos' })
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  const secondaryActions = [
    ...(canEdit
      ? [
          {
            label: 'Editar',
            icon: Edit,
            onClick: () => navigate({ to: `/destinatarios-directos/${id}/edit` }),
            variant: 'outline' as const,
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => setShowDeleteDialog(true),
            variant: 'destructive' as const,
          },
        ]
      : []),
  ]

  if (isLoading) {
    return <LoadingState label="Cargando destinatario..." />
  }

  if (!destinatario) {
    return (
      <EmptyState
        title="Destinatario no encontrado"
        action={
          <Button onClick={() => navigate({ to: '/destinatarios-directos' })} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  const isActivo = destinatario.activo !== false

  return (
    <DetailPageLayout
      title={destinatario.nombreDestinatario}
      subtitle={`ID: #${destinatario.idDestinatarioDirecto ?? '-'}`}
      backUrl="/destinatarios-directos"
      status={{
        label: isActivo ? 'Activo' : 'Inactivo',
        variant: isActivo ? 'active' : 'inactive',
      }}
      actions={<QuickActions secondary={secondaryActions} />}
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionTitle title="Información general" variant="detail" icon={<User className="h-4 w-4" />} as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
              <Property icon={User} label="Nombre completo" value={destinatario.nombreDestinatario} />
              {destinatario.nombreEmpresa && (
                <Property icon={FileText} label="Empresa" value={destinatario.nombreEmpresa} />
              )}
              <Property label="Código" value={destinatario.codigo ?? 'No asignado'} />
              <Property
                icon={History}
                label="Fecha registro"
                value={
                  destinatario.fechaRegistro
                    ? new Date(destinatario.fechaRegistro).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'
                }
              />
            </div>
          </section>

          <section>
            <SectionTitle title="Contacto y ubicación" variant="detail" icon={<MapPin className="h-4 w-4" />} as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
              <Property icon={Phone} label="Teléfono" value={destinatario.telefonoDestinatario} />
              <Property label="Cantón" value={destinatario.canton ?? '-'} />
              <Property
                label="Dirección"
                value={destinatario.direccionDestinatario ?? 'No registrada'}
              />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle title="Estado" variant="detail" as="h3" />
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm flex items-center justify-between">
              <span className="text-sm font-medium">Estado</span>
              <StatusBadge label={isActivo ? 'Activo' : 'Inactivo'} variant={isActivo ? 'active' : 'inactive'} />
            </div>
          </section>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{destinatario.nombreDestinatario}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
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
