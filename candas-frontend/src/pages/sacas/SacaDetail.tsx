import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useSaca, usePaquetesSaca, useCalcularPesoSaca, useDeleteSaca } from '@/hooks/useSacas'
import { useDespacho } from '@/hooks/useDespachos'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Edit,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Scale,
  Package,
  FileText,
  Calculator,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { cn } from '@/lib/utils'
import AgregarPaquetesDialog from './AgregarPaquetesDialog'
import { EstadoPaquete } from '@/types/paquete'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { EmptyState, LoadingState } from '@/components/states'
import { CAPACIDADES_SACA_KG } from '@/types/saca'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'

export default function SacaDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAgregarPaquetes, setShowAgregarPaquetes] = useState(false)

  const { data: saca, isLoading } = useSaca(id ? Number(id) : undefined)
  const { data: paquetes } = usePaquetesSaca(id ? Number(id) : undefined)
  const { data: despacho } = useDespacho(saca?.idDespacho)
  const calcularPesoMutation = useCalcularPesoSaca()
  const deleteMutation = useDeleteSaca()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/sacas' })
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  const handleCalcularPeso = async () => {
    if (id) {
      try {
        await calcularPesoMutation.mutateAsync(Number(id))
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando saca..." />
  }

  if (!saca) {
    return (
      <EmptyState
        title="Saca no encontrada"
        action={
          <Button variant="outline" onClick={() => navigate({ to: '/sacas' })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  const capacidadMaxima = CAPACIDADES_SACA_KG[saca.tamano] ?? 0
  const pesoActual = saca.pesoTotal || 0
  const numPaquetes = paquetes?.length || 0
  const paquetesEnsacados = paquetes?.filter((p) => p.estado === EstadoPaquete.ENSACADO).length || 0
  const paquetesPendientes = numPaquetes - paquetesEnsacados

  const isCompleted = paquetesEnsacados === numPaquetes && numPaquetes > 0

  return (
    <DetailPageLayout
      title={saca.codigoQr || `Saca #${saca.idSaca}`}
      subtitle={`Orden: ${saca.numeroOrden ?? '-'}`}
      backUrl="/sacas"
      status={{
        label: isCompleted ? 'Completada' : 'En Progreso',
        variant: isCompleted ? 'completed' : 'in-progress',
      }}
      actions={
        <div className="flex items-center gap-2">
          <ProtectedByPermission permission={PERMISSIONS.SACAS.EDITAR}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCalcularPeso}
              disabled={calcularPesoMutation.isPending}
              className="h-8 text-xs hidden md:flex"
            >
              <Calculator className="h-3.5 w-3.5 mr-1.5" />
              Recalcular Peso
            </Button>
            <Button variant="default" size="sm" onClick={() => setShowAgregarPaquetes(true)} className="h-8 text-xs">
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Agregar Paquetes
            </Button>
          </ProtectedByPermission>

          <div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />

          <ProtectedByPermission permission={PERMISSIONS.SACAS.EDITAR}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/sacas/${id}/edit` })}
              className="h-8 text-xs hidden md:flex"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </ProtectedByPermission>
          <ProtectedByPermission permission={PERMISSIONS.SACAS.ELIMINAR}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Eliminar
            </Button>
          </ProtectedByPermission>
        </div>
      }
      maxWidth="xl"
    >

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Column: Metrics & Info */}
        <div className="space-y-8 md:col-span-1">
          <section className="space-y-4">
            <SectionTitle title="Dimensiones" variant="detail" icon={<Scale className="h-4 w-4" />} as="h3" />
            <div className="bg-muted/20 rounded-lg p-4 border border-border/50 space-y-4">
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <span className="text-sm text-muted-foreground">Tamaño</span>
                <span className="font-medium">{saca.tamano}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <span className="text-sm text-muted-foreground">Peso Actual</span>
                <span className="font-mono font-medium">{pesoActual.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Capacidad Máx</span>
                <span className="font-mono text-sm">{capacidadMaxima} kg</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="Fechas" variant="detail" icon={<Calendar className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Creada</label>
                <p className="text-sm font-medium">{saca.fechaCreacion ? new Date(saca.fechaCreacion).toLocaleString() : '-'}</p>
              </div>
              {saca.fechaEnsacado && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Ensacada</label>
                  <p className="text-sm font-medium">{new Date(saca.fechaEnsacado).toLocaleString()}</p>
                </div>
              )}
            </div>
          </section>

          {despacho && (
            <section className="space-y-4">
              <SectionTitle title="Despacho" variant="detail" icon={<FileText className="h-4 w-4" />} as="h3" />
              <div
                onClick={() => navigate({ to: `/despachos/${despacho.idDespacho}` })}
                className="bg-card hover:bg-muted/50 border border-border/50 rounded-lg p-3 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {despacho.numeroManifiesto || `Despacho #${despacho.idDespacho}`}
                    </p>
                    <p className="text-xs text-muted-foreground">ID: {despacho.idDespacho}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Content List */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <SectionTitle title={`Contenido (${numPaquetes})`} variant="detail" icon={<Package className="h-4 w-4" />} as="h3" className="border-0 mb-0" />
            <span className="text-xs text-muted-foreground">
              {paquetesEnsacados} ensacados / {paquetesPendientes} pendientes
            </span>
          </div>

          <div className="space-y-2">
            {(paquetes || []).length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-center border border-dashed border-border/50 rounded-lg bg-muted/10">
                <Package className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Esta saca está vacía.</p>
                <Button variant="link" onClick={() => setShowAgregarPaquetes(true)} className="text-xs">
                  Agregar paquetes
                </Button>
              </div>
            ) : (
              (paquetes || []).map((paquete) => {
                const isEnsacado = paquete.estado === EstadoPaquete.ENSACADO
                const isAsignado = paquete.estado === EstadoPaquete.ASIGNADO_SACA

                return (
                  <div
                    key={paquete.idPaquete}
                    onClick={() => navigate({ to: `/paquetes/${paquete.idPaquete}` })}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer",
                      isEnsacado && "bg-success/5 hover:bg-success/10 border-success/20",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-8 w-8 rounded flex items-center justify-center text-xs font-bold",
                        isEnsacado ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {isEnsacado ? "OK" : "P"}
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {paquete.numeroGuia || `Paquete #${paquete.idPaquete}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{paquete.tipoPaquete}</span>
                          <span>•</span>
                          <span>{paquete.pesoKilos} kg</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge
                        label={paquete.estado}
                        variant={isEnsacado ? 'completed' : isAsignado ? 'pending' : 'in-progress'}
                        className="text-[10px]"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta saca? Esta acción no se puede deshacer.
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

      {showAgregarPaquetes && (
        <AgregarPaquetesDialog
          sacaId={Number(id)}
          open={showAgregarPaquetes}
          onOpenChange={setShowAgregarPaquetes}
        />
      )}
    </DetailPageLayout>
  )
}
