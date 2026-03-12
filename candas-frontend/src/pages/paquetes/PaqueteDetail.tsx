import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  usePaquete,
  usePaquetesHijos,
  useDeletePaquete,
  useMarcarEtiquetaCambiada,
  useMarcarSeparado,
  useMarcarUnidoEnCaja,
} from '@/hooks/usePaquetes'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Edit,
  Trash2,
  Package,
  Calendar,
  MapPin,
  User,
  Building2,
  Boxes,
  FileText,
  Package2,
  Scale,
  DollarSign,
  Ruler,
  Tag,
  Scissors,
  Box,
  CheckCircle2,
  MoreHorizontal,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Share2,
  Activity
} from 'lucide-react'
import { RelatedEntityLink } from '@/components/detail/RelatedEntityLink'
import { TipoPaquete } from '@/types/paquete'
import { guiaEfectiva } from '@/utils/paqueteGuia'
import SepararPaqueteDialog from './SepararPaqueteDialog'
import CambiarEstadoDialog from './CambiarEstadoDialog'
import { cn } from '@/lib/utils'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { Property } from '@/components/detail/InfoCard'
import { SectionTitle } from '@/components/ui/section-title'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { EmptyState, LoadingState } from '@/components/states'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { getEstadoPaqueteBadgeVariant } from '@/utils/paqueteEstado'

