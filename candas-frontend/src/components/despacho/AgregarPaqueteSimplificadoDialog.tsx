import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { paqueteService } from '@/lib/api/paquete.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { PaqueteSimplificado } from '@/types/paquete'
import type { Paquete } from '@/types/paquete'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, X } from 'lucide-react'

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
  const [listadoGuias, setListadoGuias] = useState('')
  const [paquetesTemporales, setPaquetesTemporales] = useState<PaqueteTemporal[]>([])
  const [creando, setCreando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus permanente en el input
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (tabValue === 'lista' && textareaRef.current) {
          textareaRef.current.focus()
        } else if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }, [open, tabValue])

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setNumeroGuia('')
      setObservaciones('')
      setListadoGuias('')
      setPaquetesTemporales([])
      setTabValue('individual')
    }
  }, [open])

  const handleAgregar = async () => {
    if (!numeroGuia.trim()) {
      toast.error('Debes ingresar un número de guía')
      return
    }

    const numeroGuiaNormalizado = numeroGuia.trim().toUpperCase()

    // Verificar si ya está en la lista temporal
    if (paquetesTemporales.some(p => p.numeroGuia === numeroGuiaNormalizado)) {
      toast.warning('Este número de guía ya está en la lista')
      return
    }

    // Agregar a la lista temporal
    const nuevoPaquete: PaqueteTemporal = {
      numeroGuia: numeroGuiaNormalizado,
      observaciones: observaciones.trim() || undefined,
      creando: false,
    }

    setPaquetesTemporales(prev => [...prev, nuevoPaquete])
    setNumeroGuia('')
    setObservaciones('')
    
    // Volver a enfocar
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleAgregarMultiples = async () => {
    if (!listadoGuias.trim()) {
      toast.error('Debes ingresar al menos un número de guía')
      return
    }

    // Parsear números de guía (pueden estar separados por comas, espacios o líneas)
    const rawGuias = listadoGuias
      .split(/[,\n\r]+/)
      .map(g => g.trim().toUpperCase())
      .filter(g => g.length > 0)

    if (rawGuias.length === 0) {
      toast.error('No se encontraron números de guía válidos')
      return
    }

    // Eliminar duplicados
    const guiasUnicas = Array.from(new Set(rawGuias))

    // Filtrar los que ya están en la lista temporal
    const guiasNuevas = guiasUnicas.filter(
      g => !paquetesTemporales.some(p => p.numeroGuia === g)
    )

    if (guiasNuevas.length === 0) {
      toast.warning('Todos los números de guía ya están en la lista')
      return
    }

    // Agregar a la lista temporal
    const nuevosPaquetes: PaqueteTemporal[] = guiasNuevas.map(g => ({
      numeroGuia: g,
      observaciones: observaciones.trim() || undefined,
      creando: false,
    }))

    setPaquetesTemporales(prev => [...prev, ...nuevosPaquetes])
    setListadoGuias('')
    setObservaciones('')
    
    toast.success(`${nuevosPaquetes.length} número(s) de guía agregado(s)`)
  }

  const handleEliminarTemporal = (index: number) => {
    setPaquetesTemporales(prev => prev.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    if (paquetesTemporales.length === 0) {
      toast.error('No hay paquetes para crear')
      return
    }

    setCreando(true)

    try {
      // Crear DTOs
      const dtos: PaqueteSimplificado[] = paquetesTemporales.map(p => ({
        numeroGuia: p.numeroGuia,
        observaciones: p.observaciones,
      }))

      // Crear paquetes en el backend
      const paquetesCreados = await paqueteService.createSimplificadoBatch(dtos)

      toast.success(`${paquetesCreados.length} paquete(s) creado(s) exitosamente`)
      
      // Notificar al componente padre
      onPaquetesCreados(paquetesCreados)
      
      // Cerrar el diálogo
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al crear los paquetes'))
    } finally {
      setCreando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tabValue !== 'lista') {
      e.preventDefault()
      handleAgregar()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar Paquetes Simplificados</DialogTitle>
          <DialogDescription>
            Ingresa números de guía y observaciones. Los paquetes se crearán con datos mínimos y se agregarán a la saca.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col py-2">
          <Tabs value={tabValue} onValueChange={(v) => setTabValue(v as 'individual' | 'lista')} className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="individual">Individual / Escáner</TabsTrigger>
              <TabsTrigger value="lista">Lista / Masivo</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="flex-1 flex flex-col space-y-4 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numeroGuia">Número de Guía</Label>
                <Input
                  ref={inputRef}
                  id="numeroGuia"
                  placeholder="Escanea o tipea el número de guía y presiona Enter..."
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
                  rows={3}
                />
              </div>

              <Button
                type="button"
                onClick={handleAgregar}
                disabled={creando || !numeroGuia.trim()}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar a Lista
              </Button>
            </div>
            </TabsContent>

            <TabsContent value="lista" className="flex-1 flex flex-col space-y-4 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="listadoGuias">Números de Guía (Separados por comas, espacios o líneas)</Label>
                <Textarea
                  ref={textareaRef}
                  id="listadoGuias"
                  placeholder="Pega aquí los números de guía, separados por comas, espacios o líneas..."
                  value={listadoGuias}
                  onChange={(e) => setListadoGuias(e.target.value.toUpperCase())}
                  disabled={creando}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {Array.from(new Set(listadoGuias.split(/[,\n\r]+/).map(g => g.trim().toUpperCase()).filter(g => g.length > 0))).length} número(s) de guía único(s) detectado(s)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacionesMultiple">Observaciones (Opcional - Se aplicará a todos)</Label>
                <Textarea
                  id="observacionesMultiple"
                  placeholder="Ingresa observaciones que se aplicarán a todos los paquetes..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  disabled={creando}
                  rows={3}
                />
              </div>

              <Button
                type="button"
                onClick={handleAgregarMultiples}
                disabled={creando || !listadoGuias.trim()}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar a Lista
              </Button>
            </div>
            </TabsContent>
          </Tabs>

          {/* Lista de paquetes temporales */}
          {paquetesTemporales.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Paquetes a Crear ({paquetesTemporales.length})</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaquetesTemporales([])}
                  disabled={creando}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpiar Todo
                </Button>
              </div>
              <div className="border rounded-md max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número de Guía</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paquetesTemporales.map((paquete, index) => (
                      <TableRow key={`${paquete.numeroGuia}-${index}`}>
                        <TableCell className="font-mono font-semibold">
                          {paquete.numeroGuia}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {paquete.observaciones || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminarTemporal(index)}
                            disabled={creando}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGuardar}
            disabled={creando || paquetesTemporales.length === 0}
          >
            {creando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Crear {paquetesTemporales.length} Paquete(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
