import { AssignedAgencyNotice } from '@/components/agency/AssignedAgencyNotice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { DatePickerForm, toISODate } from '@/components/ui/date-time-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import type { CrearManifiestoConsolidadoDTO } from '@/types/manifiesto-consolidado'
import {
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FilePlus,
  Globe,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface GenerarManifiestoConsolidadoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TipoPeriodo = 'rango' | 'mes'
type TipoAlcance = 'especifica' | 'todas'
type TipoEntidad = 'agencia' | 'distribuidor'

interface DateRangePreset {
  id: string
  label: string
  description: string
  getRange: () => { fechaInicio: string; fechaFin: string }
}

const MESES = [
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

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(date: Date) {
  const current = startOfLocalDay(date)
  const mondayBasedDay = (current.getDay() + 6) % 7
  return addDays(current, -mondayBasedDay)
}

function toRange(start: Date, end: Date) {
  return {
    fechaInicio: toISODate(start),
    fechaFin: toISODate(end),
  }
}

function getDateRangePresets(): DateRangePreset[] {
  return [
    {
      id: 'hoy',
      label: 'Hoy',
      description: 'Despachos del día actual',
      getRange: () => {
        const today = startOfLocalDay(new Date())
        return toRange(today, today)
      },
    },
    {
      id: 'ayer',
      label: 'Ayer',
      description: 'Corte del día anterior',
      getRange: () => {
        const yesterday = addDays(startOfLocalDay(new Date()), -1)
        return toRange(yesterday, yesterday)
      },
    },
    {
      id: 'ultimos-7',
      label: 'Últimos 7 días',
      description: 'Incluye hoy',
      getRange: () => {
        const today = startOfLocalDay(new Date())
        return toRange(addDays(today, -6), today)
      },
    },
    {
      id: 'esta-semana',
      label: 'Esta semana',
      description: 'Desde lunes hasta hoy',
      getRange: () => {
        const today = startOfLocalDay(new Date())
        return toRange(startOfWeek(today), today)
      },
    },
    {
      id: 'semana-pasada',
      label: 'Semana pasada',
      description: 'Lunes a domingo',
      getRange: () => {
        const previousWeekStart = addDays(startOfWeek(new Date()), -7)
        return toRange(previousWeekStart, addDays(previousWeekStart, 6))
      },
    },
    {
      id: 'este-mes',
      label: 'Este mes',
      description: 'Desde el día 1 hasta hoy',
      getRange: () => {
        const today = startOfLocalDay(new Date())
        return toRange(new Date(today.getFullYear(), today.getMonth(), 1), today)
      },
    },
    {
      id: 'mes-pasado',
      label: 'Mes pasado',
      description: 'Mes completo anterior',
      getRange: () => {
        const today = startOfLocalDay(new Date())
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const end = new Date(today.getFullYear(), today.getMonth(), 0)
        return toRange(start, end)
      },
    },
    {
      id: 'este-anio',
      label: 'Este año',
      description: 'Desde enero hasta hoy',
      getRange: () => {
        const today = startOfLocalDay(new Date())
        return toRange(new Date(today.getFullYear(), 0, 1), today)
      },
    },
  ]
}

function formatDisplayDate(value: string) {
  if (!value) return 'Sin fecha'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export default function GenerarManifiestoConsolidadoDialog({
  open,
  onOpenChange,
}: GenerarManifiestoConsolidadoDialogProps) {
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('rango')
  const [tipoAgencia, setTipoAgencia] = useState<TipoAlcance>('especifica')
  const [tipoAgenciaSeleccion, setTipoAgenciaSeleccion] = useState<TipoEntidad>('agencia')
  const [idAgencia, setIdAgencia] = useState<string>('')
  const [idDistribuidor, setIdDistribuidor] = useState<string>('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [mes, setMes] = useState<string>('')
  const [anio, setAnio] = useState<string>('')
  const [presetActivo, setPresetActivo] = useState<string | null>(null)

  const { data: agenciasData, isLoading: loadingAgencias } = useAgencias({ page: 0, size: 1000 })
  const { data: distribuidoresData, isLoading: loadingDistribuidores } = useDistribuidores({ page: 0, size: 1000 })
  const createMutation = useCreateManifiestoConsolidado()
  const rangosRapidos = useMemo(() => getDateRangePresets(), [])

  const anios = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year.toString(), label: year.toString() }
  })

  const agenciaSeleccionada = useMemo(
    () => agenciasData?.content.find((agencia) => String(agencia.idAgencia) === idAgencia),
    [agenciasData?.content, idAgencia]
  )

  const distribuidorSeleccionado = useMemo(
    () => distribuidoresData?.content.find((distribuidor) => String(distribuidor.idDistribuidor) === idDistribuidor),
    [distribuidoresData?.content, idDistribuidor]
  )

  const periodoResumen = tipoPeriodo === 'rango'
    ? fechaInicio && fechaFin
      ? `${formatDisplayDate(fechaInicio)} - ${formatDisplayDate(fechaFin)}`
      : 'Selecciona un rango'
    : mes && anio
      ? `${MESES.find((item) => item.value === mes)?.label ?? 'Mes'} ${anio}`
      : 'Selecciona mes y año'

  const alcanceResumen = tipoAgencia === 'todas'
    ? 'Todas las agencias'
    : tipoAgenciaSeleccion === 'agencia'
      ? agenciaSeleccionada?.nombre ?? 'Agencia pendiente'
      : distribuidorSeleccionado?.nombre ?? 'Distribuidor pendiente'

  const resetForm = () => {
    setTipoPeriodo('rango')
    setTipoAgencia('especifica')
    setTipoAgenciaSeleccion('agencia')
    setIdAgencia('')
    setIdDistribuidor('')
    setFechaInicio('')
    setFechaFin('')
    setMes('')
    setAnio('')
    setPresetActivo(null)
  }

  const aplicarRangoRapido = (preset: DateRangePreset) => {
    const rango = preset.getRange()
    setTipoPeriodo('rango')
    setFechaInicio(rango.fechaInicio)
    setFechaFin(rango.fechaFin)
    setMes('')
    setAnio('')
    setPresetActivo(preset.id)
  }

  const handleFechaInicioChange = (value: string) => {
    setFechaInicio(value)
    setPresetActivo(null)
  }

  const handleFechaFinChange = (value: string) => {
    setFechaFin(value)
    setPresetActivo(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (!createMutation.isPending) {
      onOpenChange(false)
    }
  }

  const handleGenerar = async () => {
    if (tipoAgencia === 'especifica') {
      if (tipoAgenciaSeleccion === 'agencia' && !idAgencia) {
        notify.error('Por favor, seleccione una agencia')
        return
      }
      if (tipoAgenciaSeleccion === 'distribuidor' && !idDistribuidor) {
        notify.error('Por favor, seleccione un distribuidor')
        return
      }
    }

    if (tipoPeriodo === 'rango') {
      if (!fechaInicio || !fechaFin) {
        notify.error('Por favor, seleccione ambas fechas')
        return
      }
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        notify.error('La fecha de inicio debe ser anterior a la fecha de fin')
        return
      }
    } else if (!mes || !anio) {
      notify.error('Por favor, seleccione mes y año')
      return
    }

    const dto: CrearManifiestoConsolidadoDTO = {
      idAgencia: tipoAgencia === 'especifica' && tipoAgenciaSeleccion === 'agencia' ? Number(idAgencia) : undefined,
      idDistribuidor: tipoAgencia === 'especifica' && tipoAgenciaSeleccion === 'distribuidor' ? Number(idDistribuidor) : undefined,
      fechaInicio: tipoPeriodo === 'rango' ? fechaInicio : undefined,
      fechaFin: tipoPeriodo === 'rango' ? fechaFin : undefined,
      mes: tipoPeriodo === 'mes' ? Number.parseInt(mes, 10) : undefined,
      anio: tipoPeriodo === 'mes' ? Number.parseInt(anio, 10) : undefined,
    }

    try {
      await createMutation.mutateAsync(dto)
      notify.success('Manifiesto generado correctamente')
      onOpenChange(false)
      resetForm()
    } catch {
      // Error manejado en el hook.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden gap-0 rounded-xl border-border/50">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Generar Manifiesto</DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Define el alcance y el periodo para crear el reporte consolidado.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
              disabled={createMutation.isPending}
              className="w-fit gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto p-6 space-y-6">
          <AssignedAgencyNotice />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Alcance
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{alcanceResumen}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" />
                Periodo
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{periodoResumen}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Alcance</Label>
              <div className="flex p-1 bg-muted/40 rounded-xl border border-border/30">
                <button
                  type="button"
                  onClick={() => setTipoAgencia('especifica')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200',
                    tipoAgencia === 'especifica'
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground'
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
                    'flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200',
                    tipoAgencia === 'todas'
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground'
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
                  onClick={() => {
                    setTipoPeriodo('rango')
                    setMes('')
                    setAnio('')
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200',
                    tipoPeriodo === 'rango'
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  Rango
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoPeriodo('mes')
                    setFechaInicio('')
                    setFechaFin('')
                    setPresetActivo(null)
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 px-2 rounded-lg transition-all duration-200',
                    tipoPeriodo === 'mes'
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Mes
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'space-y-4 transition-all duration-300 ease-in-out overflow-hidden',
              tipoAgencia === 'especifica' ? 'opacity-100 max-h-[300px]' : 'opacity-0 max-h-0 grayscale pointer-events-none'
            )}
          >
            <div className="p-4 rounded-xl border border-border/30 bg-background/50 backdrop-blur-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tipo de entidad</Label>
                <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/20">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAgenciaSeleccion('agencia')
                      setIdAgencia('')
                      setIdDistribuidor('')
                    }}
                    className={cn(
                      'text-[10px] font-bold px-3 py-1 rounded-md transition-all duration-200',
                      tipoAgenciaSeleccion === 'agencia'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-background'
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
                      'text-[10px] font-bold px-3 py-1 rounded-md transition-all duration-200',
                      tipoAgenciaSeleccion === 'distribuidor'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-background'
                    )}
                  >
                    Distribuidor
                  </button>
                </div>
              </div>

              {tipoAgenciaSeleccion === 'agencia' ? (
                <Combobox
                  options={(agenciasData?.content ?? [])
                    .filter((a) => a.activa !== false)
                    .map<ComboboxOption>((a) => ({
                      value: a.idAgencia!,
                      label: a.nombre ?? '',
                      description: [a.canton, a.provincia]
                        .filter((p): p is string => !!p && p.trim().length > 0)
                        .join(' - ') || undefined,
                    }))}
                  value={idAgencia ? Number(idAgencia) : null}
                  onValueChange={(value) => setIdAgencia(value == null ? '' : String(value))}
                  placeholder="Seleccione una agencia..."
                  searchPlaceholder="Buscar por agencia, cantón o provincia..."
                  disabled={loadingAgencias || tipoAgencia === 'todas'}
                  triggerClassName="h-10 bg-background rounded-lg border-border/40"
                  clearable
                />
              ) : (
                <Combobox
                  options={(distribuidoresData?.content ?? []).map<ComboboxOption>((d) => ({
                    value: d.idDistribuidor!,
                    label: d.nombre ?? '',
                  }))}
                  value={idDistribuidor ? Number(idDistribuidor) : null}
                  onValueChange={(value) => setIdDistribuidor(value == null ? '' : String(value))}
                  placeholder="Seleccione un distribuidor..."
                  searchPlaceholder="Buscar distribuidor..."
                  disabled={loadingDistribuidores || tipoAgencia === 'todas'}
                  triggerClassName="h-10 bg-background rounded-lg border-border/40"
                  clearable
                />
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/30 bg-background/50 backdrop-blur-sm space-y-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-sm font-medium">Periodo del manifiesto</Label>
                <p className="text-xs text-muted-foreground">
                  Usa acciones rápidas o selecciona las fechas manualmente.
                </p>
              </div>
              {presetActivo ? (
                <Badge variant="info" className="w-fit gap-1">
                  <Sparkles className="h-3 w-3" />
                  {rangosRapidos.find((preset) => preset.id === presetActivo)?.label}
                </Badge>
              ) : null}
            </div>

            {tipoPeriodo === 'rango' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {rangosRapidos.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => aplicarRangoRapido(preset)}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5',
                        presetActivo === preset.id
                          ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                          : 'border-border/40 bg-muted/20 text-foreground'
                      )}
                    >
                      <span className="block text-xs font-bold">{preset.label}</span>
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desde</Label>
                    <DatePickerForm
                      id="fechaInicio"
                      value={fechaInicio}
                      onChange={handleFechaInicioChange}
                      inline
                      className="bg-background h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hasta</Label>
                    <DatePickerForm
                      id="fechaFin"
                      value={fechaFin}
                      onChange={handleFechaFinChange}
                      inline
                      className="bg-background h-10 rounded-lg"
                    />
                  </div>
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
                      {MESES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
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
                      {anios.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Listo para generar</p>
                <p className="text-muted-foreground">
                  Se creará un manifiesto para <span className="font-medium text-foreground">{alcanceResumen}</span> con periodo{' '}
                  <span className="font-medium text-foreground">{periodoResumen}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-border/20 bg-muted/5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
            className="h-10 px-6 rounded-lg"
          >
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
