import { useState, useRef } from 'react'
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
import { Box, FileText, MapPin, Truck, Package, SplitSquareVertical, Sparkles, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { TamanoSaca } from '@/types/saca'
import { formatearTamanoSaca } from '@/utils/ensacado'
import type { Paquete } from '@/types/paquete'
import { CopyActionButton } from '@/components/ui/copy-action-button'

export interface AgenciaOption {
  idAgencia: number
  nombre: string
  canton?: string
  provincia?: string
}

export interface DestinatarioDirectoOption {
  idDestinatarioDirecto: number
  nombreDestinatario?: string | null
  nombreEmpresa?: string | null
  canton?: string
  provincia?: string
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
  bulkDesdePaqueteCodigo: string
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
  onOpenCrearAgencia: () => void
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
  bulkDesdePaqueteCodigo,
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
  onOpenCrearAgencia,
  onConfirm,
  confirmDisabled,
}: CrearDespachoMasivoDialogProps) {
  const [repartirNSacas, setRepartirNSacas] = useState('')
  const [busquedaAgencia, setBusquedaAgencia] = useState('')
  const [busquedaDestinatario, setBusquedaDestinatario] = useState('')
  const dialogContentRef = useRef<HTMLDivElement>(null)
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

  const buildUbicacion = (canton?: string | null, provincia?: string | null) =>
    [canton, provincia]
      .filter((p): p is string => !!p && p.trim().length > 0)
      .join(' • ') || undefined

  const agenciasOpciones: ComboboxOption<AgenciaOption>[] = agencias.map((a) => ({
    value: a.idAgencia,
    label: a.nombre,
    description: buildUbicacion(a.canton, a.provincia),
    data: a,
  }))

  const destinatariosOpciones: ComboboxOption<DestinatarioDirectoOption>[] = (destinatariosDirectos ?? [])
    .filter((d) => d != null && (d.idDestinatarioDirecto != null && d.idDestinatarioDirecto > 0))
    .map((d) => {
      const label = [d.nombreDestinatario, d.nombreEmpresa].filter(Boolean).join(' — ').trim() || `Destinatario #${d.idDestinatarioDirecto}`
      return {
        value: d.idDestinatarioDirecto,
        label,
        description: buildUbicacion(d.canton, d.provincia),
        data: d,
      }
    })

  const handleGenerarPresinto = () => {
    setBulkCodigoPresinto(String(Math.floor(1000000000 + Math.random() * 9000000000)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-5 shrink-0 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <Truck className="h-6 w-6" />
            </div>
            Crear Despacho Masivo
          </DialogTitle>
          <DialogDescription className="text-base mt-1">
            Configura el despacho para los <strong>{packageCount} paquetes</strong> seleccionados.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen operativo */}
        <div className="px-8 py-4 bg-muted/50 border-b border-border shrink-0 flex flex-wrap items-center gap-6 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            <Package className="h-4 w-4 text-muted-foreground" />
            {packageCount} paquetes
          </span>
          <Separator orientation="vertical" className="h-5" />
          <span className="font-mono text-base font-bold text-foreground">{pesoTotalBulk.toFixed(2)} kg</span>
          <Separator orientation="vertical" className="h-5" />
          <span className={cn("text-muted-foreground", destinoResumen && "text-foreground font-semibold")}>
            {destinoResumen || 'Seleccione destino'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
            {/* Card: Destino */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm min-w-0">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Destino
              </h3>
              {sugerenciaDestino && (
                <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-sm text-primary">
                  Sugerencia: La mayoría de paquetes van a <strong>{sugerenciaDestino}</strong>.
                </div>
              )}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Tipo destino</Label>
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
                    <SelectTrigger className="h-11 min-w-0 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGENCIA">Agencia</SelectItem>
                      <SelectItem value="DIRECTO">Destinatario directo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkTipoDestino === 'AGENCIA' && (
                  <div className="grid gap-2 min-w-0">
                    <Label className="text-sm font-medium">Agencia</Label>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-1 min-w-0">
                        <Combobox<AgenciaOption>
                          options={agenciasOpciones}
                          value={bulkIdDestino ? Number(bulkIdDestino) : null}
                          onValueChange={(v) => setBulkIdDestino(v != null ? String(v) : '')}
                          placeholder="Buscar agencia..."
                          searchPlaceholder="Buscar por agencia, cantón o provincia..."
                          emptyMessage="Sin resultados"
                          className="h-10 text-base"
                          onSearchChange={setBusquedaAgencia}
                          searchValue={busquedaAgencia}
                          usePortal
                          portalContainerRef={dialogContentRef}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-md"
                        onClick={onOpenCrearAgencia}
                        title="Crear nueva agencia"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {bulkTipoDestino === 'DIRECTO' && (
                  <>
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Origen del destinatario</Label>
                      <Select
                        value={bulkDestinatarioOrigen}
                        onValueChange={(v) => {
                          setBulkDestinatarioOrigen(v as 'EXISTENTE' | 'DESDE_PAQUETE')
                          setBulkIdDestino('')
                          setBulkIdPaqueteOrigenDestinatario('')
                        }}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXISTENTE">Destinatario existente</SelectItem>
                          <SelectItem value="DESDE_PAQUETE">Desde datos de un paquete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bulkDestinatarioOrigen === 'EXISTENTE' && (
                      <div className="grid gap-2 relative z-[60] min-w-0">
                        <Label className="text-sm font-medium">Destinatario directo</Label>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-1 min-w-0">
                            <Combobox<DestinatarioDirectoOption>
                              options={destinatariosOpciones}
                              value={bulkIdDestino?.trim() ? Number(bulkIdDestino) : null}
                              onValueChange={(v) => setBulkIdDestino(v != null ? String(v) : '')}
                              placeholder="Buscar destinatario directo..."
                              searchPlaceholder="Buscar por destinatario, cantón o provincia..."
                              emptyMessage="Sin destinatarios. Asegúrese de tener destinatarios directos dados de alta."
                              className="h-10 text-base"
                              onSearchChange={setBusquedaDestinatario}
                              searchValue={busquedaDestinatario}
                              usePortal
                              portalContainerRef={dialogContentRef}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 rounded-md"
                            onClick={onOpenCrearDestinatario}
                            title="Crear nuevo destinatario directo"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {bulkDestinatarioOrigen === 'DESDE_PAQUETE' && (
                      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 space-y-4">
                        <Label className="text-sm font-semibold text-primary block">Paquete de referencia</Label>
                        <Combobox
                          options={paquetesRefOpciones}
                          value={bulkIdPaqueteOrigenDestinatario ? Number(bulkIdPaqueteOrigenDestinatario) : null}
                          onValueChange={(v) => setBulkIdPaqueteOrigenDestinatario(v != null ? String(v) : '')}
                          placeholder="Buscar por nombre, teléfono o dirección..."
                          searchPlaceholder="Buscar por teléfono, nombre..."
                          emptyMessage="Sin resultados"
                          className="h-11 text-base"
                          usePortal
                          portalContainerRef={dialogContentRef}
                        />
                        <div className="space-y-4 pt-4 border-t border-primary/20">
                          <p className="text-sm font-medium text-muted-foreground">Datos del destinatario (editable)</p>
                          {bulkDesdePaqueteCodigo && (
                            <div className="grid gap-2">
                              <Label className="text-sm">Código generado</Label>
                              <Input value={bulkDesdePaqueteCodigo} readOnly className="h-11 text-base font-mono" />
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label className="text-sm">Nombre</Label>
                              <Input
                                value={bulkDesdePaqueteNombre}
                                onChange={(e) => setBulkDesdePaqueteNombre(e.target.value)}
                                placeholder="Nombre del destinatario"
                                className="h-11 text-base"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-sm">Teléfono</Label>
                              <Input
                                value={bulkDesdePaqueteTelefono}
                                onChange={(e) => setBulkDesdePaqueteTelefono(e.target.value)}
                                placeholder="Teléfono"
                                className="h-11 text-base"
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm">Dirección</Label>
                            <Input
                              value={bulkDesdePaqueteDireccion}
                              onChange={(e) => setBulkDesdePaqueteDireccion(e.target.value)}
                              placeholder="Dirección"
                              className="h-11 text-base"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm">Cantón</Label>
                            <Input
                              value={bulkDesdePaqueteCanton}
                              onChange={(e) => setBulkDesdePaqueteCanton(e.target.value)}
                              placeholder="Cantón"
                              className="h-11 text-base"
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
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm min-w-0">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Datos del despacho
              </h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Fecha y hora</Label>
                  <DateTimePickerForm
                    value={bulkFechaDespacho}
                    onChange={setBulkFechaDespacho}
                    placeholder="dd/mm/aaaa hh:mm"
                    className="w-full h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Usuario registro</Label>
                  <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-base text-foreground flex items-center gap-2.5 min-h-11">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    {userNombreCompleto ?? '—'}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulk-codigo-presinto" className="text-sm font-medium">Código de presinto de seguridad</Label>
                  <div className="flex flex-wrap gap-3">
                    <Input
                      id="bulk-codigo-presinto"
                      placeholder="Escribir o generar"
                      value={bulkCodigoPresinto}
                      onChange={(e) => setBulkCodigoPresinto(e.target.value)}
                      className="font-mono h-11 flex-1 min-w-[220px] text-base"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 px-4 shrink-0"
                      onClick={handleGenerarPresinto}
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Generar
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulk-observaciones" className="text-sm font-medium">Observaciones</Label>
                  <Textarea
                    id="bulk-observaciones"
                    placeholder="Notas adicionales..."
                    value={bulkObservaciones}
                    onChange={(e) => setBulkObservaciones(e.target.value)}
                    rows={3}
                    className="resize-none text-base min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Distribuidor</Label>
                  <Select value={bulkIdDistribuidor} onValueChange={setBulkIdDistribuidor}>
                    <SelectTrigger className="h-11 min-w-0 text-base">
                      <SelectValue placeholder="Responsable del traslado" />
                    </SelectTrigger>
                    <SelectContent>
                      {distribuidores.map((d) => (
                        <SelectItem key={d.idDistribuidor} value={String(d.idDistribuidor)}>
                          <span className="truncate block max-w-[240px]">{d.nombre}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulk-numero-guia" className="text-sm font-medium">Número de guía (opcional)</Label>
                  <Input
                    id="bulk-numero-guia"
                    placeholder="Ej: GUIA-001"
                    value={bulkNumeroGuia}
                    onChange={(e) => setBulkNumeroGuia(e.target.value)}
                    className="font-mono h-11 text-base"
                  />
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-4 shadow-sm">
                  {codigoDestinoBulk != null && (
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Código destino</span>
                      <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-background/80 px-4 py-3 shadow-sm">
                        <span className="font-mono text-lg font-semibold text-foreground select-all tabular-nums">
                          {codigoDestinoBulk}
                        </span>
                        <CopyActionButton
                          textToCopy={codigoDestinoBulk ?? ''}
                          successMessage="Código copiado"
                          errorMessage="No se pudo copiar el código"
                          title="Copiar código"
                          className="h-9 shrink-0 gap-2"
                        >
                          Copiar
                        </CopyActionButton>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Peso total</span>
                    <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-background/80 px-4 py-3 shadow-sm">
                      <span className="font-mono text-2xl font-bold text-foreground select-all tabular-nums">
                        {pesoTotalBulk.toFixed(2)} kg
                      </span>
                      <CopyActionButton
                        textToCopy={`${pesoTotalBulk.toFixed(2)} kg`}
                        successMessage="Peso copiado"
                        errorMessage="No se pudo copiar el peso"
                        title="Copiar peso"
                        className="h-9 shrink-0 gap-2"
                      >
                        Copiar
                      </CopyActionButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Distribución de Sacas (ancho completo) */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <Box className="h-5 w-5 text-muted-foreground" />
              Distribución de Sacas
            </h3>
            <p className="text-sm text-muted-foreground">
              Indique cuántos paquetes va en cada saca, separado por comas. El total debe ser <strong>{packageCount}</strong>.
            </p>
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="distribution" className="text-sm font-medium">Cantidades por saca</Label>
                  <Input
                    id="distribution"
                    placeholder="Ej: 6, 5, 4"
                    value={sacaDistribution}
                    onChange={(e) => setSacaDistribution(e.target.value)}
                    className={cn(
                      'font-mono text-xl h-14 tracking-wide px-4',
                      !isValidDist
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-emerald-500 focus-visible:ring-emerald-500'
                    )}
                  />
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones rápidas</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={handleTodoEnUnaSaca}
                      className="h-11 gap-2 font-medium px-5"
                    >
                      <Package className="h-5 w-5 text-muted-foreground" />
                      Todo en 1 saca
                    </Button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Repartir en</span>
                      <Input
                        type="number"
                        min={1}
                        max={packageCount}
                        placeholder="N"
                        value={repartirNSacas}
                        onChange={(e) => setRepartirNSacas(e.target.value)}
                        className="w-20 h-11 font-mono text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label="Número de sacas"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">sacas</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={handleRepartirEnNSacas}
                        className="h-11 font-medium gap-2 px-5"
                      >
                        <SplitSquareVertical className="h-5 w-5 text-muted-foreground" />
                        Repartir
                      </Button>
                    </div>
                  </div>
                </div>
                {!isValidDist && totalDist > 0 && (
                  <p className="text-sm text-destructive font-medium">
                    El total debe ser {packageCount}. Actual: {totalDist}.
                  </p>
                )}
                {isValidDist && (
                  <p className="text-sm text-emerald-600 font-semibold">Total correcto.</p>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border-2 border-border bg-muted/30 px-8 py-6 min-w-[120px]">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Total</span>
                <span
                  className={cn(
                    'text-4xl font-bold font-mono mt-1',
                    isValidDist ? 'text-emerald-600' : 'text-destructive'
                  )}
                >
                  {totalDist}
                </span>
              </div>
            </div>

            {sacaDistribution.split(',').filter((n) => parseInt(n.trim(), 10) > 0).length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4 bg-muted/50 p-5 rounded-xl border border-border">
                {sacaDistribution.split(',').map((n, i) => {
                  const count = parseInt(n.trim(), 10) || 0
                  if (count <= 0) return null
                  const tamano = tamanosSacasBulk[i] ?? TamanoSaca.GRANDE
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 bg-background border border-border px-5 py-3.5 rounded-xl shadow-sm min-w-[220px]"
                    >
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                        Saca {i + 1}
                      </span>
                      <Separator orientation="vertical" className="h-6" />
                      <span className="text-base font-mono font-bold text-foreground shrink-0">{count} pqts</span>
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
                        <SelectTrigger className="h-10 w-[140px] text-sm">
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

        <DialogFooter className="sm:justify-between px-8 py-5 border-t border-border shrink-0 bg-muted/30">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-5">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px] h-11 text-base font-medium"
          >
            <Truck className="w-5 h-5 mr-2" />
            Confirmar Despacho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
