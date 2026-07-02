import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import { CaptureModeToggle, type CaptureMode } from '@/components/scanner/CaptureModeToggle'
import { LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
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
DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from '@/components/ui/table'
import { Tabs,TabsContent,TabsList,TabsTrigger } from '@/components/ui/tabs'
import { useLoteRecepcion,usePaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useDraftStore } from '@/stores/draftStore'
import type { GuiaListaEtiquetadaConsultaDTO } from '@/types/listas-etiquetadas'
import type { Paquete } from '@/types/paquete'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { generarExcelLoteRecepcion } from '@/utils/generarExcelLoteRecepcion'
import { formatPesoKg } from '@/utils/paqueteDisplay'
import { descargarPDFLoteEspecial,filtrarPaquetesPorTipo } from '@/utils/generarPdfLoteEspecial'
import { imprimirLoteEspecial } from '@/utils/imprimirPdfLoteEspecial'
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useNavigate,useParams } from '@tanstack/react-router'
import { Box,ChevronDown,Download,Edit,FileDown,FileSpreadsheet,List as ListIcon,Loader2,Printer,QrCode,ScanLine,Trash2,Upload,X } from 'lucide-react'
import { Fragment,useEffect,useMemo,useRef,useState } from 'react'
import { SIN_ETIQUETA_KEY,VARIAS_LISTAS_KEY } from './loteEspecialOperadorUtils'

