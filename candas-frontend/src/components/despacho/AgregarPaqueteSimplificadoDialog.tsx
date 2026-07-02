import { Button } from '@/components/ui/button'
import { CaptureModeToggle, type CaptureMode } from '@/components/scanner/CaptureModeToggle'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { paqueteService } from '@/lib/api/paquete.service'
import { notify } from '@/lib/notify'
import type { Paquete } from '@/types/paquete'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState, useCallback } from 'react'

interface PaqueteTemporal {
  numeroGuia: string
  observaciones?: string
  idPaquete?: number
  creando?: boolean
}

interface AgregarPaqueteSimplificadoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaquetesCreados: (paquetes: Paquete[]) => void
  sacaIndex: number
}

export default function AgregarPaqueteSimplificadoDialog({
  open,
  onOpenChange,
  onPaquetesCreados,
  sacaIndex,
}: AgregarPaqueteSimplificadoDialogProps) {
  const [numeroGuia, setNumeroGuia] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [tabValue, setTabValue] = useState<'individual' | 'lista'>('individual')
  const [modoCaptura, setModoCaptura] = useState<CaptureMode>('LECTOR')
  const [listadoGuias, setListadoGuias] = useState('')
  const [paquetesTemporales, setPaquetesTemporales] = useState<PaqueteTemporal[]>([])
  const [creando, setCreando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus permanente en el input en modo Lector
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (tabValue === 'lista' && textareaRef.current) {
          textareaRef.current.focus()
        } else if (tabValue === 'individual' && modoCaptura === 'LECTOR' && inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }, [open, tabValue, modoCaptura])

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setNumeroGuia('')
      setObservaciones('')
      setListadoGuias('')
      setPaquetesTemporales([])
      setTabValue('individual')
      setModoCaptura('LECTOR')
    }
  }, [open])

  const encolarGuiaTemporal = useCallback(
    (guiaRaw: string, obsText?: string) => {
      const guiaNorm = guiaRaw.trim().toUpperCase()
      if (!guiaNorm) return

      if (paquetesTemporales.some(p => p.numeroGuia === guiaNorm)) {
        notify.warning(`La guía ${guiaNorm} ya está en la lista temporal`)
        return
      }

      const nuevoPaquete: PaqueteTemporal = {
        numeroGuia: guiaNorm,
        observaciones: obsText?.trim() || undefined,
        creando: false,
      }

      setPaquetesTemporales(prev => [...prev, nuevoPaquete])
      notify.success(`Guía ${guiaNorm} agregada a la lista temporal`)
    },
    [paquetesTemporales]
  )

  // 1. Escáner de cámara de celular (Móvil)
  const mobileScanner = useBarcodeScanner({
    onResult: (guia) => {
      if (guia) {
        encolarGuiaTemporal(guia, observaciones)
      }
    },
    cooldownMs: 2000,
    paused: !open || tabValue !== 'individual' || modoCaptura !== 'CAMARA'
  })

  // Controlar ciclo de vida de la cámara
  useEffect(() => {
    if (open && tabValue === 'individual' && modoCaptura === 'CAMARA') {
      void mobileScanner.start()
    } else {
      mobileScanner.stop()
    }
    return () => {
      mobileScanner.stop()
    }
  }, [open, tabValue, modoCaptura])

  const handleAgregar = () => {
    if (!numeroGuia.trim()) {
      notify.error('Debes ingresar un número de guía')
      return
    }
    encolarGuiaTemporal(numeroGuia, observaciones)
    setNumeroGuia('')
    setObservaciones('')
    
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleAgregarMultiples = () => {
    if (!listadoGuias.trim()) {
      notify.error('Debes ingresar al menos un número de guía')
      return
    }

    const rawGuias = listadoGuias
      .split(/[,\n\r]+/)
      .map(g => g.trim().toUpperCase())
      .filter(g => g.length > 0)

    if (rawGuias.length === 0) {
      notify.error('No se encontraron números de guía válidos')
      return
    }

    const guiasUnicas = Array.from(new Set(rawGuias))
    const guiasNuevas = guiasUnicas.filter(
      g => !paquetesTemporales.some(p => p.numeroGuia === g)
    )

    if (guiasNuevas.length === 0) {
      notify.warning('Todos los números de guía ya están en la lista')
      return
    }

    const nuevosPaquetes: PaqueteTemporal[] = guiasNuevas.map(g => ({
      numeroGuia: g,
      observaciones: observaciones.trim() || undefined,
      creando: false,
    }))

    setPaquetesTemporales(prev => [...prev, ...nuevosPaquetes])
    setListadoGuias('')
    setObservaciones('')
    
    notify.success(`${nuevosPaquetes.length} número(s) de guía agregado(s)`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAgregar()
    }
  }

  const handleEliminarPaqueteTemporal = (index: number) => {
    setPaquetesTemporales(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleConfirmarCreacion = async () => {
    if (paquetesTemporales.length === 0) return

    setCreando(true)
    const creadosExito: Paquete[] = []
    const fallados: PaqueteTemporal[] = []

    // Marcar todos como creando en UI
    setPaquetesTemporales(prev => prev.map(p => ({ ...p, creando: true })))

    for (const p of paquetesTemporales) {
      try {
        const paqueteCreado = await paqueteService.createRapido({
          peso: 0,
          descripcion: p.observaciones || 'Paquete rápido',
          nombreDestinatario: p.numeroGuia,
        })
        if (paqueteCreado) {
          creadosExito.push(paqueteCreado)
        }
      } catch (err: any) {
        notify.error(`Fallo al crear la guía ${p.numeroGuia}: ${err?.response?.data?.message || err?.message || 'Error'}`)
        fallados.push({ ...p, creando: false })
      }
    }

    if (creadosExito.length > 0) {
      onPaquetesCreados(creadosExito)
    }

    if (fallados.length === 0) {
      notify.success(`${creadosExito.length} paquete(s) creado(s) y asignado(s) a la saca`)
      onOpenChange(false)
    } else {
      setPaquetesTemporales(fallados)
      notify.warning(`Se crearon ${creadosExito.length} paquetes, pero fallaron ${fallados.length}`)
    }
    setCreando(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!creando) onOpenChange(v) }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Creación Rápida de Paquetes (No Registrados)</DialogTitle>
          <DialogDescription>
            Crea y asocia paquetes de forma ágil que no estaban registrados previamente en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 py-2">
          {/* Panel Izquierdo: Captura */}
          <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
            <Tabs value={tabValue} onValueChange={(val) => setTabValue(val as 'individual' | 'lista')} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="lista">Listado en Bloque</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="flex-1 flex flex-col space-y-4 mt-0">
                <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Modo de Captura</span>
                  <CaptureModeToggle value={modoCaptura} onChange={setModoCaptura} />
                </div>

                {modoCaptura === 'CAMARA' ? (
                  <div className="animate-in fade-in duration-200">
                    <MobileScannerPanel
                      videoRef={mobileScanner.videoRef}
                      permission={mobileScanner.permission}
                      isScanning={mobileScanner.isScanning}
                      paused={creando}
                      error={mobileScanner.error}
                      devices={mobileScanner.devices}
                      selectedDeviceId={mobileScanner.selectedDeviceId}
                      onSelectDevice={mobileScanner.selectDevice}
                      onStart={() => void mobileScanner.start()}
                      onManualSubmit={(g) => encolarGuiaTemporal(g, observaciones)}
                      hasTorch={mobileScanner.hasTorch}
                      torchActive={mobileScanner.torchActive}
                      onToggleTorch={mobileScanner.toggleTorch}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="numeroGuia">Número de Guía</Label>
                      <Input
                        ref={inputRef}
                        id="numeroGuia"
                        placeholder="Escanea o tipea el número de guía..."
                        value={numeroGuia}
                        onChange={(e) => setNumeroGuia(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        disabled={creando}
                        className="font-mono text-2xl h-16 text-center"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                      <Textarea
                        id="observaciones"
                        placeholder="Ingresa observaciones adicionales..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        disabled={creando}
                        rows={2}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleAgregar}
                      disabled={creando || !numeroGuia.trim()}
                      className="w-full font-medium"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar a Lista
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lista" className="flex-1 flex flex-col space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="listadoGuias">Números de Guía (Uno por línea)</Label>
                    <Textarea
                      ref={textareaRef}
                      id="listadoGuias"
                      placeholder={"Pega las guías aquí, una por línea...\nECA7800050583\nECA7800050605"}
                      value={listadoGuias}
                      onChange={(e) => setListadoGuias(e.target.value)}
                      disabled={creando}
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacionesLista">Observaciones comunes (Opcional)</Label>
                    <Input
                      id="observacionesLista"
                      placeholder="Observaciones comunes para estas guías..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      disabled={creando}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAgregarMultiples}
                    disabled={creando || !listadoGuias.trim()}
                    className="w-full font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Procesar Listado
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Panel Derecho: Cola de creación */}
          <div className="w-full md:w-[260px] flex flex-col border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4 overflow-hidden">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 shrink-0">
              Cola de Creación ({paquetesTemporales.length})
            </h4>

            <div className="flex-1 overflow-y-auto border border-border/60 rounded-md bg-muted/10 p-2 space-y-1.5 min-h-[120px]">
              {paquetesTemporales.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8 italic">
                  No hay guías agregadas.
                </div>
              ) : (
                paquetesTemporales.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-card border border-border/40 rounded-lg text-xs shadow-sm">
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-foreground truncate">{p.numeroGuia}</p>
                      {p.observaciones && <p className="text-[10px] text-muted-foreground truncate">{p.observaciones}</p>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleEliminarPaqueteTemporal(idx)}
                      disabled={creando}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 pt-3 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creando}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmarCreacion} disabled={creando || paquetesTemporales.length === 0}>
            {creando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {creando ? 'Creando Paquetes…' : 'Confirmar y Crear Paquetes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
