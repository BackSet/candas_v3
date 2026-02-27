import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLoteRecepcion, usePaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileDown, FileSpreadsheet, Loader2, Printer, ScanLine, FileText, Package2, List, Edit } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { imprimirLoteEspecial } from '@/utils/imprimirPdfLoteEspecial'
import {
  filtrarPaquetesPorTipo,
  descargarPDFLoteEspecial,
} from '@/utils/generarPdfLoteEspecial'
import { generarExcelLoteRecepcion } from '@/utils/generarExcelLoteRecepcion'
import { instruccionDeObservaciones } from '@/utils/observacionesDespacho'
import AgregarAtencionDialog from '@/components/lotes-recepcion/AgregarAtencionDialog'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { LoadingState } from '@/components/states'
import { toast } from 'sonner'
import type { Paquete } from '@/types/paquete'

const SIN_ETIQUETA_KEY = '__SIN_ETIQUETA__'
const VARIAS_LISTAS_KEY = 'VARIAS'

/** Parsea "Tipo: GEO, MIA" o "Tipo: GEO, MIA Instrucción: Retener" y devuelve las etiquetas. */
function parsearEtiquetasDeObservaciones(observaciones: string | null | undefined): string[] {
  if (!observaciones?.trim()) return []
  const s = observaciones.trim()
  if (!s.startsWith('Tipo:')) return []
  const parte = s.slice(5).split(' Instrucción:')[0].trim()
  return parte ? parte.split(',').map((e) => e.trim()).filter(Boolean) : []
}

interface LoteEspecialDetailContentProps {
  id: number
  backUrl: string
}

