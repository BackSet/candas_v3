import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Box, FileText, MapPin, Truck, Plus, Copy, Package, SplitSquareVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { TamanoSaca } from '@/types/saca'
import { formatearTamanoSaca } from '@/utils/ensacado'
import type { Paquete } from '@/types/paquete'
import { PERMISSIONS } from '@/types/permissions'

export interface AgenciaOption {
  idAgencia: number
  nombre: string
  canton?: string
}

export interface DestinatarioDirectoOption {
  idDestinatarioDirecto: number
  nombreDestinatario?: string | null
  nombreEmpresa?: string | null
  canton?: string
  activo?: boolean
}

export interface DistribuidorOption {
  idDistribuidor: number
  nombre: string
}

export interface CrearDespachoMasivoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageCount: number
  pesoTotalBulk: number
  codigoDestinoBulk: string | null
  destinoResumen: string
  userNombreCompleto?: string | null
  bulkTipoDestino: 'AGENCIA' | 'DIRECTO'
  setBulkTipoDestino: (v: 'AGENCIA' | 'DIRECTO') => void
  bulkDestinatarioOrigen: 'EXISTENTE' | 'DESDE_PAQUETE'
  setBulkDestinatarioOrigen: (v: 'EXISTENTE' | 'DESDE_PAQUETE') => void
  bulkIdDestino: string
  setBulkIdDestino: (v: string) => void
  bulkIdPaqueteOrigenDestinatario: string
  setBulkIdPaqueteOrigenDestinatario: (v: string) => void
  bulkDesdePaqueteNombre: string
  setBulkDesdePaqueteNombre: (v: string) => void
  bulkDesdePaqueteTelefono: string
  setBulkDesdePaqueteTelefono: (v: string) => void
  bulkDesdePaqueteDireccion: string
  setBulkDesdePaqueteDireccion: (v: string) => void
  bulkDesdePaqueteCanton: string
  setBulkDesdePaqueteCanton: (v: string) => void
  bulkIdDistribuidor: string
  setBulkIdDistribuidor: (v: string) => void
  bulkNumeroGuia: string
  setBulkNumeroGuia: (v: string) => void
  bulkObservaciones: string
  setBulkObservaciones: (v: string) => void
  bulkCodigoPresinto: string
  setBulkCodigoPresinto: (v: string) => void
  bulkFechaDespacho: string
  setBulkFechaDespacho: (v: string) => void
  sacaDistribution: string
  setSacaDistribution: (v: string) => void
  tamanosSacasBulk: TamanoSaca[]
  setTamanosSacasBulk: React.Dispatch<React.SetStateAction<TamanoSaca[]>>
  agencias: AgenciaOption[]
  destinatariosDirectos: DestinatarioDirectoOption[]
  distribuidores: DistribuidorOption[]
  paquetesRefOpciones: ComboboxOption<Paquete>[]
  sugerenciaDestino?: string
  onOpenCrearDestinatario: () => void
  onConfirm: () => void
  confirmDisabled: boolean
}

function computeDistributionTotal(sacaDistribution: string): number {
  return sacaDistribution
    .split(',')
    .reduce((a, b) => a + (parseInt(b.trim(), 10) || 0), 0)
}

/** Reparte total en N sacas con cantidades lo más iguales posible (ej: 77 en 4 → 20,19,19,19) */
function repartirEnNSacas(total: number, n: number): string {
  if (n <= 0 || total <= 0) return ''
  const base = Math.floor(total / n)
  const resto = total % n
  const partes: number[] = []
  for (let i = 0; i < n; i++) {
    partes.push(i < resto ? base + 1 : base)
  }
  return partes.join(', ')
}