export default function PaqueteDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSepararDialog, setShowSepararDialog] = useState(false)
  const [showCambiarEstadoDialog, setShowCambiarEstadoDialog] = useState(false)

  const { data: paquete, isLoading } = usePaquete(id ? Number(id) : undefined)
  const { data: paquetesHijos } = usePaquetesHijos(id ? Number(id) : undefined)
  const deleteMutation = useDeletePaquete()

  const marcarEtiquetaCambiadaMutation = useMarcarEtiquetaCambiada()
  const marcarSeparadoMutation = useMarcarSeparado()
  const marcarUnidoEnCajaMutation = useMarcarUnidoEnCaja()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/paquetes' })
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando paquete..." />
  }

  if (!paquete) {
    return (
      <EmptyState
        title="Paquete no encontrado"
        action={
          <Button onClick={() => navigate({ to: '/paquetes' })} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  // Handlers
  const handleMarcarEtiquetaCambiada = async () => {
    if (id) await marcarEtiquetaCambiadaMutation.mutateAsync(Number(id))
  }
  const handleMarcarSeparado = async () => {
    if (id) await marcarSeparadoMutation.mutateAsync(Number(id))
  }
  const handleMarcarUnidoEnCaja = async () => {
    if (id) await marcarUnidoEnCajaMutation.mutateAsync(Number(id))
  }

  return (
    <DetailPageLayout
      title={guiaEfectiva(paquete) || `Paquete #${paquete.idPaquete}`}
      subtitle={`ID: ${paquete.idPaquete}${paquete.tipoPaquete ? ` • ${paquete.tipoPaquete}` : ''}`}
      backUrl="/paquetes"
      onBack={() => {
        if (window.history.length > 1) {
          window.history.back()
          return
        }
        navigate({ to: '/paquetes' })
      }}
      status={{
        label: paquete.estado,
        variant: getEstadoPaqueteBadgeVariant(paquete.estado),
      }}
      actions={
        <div className="flex items-center gap-2">
          <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: `/paquetes/${id}/edit` })}>
              <Edit className="h-3.5 w-3.5 mr-2" /> Editar
            </Button>
          </ProtectedByPermission>

          <ProtectedByPermission permissions={[PERMISSIONS.PAQUETES.EDITAR, PERMISSIONS.PAQUETES.ELIMINAR]}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <ProtectedByPermission permission={PERMISSIONS.PAQUETES.EDITAR}>
                <DropdownMenuItem onClick={() => setShowCambiarEstadoDialog(true)}>
                  <ClipboardList className="h-3.5 w-3.5 mr-2" /> Cambiar Estado
                </DropdownMenuItem>

                {paquete.tipoPaquete === TipoPaquete.SEPARAR && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowSepararDialog(true)}>
                      <Scissors className="h-3.5 w-3.5 mr-2" /> Separar Paquete
                    </DropdownMenuItem>
                    {!paquete.separado && (
                      <DropdownMenuItem onClick={handleMarcarSeparado}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Marcar como Separado
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {paquete.tipoPaquete === TipoPaquete.CLEMENTINA && !paquete.etiquetaCambiada && (
                  <DropdownMenuItem onClick={handleMarcarEtiquetaCambiada}>
                    <Tag className="h-3.5 w-3.5 mr-2" /> Marcar Etiqueta Cambiada
                  </DropdownMenuItem>
                )}

                {paquete.tipoPaquete === TipoPaquete.CADENITA && !paquete.unidoEnCaja && (
                  <DropdownMenuItem onClick={handleMarcarUnidoEnCaja}>
                    <Box className="h-3.5 w-3.5 mr-2" /> Marcar Unido en Caja
                  </DropdownMenuItem>
                )}
              </ProtectedByPermission>

              <DropdownMenuSeparator />
              <ProtectedByPermission permission={PERMISSIONS.PAQUETES.ELIMINAR}>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                </DropdownMenuItem>
              </ProtectedByPermission>
            </DropdownMenuContent>
          </DropdownMenu>
          </ProtectedByPermission>
        </div>
      }
      maxWidth="xl"
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left Column: Properties */}
            <div className="lg:col-span-2 space-y-10">

              {/* Basic Info Group */}
              <section>
                <SectionTitle title="Detalles Generales" variant="detail" icon={<FileText className="h-4 w-4 text-muted-foreground" />} as="h3" />
                <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                  <div className="p-4 space-y-1 divide-y divide-border/30">
                    <Property label="Número Master" value={paquete.numeroMaster || '-'} />
                    <Property label="SED" value={paquete.sed || '-'} />
                    <Property
                      label="Fecha Registro"
                      value={paquete.fechaRegistro ? new Date(paquete.fechaRegistro).toLocaleString('es-ES') : '-'}
                      icon={Calendar}
                    />
                  </div>
                </div>
              </section>

              {/* Physical Properties */}
              <section>
                <SectionTitle title="Dimensiones y Valor" variant="detail" icon={<Scale className="h-4 w-4 text-muted-foreground" />} as="h3" />
                <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                  <div className="p-4 space-y-1 divide-y divide-border/30">
                    <Property label="Peso (kg)" value={paquete.pesoKilos ? `${paquete.pesoKilos} kg` : '-'} />
                    <Property label="Peso (lbs)" value={paquete.pesoLibras ? `${paquete.pesoLibras} lbs` : '-'} />
                    <Property label="Medidas" value={paquete.medidas || '-'} icon={Ruler} />
                    <Property label="Valor Declarado" value={paquete.valor ? `$${paquete.valor.toFixed(2)}` : '-'} icon={DollarSign} />
                    <Property label="Tarifa Position" value={paquete.tarifaPosition || '-'} />
                    <Property label="REF" value={paquete.ref || '-'} icon={Tag} />
                  </div>
                </div>
              </section>

              {/* Logistics Chain */}
              <section>
                <SectionTitle title="Logística" variant="detail" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} as="h3" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Remitente Block */}
                  <div className="rounded-xl border border-border/60 p-5 bg-card hover:border-border transition-colors">
                    <div className="text-xs font-bold text-muted-foreground mb-3 uppercase flex items-center gap-2">
                      <User className="h-3.5 w-3.5" /> Remitente
                    </div>
                    <div className="text-base font-medium mb-1">{paquete.nombreClienteRemitente || 'Desconocido'}</div>
                    {paquete.direccionRemitenteCompleta && (
                      <div className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed" title={paquete.direccionRemitenteCompleta}>
                        {paquete.direccionRemitenteCompleta}
                      </div>
                    )}
                    {paquete.nombrePuntoOrigen ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-info/10 text-info text-xs font-medium border border-info/20">
                        <MapPin className="h-3 w-3" />
                        {paquete.nombrePuntoOrigen}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">Origen no especificado</div>
                    )}
                  </div>

                  {/* Destinatario Block */}
                  <div className="rounded-xl border border-border/60 p-5 bg-card hover:border-border transition-colors">
                    <div className="text-xs font-bold text-muted-foreground mb-3 uppercase flex items-center gap-2">
                      <User className="h-3.5 w-3.5" /> Destinatario
                    </div>
                    <div className="text-base font-medium mb-1">{paquete.nombreClienteDestinatario || 'Desconocido'}</div>
                    {paquete.documentoDestinatario && <div className="text-xs text-muted-foreground mb-2 font-mono">{paquete.documentoDestinatario}</div>}

                    {paquete.direccionDestinatarioCompleta && (
                      <div className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed" title={paquete.direccionDestinatarioCompleta}>
                        {paquete.direccionDestinatarioCompleta}
                      </div>
                    )}
                    {paquete.nombreAgenciaDestino ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                        <Building2 className="h-3 w-3" />
                        {paquete.nombreAgenciaDestino}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">Destino General</div>
                    )}
                  </div>
                </div>
              </section>

              {/* Notes */}
              {(paquete.descripcion || paquete.observaciones) && (
                <section>
                  <SectionTitle title="Notas" variant="detail" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} as="h3" />
                  <div className="space-y-4">
                    {paquete.descripcion && (
                      <div className="p-4 bg-warning/10 rounded-lg border border-warning/20 text-sm">
                        <span className="font-bold text-xs uppercase tracking-wider text-warning block mb-2">Descripción del Contenido</span>
                        <p className="text-foreground/90 leading-relaxed">{paquete.descripcion}</p>
                      </div>
                    )}
                    {paquete.observaciones && (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50 text-sm">
                        <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block mb-2">Observaciones Internas</span>
                        <p className="text-foreground/90 leading-relaxed font-mono text-xs">{paquete.observaciones}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Children Packages */}
              {paquetesHijos && paquetesHijos.length > 0 && (
                <section>
                  <SectionTitle title="Paquetes Hijos" variant="detail" icon={<Boxes className="h-4 w-4 text-muted-foreground" />} as="h3" />
                  <div className="rounded-xl border border-border overflow-hidden bg-card">
                    {paquetesHijos.map((hijo, i) => (
                      <div
                        key={hijo.idPaquete}
                        onClick={() => navigate({ to: `/paquetes/${hijo.idPaquete}` })}
                        className={cn(
                          "flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors group",
                          i !== paquetesHijos.length - 1 && "border-b border-border/40"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground group-hover:underline decoration-primary underline-offset-4">{guiaEfectiva(hijo) || `Paquete #${hijo.idPaquete}`}</div>
                            {hijo.etiquetaDestinatario && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Tag className="h-3 w-3" /> {hijo.etiquetaDestinatario}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Meta & Actions */}
            <div className="space-y-10">

              {/* Linked Entities */}
              <section>
                <SectionTitle title="Vinculaciones" variant="detail" icon={<Share2 className="h-4 w-4 text-muted-foreground" />} as="h3" />
                <div className="flex flex-col gap-3">
                  <RelatedEntityLink
                    icon={Boxes}
                    label="Saca Contenedora"
                    value={paquete.numeroSaca ? `Saca ${paquete.numeroSaca}` : null}
                    fallback="No asignada"
                    link={paquete.idSaca ? `/sacas/${paquete.idSaca}` : null}
                  />
                  <RelatedEntityLink
                    icon={Package2}
                    label="Despacho"
                    value={paquete.numeroManifiesto ? `Manifiesto ${paquete.numeroManifiesto}` : null}
                    fallback="No despachado"
                    link={paquete.idDespacho ? `/despachos/${paquete.idDespacho}` : null}
                  />
                  <RelatedEntityLink
                    icon={FileText}
                    label="Lote de Recepción"
                    value={paquete.numeroRecepcion || null}
                    fallback="No vinculado"
                    link={paquete.idLoteRecepcion ? `/lotes-recepcion/${paquete.idLoteRecepcion}` : null}
                  />
                </div>
              </section>

              {/* Padhe Relationships (if child) */}
              {paquete.idPaquetePadre && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dependencia</h3>
                  <div className="p-3 bg-info/10 rounded-md border border-info/20">
                    <div className="text-xs font-medium text-info mb-1">Paquete Hijo de</div>
                    <div
                      onClick={() => navigate({ to: `/paquetes/${paquete.idPaquetePadre}` })}
                      className="text-sm font-medium hover:underline cursor-pointer flex items-center gap-1 text-foreground"
                    >
                      {paquete.numeroGuiaPaquetePadre || `Paquete #${paquete.idPaquetePadre}`}
                      <ArrowLeft className="h-3 w-3 rotate-45" />
                    </div>
                    {!paquete.numeroGuia?.trim() && paquete.numeroGuiaPaquetePadre?.trim() && (
                      <div className="text-xs text-muted-foreground mt-2">Guía (origen): {paquete.numeroGuiaPaquetePadre.trim()}</div>
                    )}
                  </div>
                </section>
              )}

              {/* Special Op Status */}
              {(paquete.tipoPaquete === TipoPaquete.CLEMENTINA || paquete.tipoPaquete === TipoPaquete.SEPARAR || paquete.tipoPaquete === TipoPaquete.CADENITA) && (
                <section>
                  <SectionTitle title="Estado Operativo" variant="detail" icon={<Activity className="h-4 w-4 text-muted-foreground" />} as="h3" />
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                    {paquete.tipoPaquete === TipoPaquete.CLEMENTINA && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Etiqueta Cambiada</span>
                        {paquete.etiquetaCambiada ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <StatusBadge label="Pendiente" variant="pending" />
                        )}
                      </div>
                    )}
                    {paquete.tipoPaquete === TipoPaquete.SEPARAR && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Separado</span>
                        {paquete.separado ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <StatusBadge label="Pendiente" variant="pending" />
                        )}
                      </div>
                    )}
                    {paquete.tipoPaquete === TipoPaquete.CADENITA && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Unido en Caja</span>
                        {paquete.unidoEnCaja ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <StatusBadge label="Pendiente" variant="pending" />
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este paquete? Esta acción no se puede deshacer.
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

      {showSepararDialog && (
        <SepararPaqueteDialog
          paqueteId={Number(id)}
          open={showSepararDialog}
          onOpenChange={setShowSepararDialog}
        />
      )}

      {showCambiarEstadoDialog && (
        <CambiarEstadoDialog
          paqueteId={Number(id)}
          estadoActual={paquete.estado}
          open={showCambiarEstadoDialog}
          onOpenChange={setShowCambiarEstadoDialog}
        />
      )}
    </DetailPageLayout>
  )
}
