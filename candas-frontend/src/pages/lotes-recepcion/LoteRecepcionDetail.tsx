import { useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useLoteRecepcion, usePaquetesLoteRecepcion, useDeleteLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { useAgencias } from '@/hooks/useAgencias'
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Edit,
  Trash2,
  Upload,
  Building2,
  Package2,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ArrowLeft,
  MapPin,
  Package,
  FileDown,
} from 'lucide-react'
import ImportarPaquetesDialog from './ImportarPaquetesDialog'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { generarExcelTrackingSistemaExterno, generarExcelPorTipo, MSG_SIN_PAQUETES_TRACKING, type TipoExportacionTracking, type SubTipoClementinaTracking } from '@/utils/generarExcelLoteRecepcion'
import { TipoPaquete } from '@/types/paquete'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { Property } from '@/components/detail/InfoCard'
import { StatusBadge } from '@/components/detail/StatusBadge'
import { QuickActions } from '@/components/detail/QuickActions'
import { EmptyState, LoadingState } from '@/components/states'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/utils'
import LoteRecepcionOperador from './LoteRecepcionOperador'
import LoteEspecialOperador from './LoteEspecialOperador'
import { useHasPermission } from '@/hooks/useHasRole'

export default function LoteRecepcionDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImportarPaquetes, setShowImportarPaquetes] = useState(false)

  const [showTrackingDialog, setShowTrackingDialog] = useState(false)
  const [trackingDate, setTrackingDate] = useState<Date | null>(new Date())
  const [tipoExportacionTracking, setTipoExportacionTracking] = useState<TipoExportacionTracking>('NORMAL')
  const [subTipoClementinaTracking, setSubTipoClementinaTracking] = useState<SubTipoClementinaTracking>('hijas')

  const { data: loteRecepcion, isLoading } = useLoteRecepcion(id ? Number(id) : undefined)
  const { data: paquetes } = usePaquetesLoteRecepcion(id ? Number(id) : undefined)
  const { data: agenciasData } = useAgencias(0, 1000) // Para el diálogo de exportación Excel
  const deleteMutation = useDeleteLoteRecepcion()

  const canEditLote = useHasPermission(PERMISSIONS.LOTES_RECEPCION.EDITAR)
  const canDeleteLote = useHasPermission(PERMISSIONS.LOTES_RECEPCION.ELIMINAR)

  const secondaryActions = [
    ...(canEditLote ? [{ label: 'Editar', icon: Edit, onClick: () => navigate({ to: `/lotes-recepcion/${id}/edit` }), variant: 'outline' as const }] : []),
    ...(canDeleteLote ? [{ label: 'Eliminar', icon: Trash2, onClick: () => setShowDeleteDialog(true), variant: 'destructive' as const }] : []),
  ]

  // Filtrar paquetes: separar normales y CLEMENTINA hijos
  const { paquetesNormales, paquetesClementinaHijos } = useMemo(() => {
    if (!paquetes || paquetes.length === 0) {
      return { paquetesNormales: [], paquetesClementinaHijos: [] }
    }

    // Paquetes normales: no tienen padre (son paquetes independientes o padres CLEMENTINA)
    const normales = paquetes.filter(p => !p.idPaquetePadre)

    // Paquetes hijos: tienen padre (son hijos de un paquete CLEMENTINA)
    const hijos = paquetes.filter(p => p.idPaquetePadre != null && p.idPaquetePadre !== undefined)

    return {
      paquetesNormales: normales,
      paquetesClementinaHijos: hijos,
    }
  }, [paquetes])

  // Pestañas por tipo de paquete (solo normales, sin hijos)
  const paquetesSeparar = useMemo(() => {
    return (paquetesNormales || []).filter(p => p.tipoPaquete === TipoPaquete.SEPARAR)
  }, [paquetesNormales])

  const paquetesCadenita = useMemo(() => {
    return (paquetesNormales || []).filter(p => p.tipoPaquete === TipoPaquete.CADENITA)
  }, [paquetesNormales])

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/lotes-recepcion' })
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  if (isLoading) {
    return <LoadingState label="Cargando lote..." />
  }

  if (!loteRecepcion) {
    return (
      <EmptyState
        title="Lote de recepción no encontrado"
        action={
          <Button variant="outline" onClick={() => navigate({ to: '/lotes-recepcion' })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
          </Button>
        }
      />
    )
  }

  // Función helper para obtener fecha y hora actual
  const obtenerFechaHoraActual = () => {
    const ahora = new Date()
    const año = ahora.getFullYear()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    return {
      fecha: `${año}-${mes}-${dia}`,
      hora: `${horas}:${minutos}`
    }
  }

  // Abrir diálogo de tracking con fecha/hora actual por defecto
  const abrirDialogTracking = () => {
    setTrackingDate(new Date())
    setTipoExportacionTracking('NORMAL')
    setSubTipoClementinaTracking('hijas')
    setShowTrackingDialog(true)
  }

  // Handler para exportar tracking (desde el diálogo: usa fecha, hora y modo elegidos)
  const handleExportarTracking = () => {
    if (!paquetes || paquetes.length === 0) {
      toast.error('No hay paquetes para exportar')
      return
    }
    if (!trackingDate) {
      toast.error('Indica fecha y hora para el tracking')
      return
    }

    const fechaStr = trackingDate.toISOString().split('T')[0]
    const horaStr = `${String(trackingDate.getHours()).padStart(2, '0')}:${String(trackingDate.getMinutes()).padStart(2, '0')}`

    try {
      const opts = {
        tipoExportacion: tipoExportacionTracking,
        ...(tipoExportacionTracking === 'CLEMENTINA' ? { subTipoClementina: subTipoClementinaTracking } : {}),
      }
      generarExcelTrackingSistemaExterno(paquetes, fechaStr, horaStr, loteRecepcion?.numeroRecepcion, opts)
      let total: number
      if (tipoExportacionTracking === 'NORMAL') {
        total = paquetesNormales.length
      } else if (tipoExportacionTracking === 'CLEMENTINA') {
        const obs = (s: string) => (p: { observaciones?: string }) =>
          (p.observaciones ?? '').toLowerCase().includes(s.toLowerCase())
        if (subTipoClementinaTracking === 'hijas') {
          total = paquetes.filter(p => p.idPaquetePadre != null).length
        } else if (subTipoClementinaTracking === 'padres_separar') {
          total = paquetes.filter(p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre && obs('se separo')(p)).length
        } else if (subTipoClementinaTracking === 'padres_cadenita') {
          total = paquetes.filter(p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre && obs('se hizo caja')(p)).length
        } else {
          total = paquetes.filter(p => p.tipoPaquete === TipoPaquete.CLEMENTINA && !p.idPaquetePadre && (obs('se cambio guía por')(p) || obs('se cambio guia por')(p))).length
        }
      } else {
        total = paquetes.length
      }
      toast.success(`Excel de tracking generado exitosamente con ${total} paquete(s)`)
      setShowTrackingDialog(false)
    } catch (error: any) {
      const msg = error?.message || 'Error al generar el archivo Excel'
      if (msg === MSG_SIN_PAQUETES_TRACKING) {
        toast.warning(msg)
      } else {
        toast.error(msg)
      }
    }
  }

  // Handler para exportar por tipo
  const handleExportarPorTipo = (tipo: TipoPaquete) => {
    if (!paquetes || paquetes.length === 0) {
      toast.error('No hay paquetes para exportar')
      return
    }

    const { fecha, hora } = obtenerFechaHoraActual()
    try {
      generarExcelPorTipo(paquetes, tipo, fecha, hora, loteRecepcion?.numeroRecepcion)
      toast.success(`Excel de tipo ${tipo} generado exitosamente`)
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el archivo Excel')
    }
  }

  // Handler para exportar por destino (opcionalmente filtrado por idAgencia cuando destino es AGENCIA)
  const handleExportarPorDestino = (
    destino: 'AGENCIA' | 'DOMICILIO',
    opts?: { filtroDomicilio?: 'TODOS' | 'CON_DESTINATARIO' | 'SIN_DESTINATARIO'; idAgencia?: number }
  ) => {
    if (!paquetes || paquetes.length === 0) {
      toast.error('No hay paquetes para exportar')
      return
    }

    const { fecha, hora } = obtenerFechaHoraActual()
    const idAgencia = destino === 'AGENCIA' ? opts?.idAgencia : undefined
    const agencias = agenciasData?.content ?? []
    try {
      generarExcelPorTipo(
        paquetes,
        destino as any,
        fecha,
        hora,
        loteRecepcion?.numeroRecepcion,
        idAgencia,
        undefined,
        undefined,
        undefined,
        agencias,
        undefined,
        opts
      )
      const msg = destino === 'AGENCIA' && idAgencia
        ? `Excel de agencia generado exitosamente`
        : `Excel de destino ${destino} generado exitosamente`
      toast.success(msg)
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el archivo Excel')
    }
  }

  return (
    <DetailPageLayout
      title={loteRecepcion.numeroRecepcion || `Lote #${loteRecepcion.idLoteRecepcion}`}
      subtitle={`Lote ${loteRecepcion.idLoteRecepcion}`}
      backUrl="/lotes-recepcion"
      maxWidth="2xl"
      status={{
        label: loteRecepcion.tipoLote === 'ESPECIAL' ? 'Especial' : 'Normal',
        variant: 'active',
      }}
      actions={<QuickActions secondary={secondaryActions} />}
    >
      {/* Cards de datos del lote */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle title="Información del lote" variant="detail" icon={<Package className="h-4 w-4" />} as="h3" />
          <div className="space-y-3">
            <Property label="Número" value={loteRecepcion.numeroRecepcion || `#${loteRecepcion.idLoteRecepcion}`} />
            <Property
              label="Tipo"
              value={
                <StatusBadge
                  label={loteRecepcion.tipoLote === 'ESPECIAL' ? 'Especial' : 'Normal'}
                  variant="active"
                />
              }
            />
            <Property label="Agencia" value={loteRecepcion.nombreAgencia ? `${loteRecepcion.nombreAgencia}${loteRecepcion.cantonAgencia ? ` (${loteRecepcion.cantonAgencia})` : ''}` : undefined} />
            <Property
              label="Fecha recepción"
              value={
                loteRecepcion.fechaRecepcion
                  ? new Date(loteRecepcion.fechaRecepcion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : undefined
              }
            />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
          <SectionTitle title="Registro" variant="detail" icon={<Package2 className="h-4 w-4" />} as="h3" />
          <div className="space-y-3">
            <Property label="Usuario registro" value={loteRecepcion.usuarioRegistro} />
            <Property label="Observaciones" value={loteRecepcion.observaciones || undefined} />
          </div>
        </div>
      </div>

      {/* Toolbar de Acciones: solo para lotes normales; en especiales lo muestra LoteEspecialOperador */}
      {loteRecepcion.tipoLote !== 'ESPECIAL' && (
        <div className="space-y-1.5 mb-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-0.5">Acciones</p>
          <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto text-sm">
            <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.EDITAR}>
              <Button onClick={() => setShowImportarPaquetes(true)} variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Importar
              </Button>
              <div className="w-px h-3.5 bg-border/60 mx-1" />
            </ProtectedByPermission>
            <ProtectedByPermission permission={PERMISSIONS.LOTES_RECEPCION.VER}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Tracking
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel>Exportar Tracking</DropdownMenuLabel>
                  <DropdownMenuItem onClick={abrirDialogTracking}>
                    Elegir fecha, hora y tipo de exportación…
                  </DropdownMenuItem>
                  <p className="px-2 py-1.5 text-[10px] text-muted-foreground">
                    Incluye CLEMENTINA, SEPARAR y CADENITA con observaciones.
                  </p>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={!paquetes?.length} className="h-7 text-muted-foreground hover:text-foreground">
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    Excel
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Exportar por Tipo</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExportarPorTipo(TipoPaquete.CLEMENTINA)}>
                    <Package className="mr-2 h-3.5 w-3.5" /> CLEMENTINA
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportarPorTipo(TipoPaquete.SEPARAR)}>
                    <Package className="mr-2 h-3.5 w-3.5" /> SEPARAR
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportarPorTipo(TipoPaquete.CADENITA)}>
                    <Package className="mr-2 h-3.5 w-3.5" /> CADENITA
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Por Destino</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Building2 className="mr-2 h-3.5 w-3.5" /> AGENCIA
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-[60vh] overflow-y-auto">
                      <DropdownMenuItem onClick={() => handleExportarPorDestino('AGENCIA')}>
                        Todas las agencias
                      </DropdownMenuItem>
                      {(agenciasData?.content ?? []).map((ag) => (
                        <DropdownMenuItem
                          key={ag.idAgencia}
                          onClick={() => handleExportarPorDestino('AGENCIA', { idAgencia: ag.idAgencia })}
                        >
                          {ag.nombre}{ag.ciudad ? ` (${ag.ciudad})` : ''}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={() => handleExportarPorDestino('DOMICILIO', { filtroDomicilio: 'TODOS' })}>
                    <MapPin className="mr-2 h-3.5 w-3.5" /> DOMICILIO (todos)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportarPorDestino('DOMICILIO', { filtroDomicilio: 'CON_DESTINATARIO' })}>
                    <MapPin className="mr-2 h-3.5 w-3.5" /> DOMICILIO (con destinatario)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportarPorDestino('DOMICILIO', { filtroDomicilio: 'SIN_DESTINATARIO' })}>
                    <MapPin className="mr-2 h-3.5 w-3.5" /> DOMICILIO (sin destinatario)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ProtectedByPermission>

            <div className="flex-1" />
          </div>
        </div>
      )}

      <div className="min-h-[560px] flex flex-col w-full">
        {loteRecepcion.tipoLote === 'ESPECIAL' ? (
          <LoteEspecialOperador
            embedded
            onImportar={canEditLote ? () => setShowImportarPaquetes(true) : undefined}
            onEdit={canEditLote ? () => navigate({ to: `/lotes-recepcion/${id}/edit` }) : undefined}
            onDelete={canDeleteLote ? () => setShowDeleteDialog(true) : undefined}
          />
        ) : (
          <LoteRecepcionOperador embedded />
        )}
      </div>

      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] p-0 border-none shadow-2xl flex flex-col">
          <div className="shrink-0 bg-gradient-to-br from-primary/10 via-background to-background p-6 border-b border-border/50">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Exportar Tracking</DialogTitle>
                  <DialogDescription className="text-xs">
                    Configure el reporte para el sistema externo.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 pb-8">
            <div className="space-y-3 mb-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Fecha y Hora de Referencia
              </Label>
              <DateTimePicker
                value={trackingDate}
                onChange={setTrackingDate}
                inline
                className="w-full h-10 shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                ¿Qué desea exportar?
              </Label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoExportacionTracking('NORMAL')}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                    tipoExportacionTracking === 'NORMAL'
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Package className={cn("h-4 w-4 shrink-0", tipoExportacionTracking === 'NORMAL' ? "text-primary" : "text-muted-foreground/70")} />
                  <span className="text-sm font-semibold">Tracking de paquetes normales</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">Normales + padres CLEMENTINA (bodega)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoExportacionTracking('CLEMENTINA')}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                    tipoExportacionTracking === 'CLEMENTINA'
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Package2 className={cn("h-4 w-4 shrink-0", tipoExportacionTracking === 'CLEMENTINA' ? "text-primary" : "text-muted-foreground/70")} />
                  <span className="text-sm font-semibold">Paquetes especiales</span>
                </button>
              </div>
            </div>

            {tipoExportacionTracking === 'CLEMENTINA' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Tipo de paquete especial
                </Label>
                <div className="grid gap-2">
                  {[
                    { id: 'hijas' as const, label: 'Clementinas hijas (LLEGO A CENTRO DE ACOPIO QUITO)' },
                    { id: 'padres_cambio_guia' as const, label: 'Clementina padres (se cambio guía por...)' },
                    { id: 'padres_separar' as const, label: 'Separar' },
                    { id: 'padres_cadenita' as const, label: 'Cadenita' }
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setSubTipoClementinaTracking(op.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 hover:bg-muted/50",
                        subTipoClementinaTracking === op.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                          : "border-border bg-background"
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        subTipoClementinaTracking === op.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {subTipoClementinaTracking === op.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-medium">{op.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 p-6 pt-0 flex gap-3 border-t border-border/50">
            <Button variant="ghost" onClick={() => setShowTrackingDialog(false)} className="flex-1 hover:bg-muted">
              Cancelar
            </Button>
            <Button onClick={handleExportarTracking} className="flex-1 shadow-lg shadow-primary/20">
              Generar Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader className="bg-destructive/5 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-destructive/10">
            <DialogTitle className="text-destructive">Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este lote de recepción? Esta acción no se puede deshacer.
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

      {showImportarPaquetes && id && (
        <ImportarPaquetesDialog
          recepcionId={Number(id)}
          open={showImportarPaquetes}
          onOpenChange={setShowImportarPaquetes}
          onImportSuccess={() => {
            // Refrescar datos
            window.location.reload()
          }}
        />
      )}
    </DetailPageLayout>
  )
}