export function LoteEspecialDetailContent({ id, backUrl }: LoteEspecialDetailContentProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: lote, isLoading } = useLoteRecepcion(id)
  const { data: paquetes = [], refetch: refetchPaquetes } = usePaquetesLoteRecepcion(id)

  const { data: etiquetasExistentes = [] } = useQuery({
    queryKey: ['listas-etiquetadas', 'etiquetas'],
    queryFn: () => listasEtiquetadasService.getAllEtiquetas(),
  })

  const [asignarEtiquetaPaquete, setAsignarEtiquetaPaquete] = useState<Paquete | null>(null)
  const [asignarEtiquetaValor, setAsignarEtiquetaValor] = useState('')
  const [showDialogImprimir, setShowDialogImprimir] = useState(false)
  const [tipoImpresion, setTipoImpresion] = useState('TODOS')
  const [imprimiendo, setImprimiendo] = useState(false)
  const [paqueteParaAtencion, setPaqueteParaAtencion] = useState<Paquete | null>(null)
  const [showAgregarAtencionDialog, setShowAgregarAtencionDialog] = useState(false)

  const elegirEtiquetaMutation = useMutation({
    mutationFn: ({ numeroGuia, etiqueta }: { numeroGuia: string; etiqueta: string }) =>
      listasEtiquetadasService.elegirEtiqueta(numeroGuia, etiqueta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', id] })
      setAsignarEtiquetaPaquete(null)
      setAsignarEtiquetaValor('')
      toast.success('Etiqueta asignada')
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, 'Error')
      toast.error(msg)
    },
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

  const paquetesPorEtiqueta = useMemo(() => {
    const map: Record<string, Paquete[]> = {}
    tabsEtiquetas.forEach((tab) => {
      if (tab === SIN_ETIQUETA_KEY) {
        map[tab] = paquetes.filter((p) => !p.ref || p.ref.trim() === '')
      } else if (tab === VARIAS_LISTAS_KEY) {
        map[tab] = paquetes.filter((p) => p.ref === VARIAS_LISTAS_KEY)
      } else {
        map[tab] = paquetes.filter((p) => p.ref === tab)
      }
    })
    return map
  }, [paquetes, tabsEtiquetas])

  const handleAsignarEtiquetaSinEtiqueta = () => {
    if (!asignarEtiquetaPaquete || !asignarEtiquetaValor.trim()) return
    elegirEtiquetaMutation.mutate({
      numeroGuia: asignarEtiquetaPaquete.numeroGuia ?? '',
      etiqueta: asignarEtiquetaValor.trim().toUpperCase(),
    })
  }

  const handleExportPdf = async (tipo: string) => {
    if (!lote) return
    try {
      toast.info('Generando PDF...')
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipo)
      await descargarPDFLoteEspecial(
        filtrados,
        lote.numeroRecepcion ?? String(id),
        tipo || 'TODOS'
      )
      toast.success('PDF descargado exitosamente')
    } catch (err) {
      console.error('Error al generar PDF:', err)
      toast.error(err instanceof Error ? err.message : 'Error al generar el PDF')
    }
  }

  const handleImprimir = async () => {
    if (!lote) return
    setImprimiendo(true)
    try {
      const filtrados = filtrarPaquetesPorTipo(paquetes, tipoImpresion)
      await imprimirLoteEspecial(
        filtrados,
        lote.numeroRecepcion ?? String(id),
        tipoImpresion || 'TODOS'
      )
      setShowDialogImprimir(false)
      toast.success('Ventana de impresión abierta')
    } catch (err) {
      console.error('Error al imprimir:', err)
      toast.error(err instanceof Error ? err.message : 'Error al abrir la impresión')
    } finally {
      setImprimiendo(false)
    }
  }

  const handleExportExcel = () => {
    if (!lote || !paquetes.length) {
      toast.error('No hay paquetes para exportar')
      return
    }
    try {
      const now = new Date()
      const fecha = now.toISOString().slice(0, 10)
      const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      generarExcelLoteRecepcion(
        paquetes,
        fecha,
        hora,
        lote.numeroRecepcion ?? String(id),
        true
      )
      toast.success('Excel exportado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar Excel')
    }
  }

  const datalistIdAsignar = `asignar-etiquetas-list-${id}`

  if (isLoading || !lote) {
    return (
      <DetailPageLayout title="Cargando..." backUrl={backUrl} maxWidth="2xl">
        <LoadingState />
      </DetailPageLayout>
    )
  }

  if (lote.tipoLote !== 'ESPECIAL') {
    navigate(backUrl, { replace: true })
    return null
  }

  return (
    <DetailPageLayout
      title={lote.numeroRecepcion || `Lote #${lote.idLoteRecepcion}`}
      subtitle="Lote especial — Detalle"
      backUrl={backUrl}
      maxWidth="xl"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Barra de acciones — estilo unificado con lote normal */}
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-0.5">Acciones</p>
          <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground hover:text-foreground"
              onClick={() => navigate({ to: `/lotes-recepcion/${id}/tipeo` })}
            >
              <ScanLine className="h-3.5 w-3.5 mr-1.5" />
              Ir a Tipeo
            </Button>
            <div className="w-px h-3.5 bg-border/60 mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Exportar
                  <Download className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span>Excel (Todos)</span>
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => handleExportPdf('TODOS')} className="gap-2">
                  <FileDown className="h-4 w-4 text-red-600" />
                  <span>PDF - Todos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportPdf('SIN_ETIQUETA')}>
                  PDF - Sin Etiqueta
                </DropdownMenuItem>
                {tabsEtiquetas
                  .filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY)
                  .map((etq) => (
                    <DropdownMenuItem key={etq} onClick={() => handleExportPdf(etq)}>
                      PDF - {etq}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px h-3.5 bg-border/60 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowDialogImprimir(true)}
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir
            </Button>
          </div>
        </div>
        {/* Resumen: información del lote + estadísticas en una sola barra */}
        <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {/* Información del lote */}
            <div className="p-4 border-b sm:border-b-0 sm:border-r border-border/40">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5" />
                Información del lote
              </p>
              <p className="font-mono text-base font-semibold text-foreground truncate" title={lote.numeroRecepcion || undefined}>
                {lote.numeroRecepcion || '-'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">Recepción</p>
              <div className="mt-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                  {lote.tipoLote}
                </Badge>
              </div>
            </div>

            {/* Estadísticas por clasificación */}
            <div className="p-4 sm:col-span-2 lg:col-span-2 border-border/40 lg:border-r-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-3">
                <Package2 className="h-3.5 w-3.5" />
                Clasificación de paquetes
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 border border-border/30">
                  <span className="text-xl font-bold tabular-nums text-foreground">{paquetes.length}</span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">Total</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 px-3 py-2 border border-amber-500/20">
                  <span className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                    {paquetesPorEtiqueta[SIN_ETIQUETA_KEY]?.length || 0}
                  </span>
                  <span className="text-[11px] font-medium text-amber-800/80 dark:text-amber-200/80 uppercase">Sin etiqueta</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 px-3 py-2 border border-blue-500/20">
                  <span className="text-xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                    {paquetesPorEtiqueta[VARIAS_LISTAS_KEY]?.length || 0}
                  </span>
                  <span className="text-[11px] font-medium text-blue-800/80 dark:text-blue-200/80 uppercase">En varias</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 border border-border/30">
                  <span className="text-xl font-bold tabular-nums text-foreground">
                    {tabsEtiquetas.filter((t) => t !== SIN_ETIQUETA_KEY && t !== VARIAS_LISTAS_KEY).length}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">Etiquetas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Listado por clasificación — simplificado para el operario */}
        <section className="space-y-4">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2 px-0.5">
            <List className="h-3.5 w-3.5" />
            Paquetes por clasificación
          </h3>

          <div className="border rounded-xl border-border/50 overflow-hidden bg-card">
            {paquetes.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Package2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No hay paquetes en este lote</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {tabsEtiquetas.map((tab) => {
                  const lista = paquetesPorEtiqueta[tab] ?? []
                  if (lista.length === 0) return null
                  const isSinEtiqueta = tab === SIN_ETIQUETA_KEY
                  const isVarias = tab === VARIAS_LISTAS_KEY

                  const tituloGrupo = isSinEtiqueta ? 'Sin etiqueta' : isVarias ? 'En varias listas' : tab
                  const colorGrupo = isSinEtiqueta
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30'
                    : isVarias
                      ? 'bg-blue-500/15 text-blue-800 dark:text-blue-200 border-blue-500/30'
                      : 'bg-primary/10 text-primary border-primary/20'

                  return (
                    <div key={tab} className="animate-in fade-in duration-200 min-w-0">
                      {/* Cabecera del grupo: tipo + cantidad */}
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/20">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${colorGrupo}`}>
                          {tituloGrupo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lista.length} paquete{lista.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="overflow-x-auto min-w-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b border-border/40">
                            <TableHead className="w-[200px] text-[11px] font-semibold text-muted-foreground">Nº Guía</TableHead>
                            <TableHead className="text-[11px] font-semibold text-muted-foreground min-w-[100px]">Tipo</TableHead>
                            <TableHead className="text-[11px] font-semibold text-muted-foreground">Instrucción</TableHead>
                            <TableHead className="w-[100px] text-right text-[11px] font-semibold text-muted-foreground">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lista.map((p) => (
                            <TableRow key={p.idPaquete} className="group hover:bg-muted/20">
                              <TableCell className="font-mono text-sm py-2">
                                {p.numeroGuia ?? '-'}
                              </TableCell>
                              <TableCell className="py-2">
                                {isVarias ? (
                                  <div className="flex flex-wrap gap-1">
                                    {parsearEtiquetasDeObservaciones(p.observaciones).map((etq) => (
                                      <Badge key={etq} variant="outline" className="text-[11px] font-medium">
                                        {etq}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : p.ref ? (
                                  <Badge variant="secondary" className="text-[11px] font-medium">
                                    {p.ref}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-2 max-w-[240px]">
                                {instruccionDeObservaciones(p.observaciones) ? (
                                  <span className="inline-block text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/25">
                                    {instruccionDeObservaciones(p.observaciones)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50 text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-2 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  {(isSinEtiqueta || isVarias) && (
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
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Dialogs remain identical in logic but stylized */}
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
            <Button onClick={handleImprimir} disabled={imprimiendo} className="gap-2">
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
                list={datalistIdAsignar}
                className="h-11 shadow-sm"
              />
              <datalist id={datalistIdAsignar}>
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
              onClick={handleAsignarEtiquetaSinEtiqueta}
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
    </DetailPageLayout>
  )
}
