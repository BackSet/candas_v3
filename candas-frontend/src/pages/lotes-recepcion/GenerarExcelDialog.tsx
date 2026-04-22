import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { Paquete } from '@/types/paquete'
import { TipoPaquete, TipoDestino } from '@/types/paquete'
import { generarExcelTrackingSistemaExterno, generarExcelPorTipo } from '@/utils/generarExcelLoteRecepcion'
import { FileSpreadsheet, AlertCircle, Download, Package, MapPin, Loader2 } from 'lucide-react'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { notify } from '@/lib/notify'
import type { Agencia } from '@/types/agencia'
import type { DestinatarioDirecto } from '@/types/destinatario-directo'


interface GenerarExcelDialogProps {
  paquetes: Paquete[]
  numeroRecepcion?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  agenciaPorPaquete?: Map<number, number>
  destinatarioPorPaquete?: Map<number, number>
  agencias?: Agencia[]
  destinatarios?: DestinatarioDirecto[]
}

export default function GenerarExcelDialog({
  paquetes,
  numeroRecepcion,
  open,
  onOpenChange,
  agenciaPorPaquete,
  destinatarioPorPaquete,
  agencias,
  destinatarios,
}: GenerarExcelDialogProps) {
  // Obtener fecha y hora actual en formato datetime-local (YYYY-MM-DDTHH:mm)
  const obtenerFechaHoraActual = () => {
    const ahora = new Date()
    const año = ahora.getFullYear()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    return `${año}-${mes}-${dia}T${horas}:${minutos}`
  }

  const [fechaHora, setFechaHora] = useState(obtenerFechaHoraActual())
  const [tipoExportacion, setTipoExportacion] = useState<'tracking-externo' | 'clementina' | 'separar' | 'cadenita' | 'agencia' | 'domicilio'>('tracking-externo')
  const [idAgenciaExportar, setIdAgenciaExportar] = useState<string>('')
  const [idDestinatarioExportar, setIdDestinatarioExportar] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [incluirClementinaHijosTracking, setIncluirClementinaHijosTracking] = useState(true)
  const [filtroDomicilio, setFiltroDomicilio] = useState<'TODOS' | 'CON_DESTINATARIO' | 'SIN_DESTINATARIO'>('TODOS')

  // Inicializar valores por defecto cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setFechaHora(obtenerFechaHoraActual())
      setTipoExportacion('tracking-externo')
      setIdAgenciaExportar('')
      setIdDestinatarioExportar('')
      setIncluirClementinaHijosTracking(true)
      setFiltroDomicilio('TODOS')
    }
  }, [open])

  // Obtener agencias disponibles para el destino AGENCIA
  const agenciasDisponibles = useMemo(() => {
    if (!agencias) return []
    const idsAgencias = new Set<number>()
    paquetes
      .filter(p => p.tipoDestino === TipoDestino.AGENCIA)
      .forEach(p => {
        const idAgencia = p.idPaquete ? agenciaPorPaquete?.get(p.idPaquete) || p.idAgenciaDestino : p.idAgenciaDestino
        if (idAgencia) idsAgencias.add(idAgencia)
      })
    return agencias.filter(a => idsAgencias.has(a.idAgencia!))
  }, [paquetes, agencias, agenciaPorPaquete])

  // Obtener destinatarios disponibles para el destino DOMICILIO
  const destinatariosDisponibles = useMemo(() => {
    if (!destinatarios) return []
    const idsDestinatarios = new Set<number>()
    paquetes
      .filter(p => p.tipoDestino === TipoDestino.DOMICILIO)
      .forEach(p => {
        const idDestinatario = p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined
        if (idDestinatario) idsDestinatarios.add(idDestinatario)
      })
    return destinatarios.filter(d => idsDestinatarios.has(d.idDestinatarioDirecto!))
  }, [paquetes, destinatarios, destinatarioPorPaquete])

  // Calcular paquetes que se exportarán según el tipo seleccionado
  const paquetesAExportar = useMemo(() => {
    let paquetesFiltrados = paquetes.filter((p) => p.numeroGuia && p.numeroGuia.trim() !== '')

    if (tipoExportacion === 'clementina') {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoPaquete === TipoPaquete.CLEMENTINA)
    } else if (tipoExportacion === 'separar') {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoPaquete === TipoPaquete.SEPARAR)
    } else if (tipoExportacion === 'cadenita') {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoPaquete === TipoPaquete.CADENITA)
    } else if (tipoExportacion === 'agencia') {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoDestino === TipoDestino.AGENCIA)
      // Filtrar por agencia específica si se seleccionó
      if (idAgenciaExportar) {
        const idAgencia = Number(idAgenciaExportar)
        paquetesFiltrados = paquetesFiltrados.filter(p => {
          const idAgenciaPaquete = p.idPaquete ? agenciaPorPaquete?.get(p.idPaquete) || p.idAgenciaDestino : p.idAgenciaDestino
          return idAgenciaPaquete === idAgencia
        })
      }
    } else if (tipoExportacion === 'domicilio') {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoDestino === TipoDestino.DOMICILIO)
      // Filtro con/sin destinatario directo
      if (filtroDomicilio !== 'TODOS') {
        const quiereCon = filtroDomicilio === 'CON_DESTINATARIO'
        paquetesFiltrados = paquetesFiltrados.filter(p => {
          const id = p.idDestinatarioDirecto ?? (p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined)
          return quiereCon ? !!id : !id
        })
      }
      // Filtrar por destinatario específico si se seleccionó
      if (idDestinatarioExportar) {
        const idDestinatario = Number(idDestinatarioExportar)
        paquetesFiltrados = paquetesFiltrados.filter(p => {
          const idDestinatarioPaquete = p.idDestinatarioDirecto ?? (p.idPaquete ? destinatarioPorPaquete?.get(p.idPaquete) : undefined)
          return idDestinatarioPaquete === idDestinatario
        })
      }
    }

    return paquetesFiltrados
  }, [paquetes, tipoExportacion, idAgenciaExportar, idDestinatarioExportar, agenciaPorPaquete, destinatarioPorPaquete, filtroDomicilio])

  const handleGenerar = () => {
    // Validar campo
    if (!fechaHora) {
      notify.error('Por favor, completa la fecha y la hora')
      return
    }

    // Extraer fecha y hora del valor datetime-local
    const [fecha, hora] = fechaHora.split('T')
    if (!fecha || !hora) {
      notify.error('Por favor, completa la fecha y la hora correctamente')
      return
    }

    // Verificar que haya paquetes con número de guía
    if (paquetesAExportar.length === 0) {
      notify.error('No hay paquetes con número de guía para generar el Excel con los filtros seleccionados')
      return
    }

    setIsGenerating(true)
    const toastId = notify.start('Generando Excel...')

    try {
      if (tipoExportacion === 'tracking-externo') {
        generarExcelTrackingSistemaExterno(paquetesAExportar, fecha, hora, numeroRecepcion, {
          incluirClementinaHijos: incluirClementinaHijosTracking,
        })
        const total = incluirClementinaHijosTracking
          ? paquetesAExportar.length
          : paquetesAExportar.filter(p => !p.idPaquetePadre).length
        notify.finish(toastId, `Excel generado con ${total} paquete(s)`)
      } else if (tipoExportacion === 'clementina' || tipoExportacion === 'separar' || tipoExportacion === 'cadenita') {
        generarExcelPorTipo(
          paquetes,
          tipoExportacion.toUpperCase() as TipoPaquete,
          fecha,
          hora,
          numeroRecepcion,
          undefined,
          undefined,
          agenciaPorPaquete,
          destinatarioPorPaquete,
          agencias,
          destinatarios
        )
        notify.finish(toastId, `Excel generado con ${paquetesAExportar.length} paquete(s)`)
      } else if (tipoExportacion === 'agencia') {
        const idAgencia = idAgenciaExportar ? Number(idAgenciaExportar) : undefined
        generarExcelPorTipo(
          paquetes,
          'AGENCIA' as any,
          fecha,
          hora,
          numeroRecepcion,
          idAgencia,
          undefined,
          agenciaPorPaquete,
          destinatarioPorPaquete,
          agencias,
          destinatarios
        )
        notify.finish(toastId, `Excel generado con ${paquetesAExportar.length} paquete(s)`)
      } else if (tipoExportacion === 'domicilio') {
        const idDestinatario = idDestinatarioExportar ? Number(idDestinatarioExportar) : undefined
        generarExcelPorTipo(
          paquetes,
          'DOMICILIO' as any,
          fecha,
          hora,
          numeroRecepcion,
          undefined,
          idDestinatario,
          agenciaPorPaquete,
          destinatarioPorPaquete,
          agencias,
          destinatarios,
          { filtroDomicilio }
        )
        notify.finish(toastId, `Excel generado con ${paquetesAExportar.length} paquete(s)`)
      }
      onOpenChange(false)
    } catch (error: any) {
      notify.fail(toastId, error.message || 'Error al generar el archivo Excel')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/80 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Generar Excel
          </DialogTitle>
          <DialogDescription>
            Configura los parámetros para exportar el reporte de paquetes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {paquetesAExportar.length === 0 && paquetes.filter((p) => p.numeroGuia && p.numeroGuia.trim() !== '').length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-warning">Sin paquetes válidos</p>
                <p className="text-sm text-warning/80">
                  No hay paquetes con número de guía en este lote.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label htmlFor="tipo-exportacion" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" /> Tipo de Exportación
                </label>
                <Select
                  value={tipoExportacion}
                  onValueChange={(value: any) => {
                    setTipoExportacion(value)
                    setIdAgenciaExportar('')
                    setIdDestinatarioExportar('')
                  }}
                >
                  <SelectTrigger id="tipo-exportacion" className="h-11 bg-muted/40 border-muted-foreground/20 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tracking-externo">Tracking Sistema Externo</SelectItem>
                    <SelectItem value="clementina">Por Tipo: CLEMENTINA</SelectItem>
                    <SelectItem value="separar">Por Tipo: SEPARAR</SelectItem>
                    <SelectItem value="cadenita">Por Tipo: CADENITA</SelectItem>
                    <SelectItem value="agencia">Por Destino: AGENCIA</SelectItem>
                    <SelectItem value="domicilio">Por Destino: DOMICILIO</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground ml-1">
                  {tipoExportacion === 'tracking-externo' && 'Formato: FECHA, HORA, HAWB, ESTADO, etc.'}
                  {(tipoExportacion === 'clementina' || tipoExportacion === 'separar' || tipoExportacion === 'cadenita') && 'Listado de paquetes filtrados por tipo.'}
                  {tipoExportacion === 'agencia' && 'Listado de paquetes entregados en agencia.'}
                  {tipoExportacion === 'domicilio' && 'Listado de paquetes entregados a domicilio.'}
                </p>
              </div>

              {tipoExportacion === 'domicilio' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label htmlFor="filtro-domicilio" className="text-sm font-medium">Filtro domicilio</label>
                  <Select
                    value={filtroDomicilio}
                    onValueChange={(value: any) => setFiltroDomicilio(value)}
                  >
                    <SelectTrigger id="filtro-domicilio" className="bg-muted/40">
                      <SelectValue placeholder="Selecciona un filtro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="CON_DESTINATARIO">Con destinatario directo</SelectItem>
                      <SelectItem value="SIN_DESTINATARIO">Sin destinatario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tipoExportacion === 'tracking-externo' && (
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <Checkbox
                    id="incluir-clementina-hijos-tracking"
                    checked={incluirClementinaHijosTracking}
                    onCheckedChange={(v) => setIncluirClementinaHijosTracking(Boolean(v))}
                    className="mt-0.5"
                  />
                  <label htmlFor="incluir-clementina-hijos-tracking" className="text-sm leading-snug cursor-pointer">
                    Incluir <span className="font-semibold">CLEMENTINA hijas</span> en el tracking
                    <div className="text-[11px] text-muted-foreground">
                      Si lo desactivas, se exportan solo paquetes sin padre.
                    </div>
                  </label>
                </div>
              )}

              {tipoExportacion === 'agencia' && agenciasDisponibles.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label htmlFor="agencia" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Agencia
                  </label>
                  <Combobox
                    id="agencia"
                    options={agenciasDisponibles.map<ComboboxOption>((a) => ({
                      value: a.idAgencia!,
                      label: a.nombre ?? '',
                      description: [a.canton, a.provincia]
                        .filter((p): p is string => !!p && p.trim().length > 0)
                        .join(' • ') || undefined,
                    }))}
                    value={idAgenciaExportar ? Number(idAgenciaExportar) : null}
                    onValueChange={(v) => setIdAgenciaExportar(v == null ? '' : String(v))}
                    placeholder="Todas las agencias"
                    searchPlaceholder="Buscar por agencia, cantón o provincia..."
                    triggerClassName="bg-muted/40"
                    clearable
                  />
                </div>
              )}

              {tipoExportacion === 'domicilio' && destinatariosDisponibles.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label htmlFor="destinatario" className="text-sm font-medium">Destinatario Directo</label>
                  <Combobox
                    id="destinatario"
                    options={destinatariosDisponibles.map<ComboboxOption>((d) => ({
                      value: d.idDestinatarioDirecto!,
                      label: d.nombreDestinatario ?? '',
                      description: [d.canton, d.provincia]
                        .filter((p): p is string => !!p && p.trim().length > 0)
                        .join(' • ') || undefined,
                    }))}
                    value={idDestinatarioExportar ? Number(idDestinatarioExportar) : null}
                    onValueChange={(v) => setIdDestinatarioExportar(v == null ? '' : String(v))}
                    placeholder="Todos los destinatarios"
                    searchPlaceholder="Buscar por destinatario, cantón o provincia..."
                    triggerClassName="bg-muted/40"
                    clearable
                  />
                </div>
              )}

              <div className="space-y-3">
                <label htmlFor="fechaHora" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  Fecha y Hora
                </label>
                <DateTimePickerForm
                  id="fechaHora"
                  value={fechaHora}
                  onChange={setFechaHora}
                  inline
                  className="h-11"
                />
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Listo para generar</p>
                  <p className="text-xs text-muted-foreground">
                    Se exportarán <span className="font-semibold text-foreground">{paquetesAExportar.length}</span> paquetes.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerar}
            disabled={isGenerating || paquetesAExportar.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Generar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
