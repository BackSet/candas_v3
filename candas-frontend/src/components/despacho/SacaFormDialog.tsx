import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useListFilter } from '@/hooks/useListFilter'
import { usePaqueteScanner } from '@/hooks/usePaqueteScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import type { SacaFormData } from '@/hooks/useSacasManager'
import type { Paquete } from '@/types/paquete'
import { Plus, Search, Keyboard, Camera } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { notify } from '@/lib/notify'

interface SacaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sacaIndex: number
  saca: SacaFormData
  sacas: SacaFormData[]
  paquetesDisponibles: Paquete[]
  onPaquetesChange: (sacaIndex: number, paqueteIds: number[]) => void
  onProcesarListado: (sacaIndex: number, numerosGuia: string[]) => void
}

export default function SacaFormDialog({
  open,
  onOpenChange,
  sacaIndex,
  saca,
  sacas,
  paquetesDisponibles,
  onPaquetesChange,
  onProcesarListado,
}: SacaFormDialogProps) {
  const [listadoPaquetes, setListadoPaquetes] = useState('')
  const [modoCaptura, setModoCaptura] = useState<'LECTOR' | 'CAMARA'>('LECTOR')

  const paquetesFiltrados = useListFilter(
    paquetesDisponibles,
    '',
    [
      (p) => p.numeroGuia,
      (p) => p.idPaquete?.toString(),
    ]
  )

  // 1. Tipiadora / Lector clásico de PC
  const pcScanner = usePaqueteScanner(
    paquetesDisponibles,
    (paquete) => {
      const nuevosIds = saca.idPaquetes.includes(paquete.idPaquete!)
        ? saca.idPaquetes
        : [...saca.idPaquetes, paquete.idPaquete!]
      onPaquetesChange(sacaIndex, nuevosIds)
    },
    open && modoCaptura === 'LECTOR'
  )

  // 2. Escáner de cámara de celular (Móvil)
  const handleMobileScan = useCallback(
    (guia: string) => {
      const paquete = paquetesDisponibles.find(
        p => p.numeroGuia?.toUpperCase() === guia.toUpperCase() ||
             p.idPaquete?.toString() === guia
      )
      if (paquete) {
        const nuevosIds = saca.idPaquetes.includes(paquete.idPaquete!)
          ? saca.idPaquetes
          : [...saca.idPaquetes, paquete.idPaquete!]
        onPaquetesChange(sacaIndex, nuevosIds)
        notify.success(`Paquete ${guia} agregado`)
      } else {
        notify.error(`No se encontró el paquete ${guia} en el lote/bodega`)
      }
    },
    [paquetesDisponibles, saca.idPaquetes, onPaquetesChange, sacaIndex]
  )

  const mobileScanner = useBarcodeScanner({
    onResult: handleMobileScan,
    cooldownMs: 2000,
    paused: !open || modoCaptura !== 'CAMARA'
  })

  // Controlar ciclo de vida de la cámara
  useEffect(() => {
    if (open && modoCaptura === 'CAMARA') {
      void mobileScanner.start()
    } else {
      mobileScanner.stop()
    }
    return () => {
      mobileScanner.stop()
    }
  }, [open, modoCaptura])

  const handleProcesarListado = () => {
    if (!listadoPaquetes.trim()) {
      return
    }

    const numerosGuia = listadoPaquetes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (numerosGuia.length === 0) {
      return
    }

    onProcesarListado(sacaIndex, numerosGuia)
    setListadoPaquetes('')
  }

  const handleTogglePaquete = (paqueteId: number, checked: boolean) => {
    if (checked) {
      // Verificar si el paquete ya está en otra saca
      const paqueteEnOtraSaca = sacas.findIndex((s, idx) =>
        idx !== sacaIndex &&
        s.idPaquetes.includes(paqueteId)
      )

      if (paqueteEnOtraSaca !== -1) {
        // Remover de la otra saca y por ahora alertar o actualizar
        const nuevasSacas = [...sacas]
        nuevasSacas[paqueteEnOtraSaca].idPaquetes =
          nuevasSacas[paqueteEnOtraSaca].idPaquetes.filter(id => id !== paqueteId)
      }

      if (!saca.idPaquetes.includes(paqueteId)) {
        onPaquetesChange(sacaIndex, [...saca.idPaquetes, paqueteId])
      }
    } else {
      onPaquetesChange(sacaIndex, saca.idPaquetes.filter(id => id !== paqueteId))
    }
  }

  const handleClose = () => {
    pcScanner.limpiarBusqueda()
    setListadoPaquetes('')
    mobileScanner.stop()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-3">
          <div className="space-y-1">
            <DialogTitle>Seleccionar Paquetes</DialogTitle>
            <DialogDescription>
              Escanea el código de barras o busca por número de guía.
            </DialogDescription>
          </div>

          <SegmentedToggle
            value={modoCaptura}
            onChange={(v) => setModoCaptura(v as 'LECTOR' | 'CAMARA')}
            options={[
              { value: 'LECTOR', label: <span className="flex items-center gap-1.5"><Keyboard className="size-3.5" /> Lector</span> },
              { value: 'CAMARA', label: <span className="flex items-center gap-1.5"><Camera className="size-3.5" /> Cámara</span> },
            ]}
            className="h-8 w-full sm:w-[200px] shrink-0"
          />
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 pt-3">
          {modoCaptura === 'CAMARA' ? (
            <div className="animate-in fade-in duration-200">
              <MobileScannerPanel
                videoRef={mobileScanner.videoRef}
                permission={mobileScanner.permission}
                isScanning={mobileScanner.isScanning}
                paused={!open}
                error={mobileScanner.error}
                devices={mobileScanner.devices}
                selectedDeviceId={mobileScanner.selectedDeviceId}
                onSelectDevice={mobileScanner.selectDevice}
                onStart={() => void mobileScanner.start()}
                onManualSubmit={handleMobileScan}
                hasTorch={mobileScanner.hasTorch}
                torchActive={mobileScanner.torchActive}
                onToggleTorch={mobileScanner.toggleTorch}
              />
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Escanea código o busca por número de guía/ID (Enter para buscar)..."
                  value={pcScanner.busqueda}
                  onChange={(e) => pcScanner.handleBusquedaChange(e.target.value)}
                  onKeyDown={pcScanner.handleBusquedaKeyDown}
                  className="pl-9 text-lg"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Usa un escáner de códigos de barras o escribe el número de guía y presiona Enter
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              O pega un listado de números de guía (uno por línea)
            </label>
            <Textarea
              placeholder={`Pega aquí los números de guía, uno por línea:\nECA7800050583\nECA7800050605\n...`}
              value={listadoPaquetes}
              onChange={(e) => setListadoPaquetes(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              onClick={handleProcesarListado}
              disabled={!listadoPaquetes.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Paquetes del Listado
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto border border-border rounded-md p-4">
            {paquetesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {pcScanner.busqueda
                  ? `No se encontraron paquetes con "${pcScanner.busqueda}"`
                  : 'No se encontraron paquetes disponibles'}
              </div>
            ) : (
              <div className="space-y-2">
                {paquetesFiltrados.map((paquete) => {
                  const estaSeleccionado = saca.idPaquetes.includes(paquete.idPaquete!)
                  const sacaDelPaquete = sacas.findIndex((s, idx) =>
                    idx !== sacaIndex &&
                    s.idPaquetes.includes(paquete.idPaquete!)
                  )
                  const estaEnOtraSaca = sacaDelPaquete !== -1

                  return (
                    <div
                      key={paquete.idPaquete}
                      className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors ${
                        estaEnOtraSaca ? 'bg-warning/10 border border-warning/20' : ''
                      }`}
                    >
                      <Checkbox
                        id={`paquete-${paquete.idPaquete}`}
                        checked={estaSeleccionado}
                        onCheckedChange={(checked) => handleTogglePaquete(paquete.idPaquete!, !!checked)}
                      />
                      <label
                        htmlFor={`paquete-${paquete.idPaquete}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="text-sm font-medium">
                          {paquete.numeroGuia ? (
                            <>
                              <span className="font-mono">{paquete.numeroGuia}</span>
                              <span className="text-muted-foreground ml-2">(ID: {paquete.idPaquete})</span>
                            </>
                          ) : (
                            `Paquete #${paquete.idPaquete}`
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Estado: {paquete.estado} | Tipo: {paquete.tipoPaquete || '-'} | Peso: {paquete.pesoKilos || '-'} kg
                          {estaEnOtraSaca && (
                            <span className="ml-2 text-warning font-medium">
                              (En Saca {sacaDelPaquete + 1})
                            </span>
                          )}
                        </p>
                      </label>
                      {estaSeleccionado && (
                        <span className="text-xs text-primary font-medium">✓ Seleccionado</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {saca.idPaquetes.length > 0 && (
            <div className="text-sm font-medium text-primary">
              {saca.idPaquetes.length} paquete(s) seleccionado(s) para esta saca
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleClose}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
