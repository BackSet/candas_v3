import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useAtencionPaquete, useDeleteAtencionPaquete } from '@/hooks/useAtencionPaquetes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, ArrowLeft, CheckCircle, Package, Calendar, AlertTriangle } from 'lucide-react'
import { EstadoAtencion, getTipoProblemaLabel } from '@/types/atencion-paquete'
import ResolverDialog from './ResolverDialog'
import { cn } from '@/lib/utils'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { EmptyState, DetailSkeleton } from '@/components/states'
import { ErrorState } from '@/components/states/ErrorState'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { getApiErrorMessage, getApiStatus } from '@/lib/api/errors'

export default function AtencionPaqueteDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResolverDialog, setShowResolverDialog] = useState(false)

  const { data: atencion, isLoading, error } = useAtencionPaquete(id ? Number(id) : undefined)
  const deleteMutation = useDeleteAtencionPaquete()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/atencion-paquetes' })
      } catch { /* hook */ }
    }
  }

  if (isLoading) {
    return (
      <DetailPageLayout
        title="Cargando información..."
        backUrl="/atencion-paquetes"
        maxWidth="xl"
      >
        <DetailSkeleton />
      </DetailPageLayout>
    )
  }

  if (!atencion) {
    const status = getApiStatus(error)
    if (status === 403) {
      return (
        <ErrorState
          title="Acceso restringido por agencia"
          description={getApiErrorMessage(error, 'No tienes acceso a esta atención por alcance de agencia.')}
          action={
            <Button onClick={() => navigate({ to: '/atencion-paquetes' })} variant="outline" className="rounded-lg">
              Volver a la lista
            </Button>
          }
        />
      )
    }
    return (
      <EmptyState
        title="Atención no encontrada"
        icon={<AlertTriangle className="h-5 w-5" />}
        action={
          <Button onClick={() => navigate({ to: '/atencion-paquetes' })} variant="outline" className="rounded-lg">
            Volver a la lista
          </Button>
        }
      />
    )
  }

  return (
    <DetailPageLayout
      title={`Atención #${atencion.idAtencion}`}
      subtitle={`Paquete #${atencion.idPaquete}`}
      backUrl="/atencion-paquetes"
      status={{
        label: atencion.estado,
        variant:
          atencion.estado === EstadoAtencion.RESUELTO ? 'completed'
            : atencion.estado === EstadoAtencion.PENDIENTE ? 'pending'
              : 'in-progress',
      }}
      actions={
        <div className="flex gap-2">
          {atencion.estado === EstadoAtencion.PENDIENTE && (
            <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowResolverDialog(true)}
                className="h-8 shadow-sm rounded-lg"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Resolver
              </Button>
            </ProtectedByPermission>
          )}
          <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.EDITAR}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: `/atencion-paquetes/${id}/edit` })}
              className="h-8 rounded-lg"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.ATENCION_PAQUETES.ELIMINAR}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Eliminar
            </Button>
          </ProtectedByPermission>
        </div>
      }
      maxWidth="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Detalles del Incidente</h3>
            <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm p-6 space-y-6 shadow-sm">
              <div>
                <label className="text-xs text-muted-foreground font-bold uppercase mb-1.5 block tracking-wider">Motivo Reportado</label>
                <div className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                  {atencion.motivo}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div>
                  <label className="text-xs text-muted-foreground font-bold uppercase mb-1 block tracking-wider">Tipo de Problema</label>
                  <div className="font-medium">{getTipoProblemaLabel(atencion.tipoProblema)}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-bold uppercase mb-1 block tracking-wider">Fecha Solicitud</label>
                  <div className="font-medium tabular-nums">
                    {atencion.fechaSolicitud ? new Date(atencion.fechaSolicitud).toLocaleString() : '-'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {atencion.observacionesResolucion && (
            <section className="space-y-4">
              <SectionTitle title="Resolución" variant="detail" icon={<CheckCircle className="h-4 w-4 text-success" />} as="h3" />
              <div className="rounded-2xl border border-emerald-200/30 bg-emerald-50/30 dark:bg-emerald-900/5 p-6 border-l-4 border-l-emerald-400/40 shadow-sm">
                <label className="text-xs text-muted-foreground font-bold uppercase mb-2 block tracking-wider">Observaciones de Resolución</label>
                <div className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                  {atencion.observacionesResolucion}
                </div>
                <div className="mt-4 pt-4 border-t border-border/30 text-xs text-muted-foreground">
                  Resuelto el {atencion.fechaResolucion ? new Date(atencion.fechaResolucion).toLocaleDateString() : '-'}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Paquete Asociado</h3>
            <div
              className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm p-0 overflow-hidden group hover:border-primary/30 transition-all duration-200 cursor-pointer shadow-sm"
              onClick={() => navigate({ to: `/paquetes/${atencion.idPaquete}` })}
            >
              <div className="p-3.5 bg-muted/20 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">ID: {atencion.idPaquete}</span>
                  <ArrowLeft className="h-3 w-3 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Ver detalles del paquete</div>
                    <div className="text-xs text-muted-foreground">Clic para navegar</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="Fechas Importantes" variant="detail" as="h3" />
            <div className="rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm p-4 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground/60 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Creado</div>
                  <div className="text-sm text-muted-foreground tabular-nums">
                    {atencion.fechaSolicitud ? new Date(atencion.fechaSolicitud).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>
              {atencion.fechaResolucion && (
                <div className="flex items-start gap-3 pt-3 border-t border-border/20">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Resuelto</div>
                    <div className="text-sm text-muted-foreground tabular-nums">
                      {new Date(atencion.fechaResolucion).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta solicitud de atención? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteMutation.isPending} className="rounded-lg">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showResolverDialog && (
        <ResolverDialog
          atencionId={Number(id)}
          open={showResolverDialog}
          onOpenChange={setShowResolverDialog}
        />
      )}
    </DetailPageLayout>
  )
}
