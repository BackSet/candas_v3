import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useDespacho, useSacasDespacho, useDeleteDespacho } from '@/hooks/useDespachos'
import { useAgencia } from '@/hooks/useAgencias'
import { useDistribuidor } from '@/hooks/useDistribuidores'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, Boxes, Calendar, MapPin, Building2, Truck, User, FileText, Package2 } from 'lucide-react'
import AgregarSacasDialog from './AgregarSacasDialog'
import { Badge } from '@/components/ui/badge'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { Property } from '@/components/detail/InfoCard'
import { QuickActions } from '@/components/detail/QuickActions'
import { LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'

export default function DespachoDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAgregarSacas, setShowAgregarSacas] = useState(false)

  const { data: despacho, isLoading } = useDespacho(id ? Number(id) : undefined)
  const { data: sacas } = useSacasDespacho(id ? Number(id) : undefined)
  const { data: agencia } = useAgencia(despacho?.idAgencia)
  const { data: distribuidor } = useDistribuidor(despacho?.idDistribuidor)
  const deleteMutation = useDeleteDespacho()

  const canEdit = useHasPermission(PERMISSIONS.DESPACHOS.EDITAR)
  const canDelete = useHasPermission(PERMISSIONS.DESPACHOS.ELIMINAR)

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/despachos' })
      } catch {
        // Error ya manejado en el hook
      }
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando despacho..." />
  }

  if (!despacho) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-error font-medium">Despacho no encontrado</p>
        <Button onClick={() => navigate({ to: '/despachos' })} variant="outline">
          Volver a la lista
        </Button>
      </div>
    )
  }

  const totalSacas = despacho.sacas?.length || sacas?.length || 0
  const totalPaquetes = despacho.sacas?.reduce((acc, saca) => {
    return acc + (saca.idPaquetes?.length || 0)
  }, 0) || 0

  const secondaryActions = [
    ...(canEdit
      ? [
          {
            label: 'Editar',
            icon: Edit,
            onClick: () => navigate({ to: `/despachos/${id}/edit` }),
            variant: 'outline' as const,
          },
          {
            label: 'Agregar Sacas',
            icon: Boxes,
            onClick: () => setShowAgregarSacas(true),
            variant: 'default' as const,
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

  return (
    <DetailPageLayout
      title={despacho.numeroManifiesto || `Despacho #${despacho.idDespacho}`}
      subtitle={despacho.numeroManifiesto ? `ID: ${despacho.idDespacho}` : undefined}
      backUrl="/despachos"
      actions={<QuickActions secondary={secondaryActions} />}
      maxWidth="xl"
    >
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Información Básica */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle
            title="Información Básica"
            variant="detail"
            icon={<FileText className="h-4 w-4" />}
          />
          <div className="space-y-1">
            <Property icon={FileText} label="Manifiesto" value={despacho.numeroManifiesto || '-'} />
            <Property
              icon={Calendar}
              label="Fecha de Despacho"
              value={
                despacho.fechaDespacho
                  ? new Date(despacho.fechaDespacho).toLocaleString('es-ES')
                  : '-'
              }
            />
            <Property icon={User} label="Usuario Registro" value={despacho.usuarioRegistro} />
            {despacho.numeroGuiaAgenciaDistribucion && (
              <Property
                icon={FileText}
                label="Guía Agencia Distrib."
                value={despacho.numeroGuiaAgenciaDistribucion}
              />
            )}
            {despacho.codigoPresinto && (
              <Property icon={FileText} label="Código Presinto" value={despacho.codigoPresinto} />
            )}
          </div>
        </div>

        {/* Destino */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle
            title="Destino"
            variant="detail"
            icon={<MapPin className="h-4 w-4" />}
          />
          <div className="space-y-3">
            {agencia && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 text-primary" />
                  Agencia
                </div>
                <div className="text-sm">
                  <p className="font-medium">{agencia.nombre}</p>
                  {agencia.codigo && (
                    <span className="text-muted-foreground text-xs">{agencia.codigo}</span>
                  )}
                  {agencia.canton && (
                    <p className="text-xs text-muted-foreground mt-1">{agencia.canton}</p>
                  )}
                </div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => navigate({ to: `/agencias/${agencia.idAgencia}` })}
                >
                  Ver Agencia &rarr;
                </Button>
              </div>
            )}
            {distribuidor && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4 text-primary" />
                  Distribuidor
                </div>
                <div className="text-sm">
                  <p className="font-medium">{distribuidor.nombre}</p>
                  {distribuidor.codigo && (
                    <span className="text-muted-foreground text-xs">{distribuidor.codigo}</span>
                  )}
                </div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() =>
                    navigate({ to: `/distribuidores/${distribuidor.idDistribuidor}` })
                  }
                >
                  Ver Distribuidor &rarr;
                </Button>
              </div>
            )}
            {(despacho.idDestinatarioDirecto != null ||
              despacho.despachoDirecto != null) && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Destinatario Directo
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {despacho.despachoDirecto?.destinatarioDirecto?.nombreDestinatario || '-'}
                  </p>
                  {despacho.despachoDirecto?.destinatarioDirecto?.telefonoDestinatario && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {despacho.despachoDirecto.destinatarioDirecto.telefonoDestinatario}
                    </p>
                  )}
                  {despacho.despachoDirecto?.destinatarioDirecto?.provincia && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {despacho.despachoDirecto.destinatarioDirecto.provincia}
                    </p>
                  )}
                </div>
                {(despacho.idDestinatarioDirecto ??
                  despacho.despachoDirecto?.destinatarioDirecto?.idDestinatarioDirecto) !=
                  null && (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() =>
                      navigate({
                        to: `/destinatarios-directos/${despacho.idDestinatarioDirecto ?? despacho.despachoDirecto?.destinatarioDirecto?.idDestinatarioDirecto}`,
                      })
                    }
                  >
                    Ver Destinatario &rarr;
                  </Button>
                )}
              </div>
            )}
            {!agencia && !distribuidor && despacho.idDestinatarioDirecto == null && despacho.despachoDirecto == null && (
              <p className="text-sm text-muted-foreground italic">Sin destino asignado</p>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle
            title="Resumen"
            variant="detail"
            icon={<Package2 className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-primary">{totalSacas}</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">
                Sacas
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/20 border border-secondary/20 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-foreground">{totalPaquetes}</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">
                Paquetes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Observaciones */}
      {despacho.observaciones && (
        <section className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-3">
          <SectionTitle title="Observaciones" variant="detail" />
          <div className="p-4 rounded-lg bg-muted/30 text-sm leading-relaxed border border-border/40">
            {despacho.observaciones}
          </div>
        </section>
      )}

      {/* Listado de Sacas */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Boxes className="h-5 w-5 text-muted-foreground" />
            Sacas Asociadas
            <Badge variant="secondary" className="ml-2 rounded-full px-2.5">
              {totalSacas}
            </Badge>
          </h3>
          {(despacho.sacas || sacas || []).length === 0 && canEdit && (
            <Button size="sm" variant="outline" onClick={() => setShowAgregarSacas(true)}>
              <Boxes className="h-4 w-4 mr-2" />
              Agregar Primera Saca
            </Button>
          )}
        </div>

        <div className="border rounded-xl overflow-hidden bg-card/50 shadow-sm">
          {(despacho.sacas || sacas || []).length > 0 ? (
            <div className="divide-y divide-border/50">
              {(despacho.sacas || sacas || []).map((saca, index) => {
                const numPaquetes = saca.idPaquetes?.length || 0
                const peso = saca.pesoTotal || 0

                return (
                  <div
                    key={saca.idSaca || index}
                    className="flex items-center p-4 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold mr-4">
                      {saca.numeroOrden || index + 1}
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          Saca #{saca.numeroOrden || index + 1}
                          {saca.codigoQr && (
                            <Badge variant="outline" className="text-[10px] font-mono h-5">
                              {saca.codigoQr}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="capitalize">{saca.tamano?.toLowerCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground font-medium">
                            Paquetes
                          </span>
                          <span>{numPaquetes}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground font-medium">
                            Peso
                          </span>
                          <span>{peso > 0 ? `${peso} kg` : '-'}</span>
                        </div>
                      </div>
                    </div>

                    {saca.idSaca && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate({ to: `/sacas/${saca.idSaca}` })}
                      >
                        Ver Detalles &rarr;
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <Boxes className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <h3 className="text-sm font-medium">Sin sacas asociadas</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Este despacho aún no tiene sacas. Agrega sacas para completar el despacho.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Diálogo de eliminación */}
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
                  ¿Estás seguro de que deseas eliminar este despacho? Esta acción no se puede
                  deshacer.
                </DialogDescription>
              </div>
            </div>
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

      {showAgregarSacas && (
        <AgregarSacasDialog
          despachoId={Number(id)}
          open={showAgregarSacas}
          onOpenChange={setShowAgregarSacas}
        />
      )}
    </DetailPageLayout>
  )
}