export default function CrearDespachoMasivoDialog({
  open,
  onOpenChange,
  packageCount,
  pesoTotalBulk,
  codigoDestinoBulk,
  destinoResumen,
  userNombreCompleto,
  bulkTipoDestino,
  setBulkTipoDestino,
  bulkDestinatarioOrigen,
  setBulkDestinatarioOrigen,
  bulkIdDestino,
  setBulkIdDestino,
  bulkIdPaqueteOrigenDestinatario,
  setBulkIdPaqueteOrigenDestinatario,
  bulkDesdePaqueteNombre,
  setBulkDesdePaqueteNombre,
  bulkDesdePaqueteTelefono,
  setBulkDesdePaqueteTelefono,
  bulkDesdePaqueteDireccion,
  setBulkDesdePaqueteDireccion,
  bulkDesdePaqueteCanton,
  setBulkDesdePaqueteCanton,
  bulkIdDistribuidor,
  setBulkIdDistribuidor,
  bulkNumeroGuia,
  setBulkNumeroGuia,
  bulkObservaciones,
  setBulkObservaciones,
  bulkCodigoPresinto,
  setBulkCodigoPresinto,
  bulkFechaDespacho,
  setBulkFechaDespacho,
  sacaDistribution,
  setSacaDistribution,
  tamanosSacasBulk,
  setTamanosSacasBulk,
  agencias,
  destinatariosDirectos,
  distribuidores,
  paquetesRefOpciones,
  sugerenciaDestino,
  onOpenCrearDestinatario,
  onConfirm,
  confirmDisabled,
}: CrearDespachoMasivoDialogProps) {
  const [repartirNSacas, setRepartirNSacas] = useState('')
  const totalDist = computeDistributionTotal(sacaDistribution)
  const isValidDist = totalDist === packageCount

  const handleTodoEnUnaSaca = () => {
    setSacaDistribution(String(packageCount))
  }

  const handleRepartirEnNSacas = () => {
    const n = parseInt(repartirNSacas.trim(), 10)
    if (!Number.isNaN(n) && n >= 1 && n <= packageCount) {
      setSacaDistribution(repartirEnNSacas(packageCount, n))
      setRepartirNSacas('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-emerald-600" />
            Crear Despacho Masivo
          </DialogTitle>
          <DialogDescription>
            Configura el despacho para los {packageCount} paquetes seleccionados.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen operativo */}
        <div className="px-6 py-3 bg-muted/50 border-b border-border shrink-0 flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-foreground">{packageCount} paquetes</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="font-mono font-semibold text-foreground">{pesoTotalBulk.toFixed(2)} kg</span>
          <Separator orientation="vertical" className="h-4" />
          <span className={cn("text-muted-foreground", destinoResumen && "text-foreground font-medium")}>
            {destinoResumen || 'Seleccione destino'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Destino */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Destino
              </h3>
              {sugerenciaDestino && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5 text-sm text-primary">
                  Sugerencia: La mayoría de paquetes van a <strong>{sugerenciaDestino}</strong>.
                </div>
              )}
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-sm">Tipo destino</Label>
                  <Select
                    value={bulkTipoDestino}
                    onValueChange={(v) => {
                      setBulkTipoDestino(v as 'AGENCIA' | 'DIRECTO')
                      setBulkIdDestino('')
                      if (v === 'AGENCIA') {
                        setBulkDestinatarioOrigen('EXISTENTE')
                        setBulkIdPaqueteOrigenDestinatario('')
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGENCIA">Agencia</SelectItem>
                      <SelectItem value="DIRECTO">Destinatario directo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkTipoDestino === 'AGENCIA' && (
                  <div className="grid gap-1.5">
                    <Label className="text-sm">Agencia</Label>
                    <Select value={bulkIdDestino} onValueChange={setBulkIdDestino}>
                      <SelectTrigger className="h-9 min-w-0">
                        <SelectValue placeholder="Seleccionar agencia..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agencias.map((a) => (
                          <SelectItem key={a.idAgencia} value={String(a.idAgencia)}>
                            <span className="truncate block max-w-[200px]">{a.nombre}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {bulkTipoDestino === 'DIRECTO' && (
                  <>
                    <div className="grid gap-1.5">
                      <Label className="text-sm">Origen del destinatario</Label>
                      <Select
                        value={bulkDestinatarioOrigen}
                        onValueChange={(v) => {
                          setBulkDestinatarioOrigen(v as 'EXISTENTE' | 'DESDE_PAQUETE')
                          setBulkIdDestino('')
                          setBulkIdPaqueteOrigenDestinatario('')
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXISTENTE">Destinatario existente</SelectItem>
                          <SelectItem value="DESDE_PAQUETE">Desde datos de un paquete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bulkDestinatarioOrigen === 'EXISTENTE' && (
                      <div className="grid gap-1.5">
                        <Label className="text-sm">Destinatario directo</Label>
                        <div className="flex items-center gap-0 rounded-md border border-border bg-background overflow-hidden">
                          <div className="flex-1 min-w-0">
                            <Select value={bulkIdDestino} onValueChange={setBulkIdDestino}>
                              <SelectTrigger className="h-9 min-w-0 rounded-none border-0 border-r border-border focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {destinatariosDirectos.map((d) => (
                                  <SelectItem key={d.idDestinatarioDirecto} value={String(d.idDestinatarioDirecto)}>
                                    <span className="truncate block max-w-[220px]">
                                      {d.nombreDestinatario ?? d.nombreEmpresa ?? `#${d.idDestinatarioDirecto}`}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <ProtectedByPermission permission={PERMISSIONS.DESTINATARIOS_DIRECTOS.CREAR}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 rounded-none border-l border-border hover:bg-primary hover:text-primary-foreground"
                              onClick={onOpenCrearDestinatario}
                              title="Crear destinatario directo"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </ProtectedByPermission>
                        </div>
                      </div>
                    )}

                    {bulkDestinatarioOrigen === 'DESDE_PAQUETE' && (
                      <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3 space-y-3">
                        <Label className="text-sm font-medium text-primary block">Paquete de referencia</Label>
                        <Combobox
                          options={paquetesRefOpciones}
                          value={bulkIdPaqueteOrigenDestinatario ? Number(bulkIdPaqueteOrigenDestinatario) : null}
                          onValueChange={(v) => setBulkIdPaqueteOrigenDestinatario(v != null ? String(v) : '')}
                          placeholder="Buscar por nombre, teléfono o dirección..."
                          searchPlaceholder="Buscar por teléfono, nombre..."
                          emptyMessage="Sin resultados"
                          className="h-9 text-sm"
                        />
                        <div className="space-y-3 pt-2 border-t border-primary/20">
                          <p className="text-xs font-medium text-muted-foreground">Datos del destinatario (editable)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="grid gap-1">
                              <Label className="text-xs">Nombre</Label>
                              <Input
                                value={bulkDesdePaqueteNombre}
                                onChange={(e) => setBulkDesdePaqueteNombre(e.target.value)}
                                placeholder="Nombre del destinatario"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs">Teléfono</Label>
                              <Input
                                value={bulkDesdePaqueteTelefono}
                                onChange={(e) => setBulkDesdePaqueteTelefono(e.target.value)}
                                placeholder="Teléfono"
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Dirección</Label>
                            <Input
                              value={bulkDesdePaqueteDireccion}
                              onChange={(e) => setBulkDesdePaqueteDireccion(e.target.value)}
                              placeholder="Dirección"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Cantón</Label>
                            <Input
                              value={bulkDesdePaqueteCanton}
                              onChange={(e) => setBulkDesdePaqueteCanton(e.target.value)}
                              placeholder="Cantón"
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Card: Datos del despacho */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Datos del despacho
              </h3>
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-sm">Fecha y hora</Label>
                  <DateTimePickerForm
                    value={bulkFechaDespacho}
                    onChange={setBulkFechaDespacho}
                    placeholder="dd/mm/aaaa hh:mm"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm">Usuario registro</Label>
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {userNombreCompleto ?? '—'}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bulk-codigo-presinto" className="text-sm">Código de presinto (opcional)</Label>
                  <Input
                    id="bulk-codigo-presinto"
                    placeholder="Ej: PRESINTO-001"
                    value={bulkCodigoPresinto}
                    onChange={(e) => setBulkCodigoPresinto(e.target.value)}
                    className="font-mono h-9"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bulk-observaciones" className="text-sm">Observaciones</Label>
                  <Textarea
                    id="bulk-observaciones"
                    placeholder="Notas adicionales..."
                    value={bulkObservaciones}
                    onChange={(e) => setBulkObservaciones(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm">Distribuidor</Label>
                  <Select value={bulkIdDistribuidor} onValueChange={setBulkIdDistribuidor}>
                    <SelectTrigger className="h-9 min-w-0">
                      <SelectValue placeholder="Responsable del traslado" />
                    </SelectTrigger>
                    <SelectContent>
                      {distribuidores.map((d) => (
                        <SelectItem key={d.idDistribuidor} value={String(d.idDistribuidor)}>
                          <span className="truncate block max-w-[200px]">{d.nombre}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bulk-numero-guia" className="text-sm">Número de guía (opcional)</Label>
                  <Input
                    id="bulk-numero-guia"
                    placeholder="Ej: GUIA-001"
                    value={bulkNumeroGuia}
                    onChange={(e) => setBulkNumeroGuia(e.target.value)}
                    className="font-mono h-9"
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3 shadow-sm">
                  {codigoDestinoBulk != null && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Código destino</span>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 shadow-sm">
                        <span className="font-mono text-base font-semibold text-foreground select-all tabular-nums">
                          {codigoDestinoBulk}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 gap-1.5"
                          onClick={() => {
                            void navigator.clipboard.writeText(codigoDestinoBulk ?? '')
                            toast.success('Código copiado')
                          }}
                          title="Copiar código"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Peso total</span>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 shadow-sm">
                      <span className="font-mono text-xl font-bold text-foreground select-all tabular-nums">
                        {pesoTotalBulk.toFixed(2)} kg
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5"
                        onClick={() => {
                          const texto = `${pesoTotalBulk.toFixed(2)} kg`
                          void navigator.clipboard.writeText(texto)
                          toast.success('Peso copiado')
                        }}
                        title="Copiar peso"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Distribución de Sacas (ancho completo) */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              Distribución de Sacas
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="distribution" className="text-sm font-medium">Cantidades por saca</Label>
                  <Input
                    id="distribution"
                    placeholder="Ej: 6, 5, 4"
                    value={sacaDistribution}
                    onChange={(e) => setSacaDistribution(e.target.value)}
                    className={cn(
                      'font-mono text-lg h-12 tracking-wide',
                      !isValidDist
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-emerald-500 focus-visible:ring-emerald-500'
                    )}
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Acciones rápidas</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTodoEnUnaSaca}
                      className="h-9 gap-1.5 font-medium"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Todo en 1 saca
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Repartir en</span>
                      <Input
                        type="number"
                        min={1}
                        max={packageCount}
                        placeholder="N"
                        value={repartirNSacas}
                        onChange={(e) => setRepartirNSacas(e.target.value)}
                        className="w-16 h-9 font-mono text-center"
                        aria-label="Número de sacas"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">sacas</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRepartirEnNSacas}
                        className="h-9 font-medium gap-1.5"
                      >
                        <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
                        Repartir
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Separa las cantidades por comas. Total debe ser <strong>{packageCount}</strong>.
                </p>
                {!isValidDist && totalDist > 0 && (
                  <p className="text-sm text-destructive font-medium">
                    El total debe ser {packageCount}. Actual: {totalDist}.
                  </p>
                )}
                {isValidDist && (
                  <p className="text-sm text-emerald-600 font-medium">Total correcto.</p>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-end min-w-[80px]">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Total</span>
                <span
                  className={cn(
                    'text-3xl font-bold font-mono',
                    isValidDist ? 'text-emerald-600' : 'text-destructive'
                  )}
                >
                  {totalDist}
                </span>
              </div>
            </div>

            {sacaDistribution.split(',').filter((n) => parseInt(n.trim(), 10) > 0).length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 bg-muted/50 p-4 rounded-lg border border-border">
                {sacaDistribution.split(',').map((n, i) => {
                  const count = parseInt(n.trim(), 10) || 0
                  if (count <= 0) return null
                  const tamano = tamanosSacasBulk[i] ?? TamanoSaca.GRANDE
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-background border border-border px-4 py-2.5 rounded-lg shadow-sm min-w-[200px]"
                    >
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                        Saca {i + 1}
                      </span>
                      <Separator orientation="vertical" className="h-5" />
                      <span className="text-sm font-mono font-bold text-foreground shrink-0">{count} pqts</span>
                      <Select
                        value={tamano}
                        onValueChange={(v) => {
                          setTamanosSacasBulk((prev) => {
                            const next = [...prev]
                            while (next.length <= i) next.push(TamanoSaca.GRANDE)
                            next[i] = v as TamanoSaca
                            return next
                          })
                        }}
                      >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue>{formatearTamanoSaca(tamano)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TamanoSaca.INDIVIDUAL}>{formatearTamanoSaca(TamanoSaca.INDIVIDUAL)}</SelectItem>
                          <SelectItem value={TamanoSaca.PEQUENO}>{formatearTamanoSaca(TamanoSaca.PEQUENO)}</SelectItem>
                          <SelectItem value={TamanoSaca.MEDIANO}>{formatearTamanoSaca(TamanoSaca.MEDIANO)}</SelectItem>
                          <SelectItem value={TamanoSaca.GRANDE}>{formatearTamanoSaca(TamanoSaca.GRANDE)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between px-6 py-4 border-t border-border shrink-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
          >
            <Truck className="w-4 h-4 mr-2" />
            Confirmar Despacho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