export interface LoteEspecialOperadorProps {
  embedded?: boolean
  onImportar?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

interface LoteEspecialDraftData {
  colaEspecial: Array<{ numeroGuia: string; resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null }>
}

export default function LoteEspecialOperador({ embedded = false, onImportar, onEdit, onDelete }: LoteEspecialOperadorProps) {
  const { id: idParam } = useParams({ strict: false })
  const id = idParam ? Number(idParam) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const { saveDraft, getDraft, clearDraft } = useDraftStore()
  const draftRestored = useRef(false)
  const draftKey = `lote-especial-${id ?? 'unknown'}`

  const { data: lote, isLoading } = useLoteRecepcion(id)
  const { data: paquetes = [] } = usePaquetesLoteRecepcion(id)
  const [activeTab, setActiveTab] = useState<'operacion' | 'lista'>('operacion')
  const [modoCaptura, setModoCaptura] = useState<CaptureMode>('LECTOR')
  const [tipiarGuia, setTipiarGuia] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [lastScannedGuia, setLastScannedGuia] = useState<string | null>(null)
  const [lastConsultaResultado, setLastConsultaResultado] = useState<GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null>(null)
  /** Cola de guías tipiadas: no se marcan receptado hasta "Guardar en el lote". */
  const [colaEspecial, setColaEspecial] = useState<Array<{ numeroGuia: string; resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null }>>([])
  const [guardandoEnLote, setGuardandoEnLote] = useState(false)

  const scanner = useBarcodeScanner({
    onResult: (guia) => {
      if (guia) {
        void handleConsultarGuia(guia)
      }
    },
    cooldownMs: 2200,
    paused: !id || activeTab !== 'operacion' || consultando
  })

  // Controlar ciclo de vida de la cámara
  useEffect(() => {
    if (modoCaptura === 'CAMARA' && activeTab === 'operacion') {
      void scanner.start()
    } else {
      scanner.stop()
    }
    return () => {
      scanner.stop()
    }
  }, [modoCaptura, activeTab])

  // Restaurar borrador al montar
  useEffect(() => {
    if (draftRestored.current || id == null) return
    draftRestored.current = true
    const draft = getDraft(draftKey)
    if (!draft) return
    const d = draft.data as unknown as LoteEspecialDraftData
    if (d.colaEspecial?.length) {
      setColaEspecial(d.colaEspecial)
      notify.info(`Se restauró la cola de tipeo con ${d.colaEspecial.length} guía(s)`, { duration: 4000 })
    }
  }, [id])

  // Auto-guardar borrador cuando el estado cambie
  useEffect(() => {
    if (!draftRestored.current || id == null) return
    const hayDatos = colaEspecial.length > 0
    if (!hayDatos) {
      clearDraft(draftKey)
      return
    }
    const draftData: LoteEspecialDraftData = {
      colaEspecial,
    }
    saveDraft(draftKey, draftData as unknown as Record<string, unknown>)
  }, [id, colaEspecial, saveDraft, clearDraft, draftKey])

  const handleConsultarGuia = async (guiaInput = tipiarGuia) => {
    const n = guiaInput.trim().toUpperCase()
    if (!n || id == null) return
    setConsultando(true)
    setLastConsultaResultado(null)
    setLastScannedGuia(n)
    try {
      const res = await listasEtiquetadasService.consultarGuia(n)
      const resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null = res ?? 'sin_etiqueta'
      setLastConsultaResultado(resultado)
      setColaEspecial((prev) => {
        const yaEnCola = prev.some((x) => x.numeroGuia === n)
        if (yaEnCola) {
          notify.info('Ya en cola')
          return [{ numeroGuia: n, resultado }, ...prev.filter((x) => x.numeroGuia !== n)]
        }
        return [{ numeroGuia: n, resultado }, ...prev]
      })
      notify.success('Añadido a la cola')
    } catch {
      setLastConsultaResultado('sin_etiqueta')
      setColaEspecial((prev) => {
        const yaEnCola = prev.some((x) => x.numeroGuia === n)
        const resultado: GuiaListaEtiquetadaConsultaDTO | 'sin_etiqueta' | null = 'sin_etiqueta'
        if (yaEnCola) {
          notify.info('Ya en cola')
          return [{ numeroGuia: n, resultado }, ...prev.filter((x) => x.numeroGuia !== n)]
        }
        return [{ numeroGuia: n, resultado }, ...prev]
      })
      notify.success('Añadido a la cola (sin etiqueta)')
    } finally {
      setConsultando(false)
      setTipiarGuia('')
      inputRef.current?.focus()
    }
  }

  const guardarEnLote = async () => {
    if (colaEspecial.length === 0 || id == null) return
    setGuardandoEnLote(true)
    const count = colaEspecial.length
    try {
      for (const item of colaEspecial) {
        await listasEtiquetadasService.marcarReceptado(item.numeroGuia, id)
      }
      setColaEspecial([])
      clearDraft(draftKey)
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', id] })
      notify.success(`${count} paquete(s) guardado(s) en el lote`)
      inputRef.current?.focus()
    } catch (err: unknown) {
      notify.error(err, 'Error al guardar')
    } finally {
      setGuardandoEnLote(false)
    }
  }

  const quitarDeCola = (numeroGuia: string) => {
    setColaEspecial((prev) => prev.filter((x) => x.numeroGuia !== numeroGuia))
  }



  const handleOperacionSubmit = async () => {
    const n = tipiarGuia.trim().toUpperCase()
    if (!n || id == null) return
    handleConsultarGuia(n)
  }



  useEffect(() => {
    if (activeTab === 'operacion') {
      inputRef.current?.focus()
    }
  }, [activeTab])

  const [showDialogImprimir, setShowDialogImprimir] = useState(false)
  const [tipoImpresion, setTipoImpresion] = useState('TODOS')
  const [imprimiendo, setImprimiendo] = useState(false)
  const [exportandoExcel, setExportandoExcel] = useState<string | null>(null)
  const [exportandoPdf, setExportandoPdf] = useState<string | null>(null)
  const [asignarEtiquetaPaquete, setAsignarEtiquetaPaquete] = useState<Paquete | null>(null)
  const [asignarEtiquetaValor, setAsignarEtiquetaValor] = useState('')

  const [paqueteParaAtencion, setPaqueteParaAtencion] = useState<Paquete | null>(null)
  const [showAgregarAtencionDialog, setShowAgregarAtencionDialog] = useState(false)

  const { data: etiquetasExistentes = [] } = useQuery({
    queryKey: ['listas-etiquetadas', 'etiquetas'],
    queryFn: () => listasEtiquetadasService.getAllEtiquetas(),
  })

  const tabsEtiquetas = useMemo(() => {
    const refs = new Set<string>()
    paquetes.forEach((p) => {
      const r = p.ref?.trim()
      if (r && r !== VARIAS_LISTAS_KEY) refs.add(r)
    })
    const list = Array.from(refs).sort()
    return [...list, VARIAS_LISTAS_KEY, SIN_ETIQUETA_KEY]
  }, [paquetes])

  const elegirEtiquetaMutation = useMutation({
    mutationFn: ({ numeroGuia, etiqueta }: { numeroGuia: string; etiqueta: string }) =>
      listasEtiquetadasService.elegirEtiqueta(numeroGuia, etiqueta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      setAsignarEtiquetaPaquete(null)
      setAsignarEtiquetaValor('')
      notify.success('Etiqueta asignada')
    },
    onError: (err: unknown) => {
      notify.error(err, 'Error')
    },
  })

  const sortedPaquetes = useMemo(() => {
    const refKey = (p: Paquete) => (p.ref || '').trim().toLowerCase() || '\uFFFF'
    return [...paquetes].sort((a, b) => {
      const cmpRef = refKey(a).localeCompare(refKey(b))
      if (cmpRef !== 0) return cmpRef
      const guiaA = (a.numeroGuia ?? '').toLowerCase()
      const guiaB = (b.numeroGuia ?? '').toLowerCase()
      if (guiaA !== guiaB) return guiaA.localeCompare(guiaB)
      return (a.idPaquete ?? 0) - (b.idPaquete ?? 0)
    })
  }, [paquetes])

  const handleExportExcel = async (tipo: string) => {
    if (!lote || !paquetes.length) {
      notify.error('No hay paquetes para exportar')
      return
    }
    setExportandoExcel(tipo)
    const toastId = notify.start('Generando Excel del lote especial…')
    try {
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo || 'TODOS')
      if (!filtrados.length) {
        notify.dismiss(toastId)
        notify.warning('No hay paquetes para el filtro seleccionado')
        return
      }
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      await generarExcelLoteRecepcion(filtrados, fecha, hora, lote.numeroRecepcion ?? String(id), true)
      const label = tipo === 'TODOS' || !tipo ? 'Todos' : tipo === 'SIN_ETIQUETA' ? 'Sin Etiqueta' : tipo
      notify.finish(toastId, `Excel exportado (${label})`)
    } catch (err) {
      notify.fail(toastId, err, 'No se pudo exportar el Excel')
    } finally {
      setExportandoExcel(null)
    }
  }

