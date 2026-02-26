import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { usePuntoOrigen, useDeletePuntoOrigen } from '@/hooks/usePuntosOrigen'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, ArrowLeft, MapPin, Info } from 'lucide-react'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { Property } from '@/components/detail/InfoCard'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { QuickActions } from '@/components/detail/QuickActions'
import { EmptyState, LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'

export default function PuntoOrigenDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const canEdit = useHasPermission(PERMISSIONS.PUNTOS_ORIGEN.EDITAR)
  const canDelete = useHasPermission(PERMISSIONS.PUNTOS_ORIGEN.ELIMINAR)

  const { data: origen, isLoading } = usePuntoOrigen(id ? Number(id) : undefined)
  const deleteMutation = useDeletePuntoOrigen()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/puntos-origen' })
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando punto de origen..." />
  }

  if (!origen) {
    return (
      <EmptyState
        title="Punto de origen no encontrado"
        action={
          <Button variant="outline" onClick={() => navigate({ to: '/puntos-origen' })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  const isActivo = origen.activo !== false

  const secondaryActions = [
    ...(canEdit
      ? [{
          label: 'Editar',
          icon: Edit,
          onClick: () => navigate({ to: `/puntos-origen/${id}/edit` }),
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

  return (
    <DetailPageLayout
      title={origen.nombrePuntoOrigen}
      subtitle={`ID: #${origen.idPuntoOrigen ?? '-'}`}
      backUrl="/puntos-origen"
      status={{
        label: isActivo ? 'Activo' : 'Inactivo',
        variant: isActivo ? 'active' : 'inactive',
      }}
      actions={<QuickActions secondary={secondaryActions} />}
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle title="Información General" variant="detail" icon={<MapPin className="h-4 w-4" />} as="h3" />
          <div className="space-y-3">
            <Property icon={MapPin} label="Nombre" value={origen.nombrePuntoOrigen} />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle title="Estado" variant="detail" icon={<Info className="h-4 w-4" />} as="h3" />
          <div className="space-y-3">
            <Property
              icon={Info}
              label="Estado Actual"
              value={
                <StatusBadge
                  label={isActivo ? 'Activo' : 'Inactivo'}
                  variant={isActivo ? 'active' : 'inactive'}
                />
              }
            />
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-destructive/10">
            <DialogTitle className="text-destructive">Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este punto de origen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  )
}
