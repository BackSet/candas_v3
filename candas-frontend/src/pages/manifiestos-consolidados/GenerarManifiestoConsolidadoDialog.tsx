import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePickerForm } from '@/components/ui/date-time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgencias } from '@/hooks/useAgencias'
import { useDistribuidores } from '@/hooks/useDistribuidores'
import { useCreateManifiestoConsolidado } from '@/hooks/useManifiestosConsolidados'
import type { CrearManifiestoConsolidadoDTO } from '@/types/manifiesto-consolidado'
import { FilePlus, Calendar, Globe, Building2, User, CalendarRange, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface GenerarManifiestoConsolidadoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GenerarManifiestoConsolidadoDialog({
  open,
  onOpenChange,
}: GenerarManifiestoConsolidadoDialogProps) {
  const [tipoPeriodo, setTipoPeriodo] = useState<'rango' | 'mes'>('rango')
  const [tipoAgencia, setTipoAgencia] = useState<'especifica' | 'todas'>('especifica')
  const [tipoAgenciaSeleccion, setTipoAgenciaSeleccion] = useState<'agencia' | 'distribuidor'>('agencia')
  const [idAgencia, setIdAgencia] = useState<string>('')
  const [idDistribuidor, setIdDistribuidor] = useState<string>('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [mes, setMes] = useState<string>('')
  const [anio, setAnio] = useState<string>('')

  const { data: agenciasData, isLoading: loadingAgencias } = useAgencias(0, 1000)
  const { data: distribuidoresData, isLoading: loadingDistribuidores } = useDistribuidores(0, 1000)
  const createMutation = useCreateManifiestoConsolidado()

  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  const anios = Array.from({ length: 10 }, (_, i) => {
    const anio = new Date().getFullYear() - i
    return { value: anio.toString(), label: anio.toString() }
  })

  const handleGenerar = async () => {
    if (tipoAgencia === 'especifica') {
      if (tipoAgenciaSeleccion === 'agencia' && !idAgencia) {
        toast.error('Por favor, seleccione una agencia')
        return
      }
      if (tipoAgenciaSeleccion === 'distribuidor' && !idDistribuidor) {
        toast.error('Por favor, seleccione un distribuidor')
        return
      }
    }

    if (tipoPeriodo === 'rango') {
      if (!fechaInicio || !fechaFin) {
        toast.error('Por favor, seleccione ambas fechas')
        return
      }
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        toast.error('La fecha de inicio debe ser anterior a la fecha de fin')
        return
      }
    } else {
      if (!mes || !anio) {
        toast.error('Por favor, seleccione mes y año')
        return
      }
    }

    const dto: CrearManifiestoConsolidadoDTO = {
      idAgencia: tipoAgencia === 'especifica' && tipoAgenciaSeleccion === 'agencia' ? Number(idAgencia) : undefined,
      idDistribuidor: tipoAgencia === 'especifica' && tipoAgenciaSeleccion === 'distribuidor' ? Number(idDistribuidor) : undefined,
      fechaInicio: tipoPeriodo === 'rango' ? fechaInicio : undefined,
      fechaFin: tipoPeriodo === 'rango' ? fechaFin : undefined,
      mes: tipoPeriodo === 'mes' ? parseInt(mes) : undefined,
      anio: tipoPeriodo === 'mes' ? parseInt(anio) : undefined,
    }

    try {
      await createMutation.mutateAsync(dto)
      toast.success('Manifiesto generado correctamente')
      onOpenChange(false)
      setTipoAgencia('especifica')
      setTipoAgenciaSeleccion('agencia')
      setIdAgencia('')
      setIdDistribuidor('')
      setFechaInicio('')
      setFechaFin('')
      setMes('')
      setAnio('')
    } catch {
      // Error manejado en el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 rounded-2xl border-border/50">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/30">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Generar Manifiesto</DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Configure los parámetros para generar el reporte consolidado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Configuración Principal */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Alcance</Label>
              <div className="flex p-1 bg-muted/40 rounded-xl border border-border/30">
                <button
                  type="button"
                  onClick={() => setTipoAgencia('especifica')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200",
                    tipoAgencia === 'especifica'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Específico
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoAgencia('todas')
                    setIdAgencia('')
                    setIdDistribuidor('')
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200",
                    tipoAgencia === 'todas'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Global
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Periodo</Label>
              <div className="flex p-1 bg-muted/40 rounded-xl border border-border/30">
                <button
                  type="button"
                  onClick={() => setTipoPeriodo('rango')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200",
                    tipoPeriodo === 'rango'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  Rango
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPeriodo('mes')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200",
                    tipoPeriodo === 'mes'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Mes
                </button>
              </div>
            </div>
          </div>

          {/* Selección de Entidad (Condicional) */}
          <div className={cn(
            "space-y-4 transition-all duration-300 ease-in-out overflow-hidden",
            tipoAgencia === 'especifica' ? "opacity-100 max-h-[300px]" : "opacity-0 max-h-0 grayscale pointer-events-none"
          )}>
            <div className="p-4 rounded-xl border border-border/30 bg-background/50 backdrop-blur-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tipo de Entidad</Label>
                <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/20">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAgenciaSeleccion('agencia')
                      setIdAgencia('')
                      setIdDistribuidor('')
                    }}
                    className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-md transition-all duration-200",
                      tipoAgenciaSeleccion === 'agencia' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"
                    )}
                  >
                    Agencia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAgenciaSeleccion('distribuidor')
                      setIdAgencia('')
                      setIdDistribuidor('')
                    }}
                    className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-md transition-all duration-200",
                      tipoAgenciaSeleccion === 'distribuidor' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"
                    )}
                  >
                    Distribuidor
                  </button>
                </div>
              </div>

              {tipoAgenciaSeleccion === 'agencia' ? (
                <div className="space-y-2">
                  <Select value={idAgencia} onValueChange={setIdAgencia} disabled={loadingAgencias || tipoAgencia === 'todas'}>
                    <SelectTrigger className="h-10 bg-background rounded-lg border-border/40">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <SelectValue placeholder="Seleccione una agencia..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {agenciasData?.content
                        .filter(a => a.activa !== false)
                        .map((agencia) => (
                          <SelectItem key={agencia.idAgencia} value={agencia.idAgencia!.toString()}>
                            {agencia.nombre} {agencia.canton && <span className="text-muted-foreground text-xs ml-1">({agencia.canton})</span>}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select value={idDistribuidor} onValueChange={setIdDistribuidor} disabled={loadingDistribuidores || tipoAgencia === 'todas'}>
                    <SelectTrigger className="h-10 bg-background rounded-lg border-border/40">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <SelectValue placeholder="Seleccione un distribuidor..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {distribuidoresData?.content
                        .map((distribuidor) => (
                          <SelectItem key={distribuidor.idDistribuidor} value={distribuidor.idDistribuidor!.toString()}>
                            {distribuidor.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Selección de Fechas */}
          <div className="p-4 rounded-xl border border-border/30 bg-background/50 backdrop-blur-sm space-y-4 shadow-sm">
            {tipoPeriodo === 'rango' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desde</Label>
                  <DatePickerForm
                    id="fechaInicio"
                    value={fechaInicio}
                    onChange={setFechaInicio}
                    inline
                    className="bg-background h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hasta</Label>
                  <DatePickerForm
                    id="fechaFin"
                    value={fechaFin}
                    onChange={setFechaFin}
                    inline
                    className="bg-background h-10 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mes</Label>
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger className="bg-background h-10 rounded-lg border-border/40">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Año</Label>
                  <Select value={anio} onValueChange={setAnio}>
                    <SelectTrigger className="bg-background h-10 rounded-lg border-border/40">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {anios.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-border/20 bg-muted/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending} className="h-10 px-6 rounded-lg">
            Cancelar
          </Button>
          <Button onClick={handleGenerar} disabled={createMutation.isPending} className="h-10 px-6 rounded-lg">
            {createMutation.isPending ? (
              <>Generando...</>
            ) : (
              <>
                <FilePlus className="h-4 w-4 mr-2" />
                Generar Manifiesto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