  const handleExportPdf = async (tipo: string) => {
    if (!lote) return
    setExportandoPdf(tipo)
    const toastId = notify.start('Generando PDF del lote especial…')
    try {
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo)
      await descargarPDFLoteEspecial(filtrados, lote.numeroRecepcion ?? String(id), tipo || 'TODOS')
      notify.finish(toastId, 'PDF descargado correctamente')
    } catch (err) {
      console.error('Error al generar PDF:', err)
      notify.fail(toastId, err, 'No se pudo generar el PDF')
    } finally {
      setExportandoPdf(null)
    }
  }

  const handleImprimir = async (tipoOverride?: string) => {
    if (!lote) return
    const tipo = tipoOverride ?? tipoImpresion
    setImprimiendo(true)
    const toastId = notify.start('Preparando impresión…')
    try {
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo)
      await imprimirLoteEspecial(filtrados, lote.numeroRecepcion ?? String(id), tipo || 'TODOS')
      setShowDialogImprimir(false)
      notify.finish(toastId, 'Ventana de impresión abierta')
    } catch (err) {
      console.error('Error al imprimir:', err)
      notify.fail(toastId, err, 'No se pudo abrir la impresión')
    } finally {
      setImprimiendo(false)
    }
  }

  const handleAsignarEtiqueta = () => {
    if (!asignarEtiquetaPaquete || !asignarEtiquetaValor.trim()) return
    elegirEtiquetaMutation.mutate({
      numeroGuia: asignarEtiquetaPaquete.numeroGuia ?? '',
      etiqueta: asignarEtiquetaValor.trim().toUpperCase(),
    })
  }

  if (id == null) {
    return null
  }

  if (isLoading || !lote) {
    return <LoadingState label="Cargando lote especial..." />
  }

  if (lote.tipoLote !== 'ESPECIAL') {
    return null
  }

  const showFeedbackTipeo = lastScannedGuia != null && lastConsultaResultado !== null

  return (
    <div className={cn("space-y-4", !embedded && "min-h-screen p-4")}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            Lote especial — {lote.numeroRecepcion || `#${lote.idLoteRecepcion}`}
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/lotes-recepcion' })}>
            Volver
          </Button>
        </div>
      )}

      {/* Toolbar superior: Importar (si embedded), Exportar (Excel + PDF), Imprimir; opcionalmente Editar/Eliminar cuando embedded */}
      <div className="space-y-1.5 mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-0.5">Acciones</p>
        <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto text-sm">
          {embedded && onImportar != null && (
            <>
              <Button variant="ghost" size="sm" onClick={onImportar} className="h-7 text-muted-foreground hover:text-foreground">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Importar
              </Button>
              <div className="w-px h-3.5 bg-border/60 mx-1" />
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground hover:text-foreground"
                disabled={exportandoExcel !== null || exportandoPdf !== null}
              >
                {exportandoExcel || exportandoPdf ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                Exportar
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Exportar</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExportExcel('TODOS')} className="gap-2" disabled={exportandoExcel !== null}>
                {exportandoExcel === 'TODOS' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                )}
                <span>Excel (Todos)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel('SIN_ETIQUETA')} disabled={exportandoExcel !== null}>
                Excel - Sin Etiqueta
              </DropdownMenuItem>
              {tabsEtiquetas
                .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                .map((etq) => (
                  <DropdownMenuItem key={`excel-${etq}`} onClick={() => handleExportExcel(etq)} disabled={exportandoExcel !== null}>
                    Excel - {etq}
                  </DropdownMenuItem>
                ))}
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => handleExportPdf('TODOS')} className="gap-2" disabled={exportandoPdf !== null}>
                {exportandoPdf === 'TODOS' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 text-red-600" />
                )}
                <span>PDF - Todos</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPdf('SIN_ETIQUETA')} disabled={exportandoPdf !== null}>
                PDF - Sin Etiqueta
              </DropdownMenuItem>
              {tabsEtiquetas
                .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                .map((etq) => (
                  <DropdownMenuItem key={`pdf-${etq}`} onClick={() => handleExportPdf(etq)} disabled={exportandoPdf !== null}>
                    PDF - {etq}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground hover:text-foreground"
                disabled={imprimiendo}
              >
                {imprimiendo ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                )}
                Imprimir
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleImprimir('TODOS')} className="gap-2" disabled={imprimiendo}>
                {imprimiendo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5" />
                )}
                Imprimir todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDialogImprimir(true)} className="gap-2" disabled={imprimiendo}>
                <Printer className="h-3.5 w-3.5" />
                Imprimir por etiqueta...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {embedded && (onEdit != null || onDelete != null) && (
            <>
              <div className="flex-1" />
              {onEdit != null && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-muted-foreground hover:text-foreground">
                  <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
                </Button>
              )}
              {onDelete != null && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'operacion' | 'lista')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground">
          <TabsTrigger value="operacion" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ScanLine className="w-4 h-4 mr-2" /> Operación
          </TabsTrigger>
          <TabsTrigger value="lista" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ListIcon className="w-4 h-4 mr-2" />
            Lista ({paquetes.length})
          </TabsTrigger>
        </TabsList>

      <TabsContent value="operacion" className="mt-4">
        <div className={cn('grid grid-cols-12 gap-6', embedded ? 'min-h-[520px]' : 'min-h-[480px]')}>
          {/* Columna izquierda (8): selector modo + input + feedback */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <Card className="border border-border shadow-sm bg-card overflow-hidden shrink-0">
              <div className="p-3 bg-muted/40 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Tipeo Especial ({colaEspecial.length})</span>
                </div>
                <CaptureModeToggle value={modoCaptura} onChange={setModoCaptura} />
              </div>
              <CardContent className="p-5">
                {modoCaptura === 'CAMARA' ? (
                  <div className="animate-in fade-in duration-200">
                    <MobileScannerPanel
                      videoRef={scanner.videoRef}
                      permission={scanner.permission}
                      isScanning={scanner.isScanning}
                      paused={consultando}
                      error={scanner.error}
                      devices={scanner.devices}
                      selectedDeviceId={scanner.selectedDeviceId}
                      onSelectDevice={scanner.selectDevice}
                      onStart={() => void scanner.start()}
                      onManualSubmit={(g) => handleConsultarGuia(g)}
                      hasTorch={scanner.hasTorch}
                      torchActive={scanner.torchActive}
                      onToggleTorch={scanner.toggleTorch}
                    />
                  </div>
                ) : (
                  <div className="relative animate-in fade-in duration-200">
                    <ScanLine className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground/50 animate-pulse" />
                    <Input
                      ref={inputRef}
                      value={tipiarGuia}
                      onChange={(e) => setTipiarGuia(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleOperacionSubmit()}
                      className="h-16 pl-14 pr-28 text-xl sm:h-20 sm:pl-20 sm:text-3xl font-mono tracking-widest uppercase border-2 border-primary/30 focus:border-primary focus:ring-primary/20 bg-background"
                      placeholder="ESCANEAR GUÍA..."
                      autoComplete="off"
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold bg-muted px-2.5 sm:px-3 py-1.5 rounded-md border border-border">
                      <span>AUTO-FOCUS</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Área de feedback */}
            <div className="flex-1 min-h-0">
              {showFeedbackTipeo && lastScannedGuia ? (
                <Card className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in duration-200">
                  <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-primary/80">Resultado — {lastScannedGuia}</span>
                    <span className="shrink-0 text-xs text-muted-foreground font-mono">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <CardContent className="p-8 space-y-6">
                    {lastConsultaResultado === 'sin_etiqueta' ? (
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                        <p className="text-3xl sm:text-4xl font-bold tracking-tight text-muted-foreground italic">Sin etiqueta</p>
                      </div>
                    ) : (lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).variasListas ? (
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">
                        En listas: {((lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).etiquetas ?? []).join(', ')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {((lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).etiquetas ?? []).map((etq) => (
                          <span key={etq} className="inline-flex items-center rounded-xl bg-primary/15 border-2 border-primary/30 px-5 py-3 text-2xl sm:text-3xl font-bold text-primary">
                            {etq}
                          </span>
                        ))}
                      </div>
                    )}
                    {lastConsultaResultado !== 'sin_etiqueta' && (lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).instruccion && (
                      <div className="flex items-start gap-4 rounded-xl border border-warning/40 bg-warning/15 p-5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-warning/25">
                          <span className="text-sm font-bold text-warning">!</span>
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">Instrucción</p>
                          <p className="text-lg font-semibold text-warning-foreground">
                            {(lastConsultaResultado as GuiaListaEtiquetadaConsultaDTO).instruccion}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full min-h-[160px] border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10">
                  <ScanLine className="h-16 w-16 opacity-20" />
                  <span className="text-xl font-medium opacity-60">Listo para escanear</span>
                </div>
              )}
            </div>

            {guardandoEnLote && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Guardando en el lote...</span>
              </div>
            )}
          </div>

          {/* Columna derecha (4): cola de tipeo */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <Card className="border border-border bg-card shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Paquetes en cola</span>
                  <span
                    className={cn(
                      'text-xs font-mono px-1.5 py-0.5 rounded-md font-semibold',
                      colaEspecial.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {colaEspecial.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setColaEspecial([])}
                  disabled={guardandoEnLote || colaEspecial.length === 0}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  Limpiar
                </Button>
              </div>
              <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                {colaEspecial.length > 0 ? (
                  <ul className="divide-y divide-border/50 flex-1 overflow-y-auto min-h-0">
                    {colaEspecial.map((item, idx) => (
                      <li key={item.numeroGuia} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground font-mono w-6 text-right">{colaEspecial.length - idx}</span>
                          <div className="min-w-0">
                            <p className="font-mono font-medium text-foreground truncate">{item.numeroGuia}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.resultado === 'sin_etiqueta' || item.resultado == null
                                ? 'Sin etiqueta'
                                : item.resultado.variasListas
                                  ? `En listas: ${(item.resultado.etiquetas ?? []).join(', ')}`
                                  : (item.resultado.etiquetas ?? []).join(', ')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => quitarDeCola(item.numeroGuia)}
                          disabled={guardandoEnLote}
                          aria-label="Quitar de la cola"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Sin paquetes en cola.</p>
                    <p className="text-xs text-muted-foreground">Escanea guías para añadirlos.</p>
                  </div>
                )}
                <div className="p-4 border-t border-border bg-muted/10 shrink-0">
                  <Button className="w-full" size="sm" onClick={guardarEnLote} disabled={guardandoEnLote || colaEspecial.length === 0}>
                    {guardandoEnLote ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                    Guardar en el lote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="lista" className="mt-4">
        <div className="relative">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs text-muted-foreground font-medium">
            {sortedPaquetes.length} paquetes
          </span>
        </div>
        <Card className="border border-border">
          <CardContent className="p-0">
            {sortedPaquetes.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <ListIcon className="h-10 w-10 mx-auto opacity-50 mb-2" />
                <p>No hay paquetes en esta vista</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="w-[140px]">Guía</TableHead>
                      <TableHead className="min-w-[100px]">Ref / Etiqueta</TableHead>
                      <TableHead className="max-w-[200px]">Observaciones</TableHead>
                      <TableHead className="w-[100px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const getRefLabel = (p: Paquete) => (p.ref || '').trim() || null
                      const colCount = 4
                      return sortedPaquetes.map((p, i) => {
                        const refLabel = getRefLabel(p)
                        const prevRefLabel = i > 0 ? getRefLabel(sortedPaquetes[i - 1]!) : null
                        const showGroupHeader = refLabel !== prevRefLabel
                        return (
                          <Fragment key={p.idPaquete ?? p.numeroGuia ?? i}>
                            {showGroupHeader && (
                              <TableRow>
                                <TableCell colSpan={colCount} className="bg-muted/50 text-xs font-medium text-muted-foreground py-2 px-4">
                                  {refLabel ? `Referencia: ${refLabel}` : 'Sin referencia'}
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className="transition-colors hover:bg-muted/30">
                              <TableCell className="font-mono text-sm">
                                <span className="block">{p.numeroGuia ?? '-'}</span>
                                {formatPesoKg(p) && <span className="text-xs text-muted-foreground tabular-nums">{formatPesoKg(p)}</span>}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                  {p.ref?.trim() || '—'}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={p.observaciones ?? undefined}>
                                {p.observaciones?.trim() || '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  {(!p.ref?.trim() || p.ref === VARIAS_LISTAS_KEY) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        setAsignarEtiquetaPaquete(p)
                                        setAsignarEtiquetaValor('')
                                      }}
                                      title="Asignar etiqueta"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setPaqueteParaAtencion(p)
                                      setShowAgregarAtencionDialog(true)
                                    }}
                                    title="Poner en atención"
                                  >
                                    <ScanLine className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        )
                      })
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </TabsContent>

      <Dialog open={showDialogImprimir} onOpenChange={setShowDialogImprimir}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Imprimir Lote Especial
            </DialogTitle>
            <DialogDescription>
              Selecciona qué sección del lote deseas imprimir en PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sección a imprimir</Label>
              <Select value={tipoImpresion} onValueChange={setTipoImpresion}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los paquetes</SelectItem>
                  <SelectItem value="SIN_ETIQUETA">Sin etiqueta</SelectItem>
                  {tabsEtiquetas
                    .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                    .map((etq) => (
                      <SelectItem key={etq} value={etq}>
                        {etq}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogImprimir(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleImprimir()} disabled={imprimiendo} className="gap-2">
              {imprimiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Imprimir PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!asignarEtiquetaPaquete} onOpenChange={(open) => !open && setAsignarEtiquetaPaquete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Asignar etiqueta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Guía Seleccionada</p>
              <p className="font-mono font-semibold text-primary">{asignarEtiquetaPaquete?.numeroGuia}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva Etiqueta</Label>
              <Input
                placeholder="Ej: MIA, GEO..."
                value={asignarEtiquetaValor}
                onChange={(e) => setAsignarEtiquetaValor(e.target.value)}
                list={`asignar-etiquetas-list-${id}`}
                className="h-11 shadow-sm"
              />
              <datalist id={`asignar-etiquetas-list-${id}`}>
                {etiquetasExistentes.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
              <p className="text-[10px] text-muted-foreground italic">
                Sugerencia: Puedes usar etiquetas existentes o crear una nueva.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsignarEtiquetaPaquete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAsignarEtiqueta}
              disabled={!asignarEtiquetaValor.trim() || elegirEtiquetaMutation.isPending}
              className="gap-2"
            >
              {elegirEtiquetaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Asignar Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showAgregarAtencionDialog && paqueteParaAtencion && (
        <AgregarAtencionDialog
          open={showAgregarAtencionDialog}
          onOpenChange={(open) => {
            setShowAgregarAtencionDialog(open)
            if (!open) setPaqueteParaAtencion(null)
          }}
          paquete={paqueteParaAtencion}
          onSuccess={() => {
            setPaqueteParaAtencion(null)
            queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
          }}
        />
      )}
      </Tabs>
    </div>
  )
}
