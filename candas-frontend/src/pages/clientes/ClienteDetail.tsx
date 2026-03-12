import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useCliente, useDeleteCliente } from '@/hooks/useClientes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, User, Mail, Phone, MapPin, FileText, ArrowLeft, History } from 'lucide-react'
import { QuickActions } from '@/components/detail/QuickActions'
import { Separator } from '@/components/ui/separator'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { Property } from '@/components/detail/InfoCard'
import { EmptyState, LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'

export default function ClienteDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: cliente, isLoading } = useCliente(id ? Number(id) : undefined)
  const deleteMutation = useDeleteCliente()
  const canEdit = useHasPermission(PERMISSIONS.CLIENTES.EDITAR)
  const canDelete = useHasPermission(PERMISSIONS.CLIENTES.ELIMINAR)

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/clientes' })
      } catch (error) {
        // Error handling inside hook
      }
    }
  }

  if (isLoading) return <LoadingState label="Cargando perfil..." />

  if (!cliente) {
    return (
      <EmptyState
        title="Cliente no encontrado"
        action={
          <Button onClick={() => navigate({ to: '/clientes' })} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  const isActivo = cliente.activo !== false
  const secondaryActions = [
    ...(canEdit ? [{
      label: 'Editar',
      icon: Edit,
      onClick: () => navigate({ to: `/clientes/${id}/edit` }),
      variant: 'outline' as const,
    }] : []),
    ...(canDelete ? [{
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => setShowDeleteDialog(true),
      variant: 'destructive' as const,
    }] : []),
  ]

  return (
    <DetailPageLayout
      title={cliente.nombreCompleto}
      subtitle={`ID: #${cliente.idCliente}`}
      backUrl="/clientes"
      status={{
        label: isActivo ? 'Activo' : 'Inactivo',
        variant: isActivo ? 'active' : 'inactive',
      }}
      actions={<QuickActions secondary={secondaryActions} />}
      maxWidth="xl"
    >

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Primary Info */}
            <div className="lg:col-span-2 space-y-8">

              {/* Personal Info Group */}
              <section>
                <SectionTitle title="Información personal" variant="detail" icon={<User className="h-4 w-4" />} as="h3" />
                <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                  <Property icon={User} label="Nombre completo" value={cliente.nombreCompleto} />
                  <Property icon={FileText} label="Documento ID" value={cliente.documentoIdentidad || 'No registrado'} />
                  <Property icon={Mail} label="Email" value={cliente.email || 'No registrado'} />
                </div>
              </section>

              {/* Dirección */}
              <section>
                <SectionTitle title="Dirección" variant="detail" icon={<MapPin className="h-4 w-4" />} as="h3" />
                <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-medium mb-1">
                        {cliente.direccion || 'Sin dirección detallada'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        {cliente.provincia && <span>{cliente.provincia}</span>}
                        {cliente.provincia && cliente.canton && <span className="opacity-30">•</span>}
                        {cliente.canton && <span>{cliente.canton}</span>}
                        {(cliente.provincia || cliente.canton) && cliente.pais && <span className="opacity-30">•</span>}
                        {cliente.pais && <span className="text-foreground/80">{cliente.pais}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Sidebar Info */}
            <div className="space-y-8">

              {/* Status Widget */}
              <section>
                <SectionTitle title="Estado de cuenta" variant="detail" as="h3" />
                <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm flex items-center justify-between">
                  <span className="text-sm font-medium">Estado</span>
                  <StatusBadge label={isActivo ? 'Activo' : 'Inactivo'} variant={isActivo ? 'active' : 'inactive'} />
                </div>
              </section>

              {/* Contacto */}
              <section>
                <SectionTitle title="Teléfono" variant="detail" icon={<Phone className="h-4 w-4" />} as="h3" />
                <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
                  <span className="font-mono text-sm">{cliente.telefono || 'No registrado'}</span>
                </div>
              </section>

              {/* Meta Info */}
              <section>
                <SectionTitle title="Metadatos" variant="detail" icon={<History className="h-4 w-4" />} as="h3" />
                <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                  <Property label="Fecha registro" value={cliente.fechaRegistro ? new Date(cliente.fechaRegistro).toLocaleDateString() : '-'} />
                  <Separator />
                  <Property label="ID interno" value={<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{cliente.idCliente}</code>} />
                </div>
              </section>

            </div>
          </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer y podría afectar a registros vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  )
}
