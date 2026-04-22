import { useState } from 'react'
import { usePaquetes } from '@/hooks/usePaquetes'
import { usePaquete } from '@/hooks/usePaquetes'
import { useAgregarHijosClementinaALote, useAgregarHijoClementinaPorGuiaALote } from '@/hooks/useLotesRecepcion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Package, Hash } from 'lucide-react'
import { TipoPaquete } from '@/types/paquete'
import { notify } from '@/lib/notify'

interface AsignarHijosClementinaDialogProps {
  loteRecepcionId: number
  idPaquetePadre: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AsignarHijosClementinaDialog({
  loteRecepcionId,
  idPaquetePadre,
  open,
  onOpenChange,
}: AsignarHijosClementinaDialogProps) {
  const [selectedPaquetes, setSelectedPaquetes] = useState<number[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [numeroGuia, setNumeroGuia] = useState('')
  const [buscandoPorGuia, setBuscandoPorGuia] = useState(false)
  const [tabActivo, setTabActivo] = useState('seleccionar')
  const { data: paquetePadre } = usePaquete(idPaquetePadre)
  const { data, isLoading } = usePaquetes({ page: 0, size: 100 })
  const agregarMutation = useAgregarHijosClementinaALote()
  const agregarPorGuiaMutation = useAgregarHijoClementinaPorGuiaALote()

  // Filtrar paquetes: excluir los que ya tienen padre y el paquete padre mismo
  const paquetesFiltrados = data?.content.filter((p) => {
    // Excluir el paquete padre
    if (p.idPaquete === idPaquetePadre) {
      return false
    }
    // Excluir los que ya tienen padre
    if (p.idPaquetePadre != null) {
      return false
    }
    // Filtrar por búsqueda
    if (busqueda && !p.numeroGuia?.toLowerCase().includes(busqueda.toLowerCase()) &&
        !p.idPaquete?.toString().includes(busqueda)) {
      return false
    }
    return true
  }) || []

  const handleTogglePaquete = (idPaquete: number) => {
    setSelectedPaquetes((prev) =>
      prev.includes(idPaquete)
        ? prev.filter((id) => id !== idPaquete)
        : [...prev, idPaquete]
    )
  }

  const handleSubmit = async () => {
    if (selectedPaquetes.length > 0) {
      try {
        await agregarMutation.mutateAsync({
          idLoteRecepcion: loteRecepcionId,
          idPaquetePadre: idPaquetePadre,
          idPaquetesHijos: selectedPaquetes,
        })
        setSelectedPaquetes([])
        setBusqueda('')
        onOpenChange(false)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  const handleAsociarPorGuia = async () => {
    if (!numeroGuia.trim()) {
      notify.error('Por favor ingresa un número de guía')
      return
    }

    setBuscandoPorGuia(true)
    try {
      await agregarPorGuiaMutation.mutateAsync({
        idLoteRecepcion: loteRecepcionId,
        idPaquetePadre: idPaquetePadre,
        numeroGuia: numeroGuia.trim(),
      })
      setNumeroGuia('')
      onOpenChange(false)
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setBuscandoPorGuia(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar Hijos a Paquete CLEMENTINA</DialogTitle>
          <DialogDescription>
            Selecciona los paquetes hijos que deseas asignar a este paquete padre CLEMENTINA
          </DialogDescription>
        </DialogHeader>

        {paquetePadre && (
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Paquete Padre: {paquetePadre.numeroGuia || `#${paquetePadre.idPaquete}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tipo: {paquetePadre.tipoPaquete} | Estado: {paquetePadre.estado}
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={tabActivo} onValueChange={setTabActivo} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="seleccionar">Seleccionar Existentes</TabsTrigger>
            <TabsTrigger value="por-guia">Asociar por Número de Guía</TabsTrigger>
          </TabsList>

          <TabsContent value="seleccionar" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de guía o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-border rounded-md p-4">
              {isLoading ? (
                <div className="text-center py-8">Cargando paquetes...</div>
              ) : paquetesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron paquetes disponibles. Los paquetes que ya tienen un padre asignado no se muestran.
                </div>
              ) : (
                <div className="space-y-2">
                  {paquetesFiltrados.map((paquete) => (
                    <div
                      key={paquete.idPaquete}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        id={`paquete-${paquete.idPaquete}`}
                        name={`paquete-${paquete.idPaquete}`}
                        checked={selectedPaquetes.includes(paquete.idPaquete!)}
                        onChange={() => handleTogglePaquete(paquete.idPaquete!)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Paquete #{paquete.idPaquete}
                          {paquete.numeroGuia && ` - ${paquete.numeroGuia}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Estado: {paquete.estado} | Tipo: {paquete.tipoPaquete || 'Sin tipo'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPaquetes.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedPaquetes.length} paquete(s) seleccionado(s)
              </div>
            )}
          </TabsContent>

          <TabsContent value="por-guia" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="numero-guia">Número de Guía</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="numero-guia"
                  placeholder="Ingresa el número de guía del paquete..."
                  value={numeroGuia}
                  onChange={(e) => setNumeroGuia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAsociarPorGuia()
                    }
                  }}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa el número de guía del paquete que deseas asociar como hijo. El paquete debe existir en el sistema.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setTabActivo('seleccionar')
            setNumeroGuia('')
            setSelectedPaquetes([])
            setBusqueda('')
            onOpenChange(false)
          }}>
            Cancelar
          </Button>
          {tabActivo === 'por-guia' ? (
            <Button
              onClick={handleAsociarPorGuia}
              disabled={!numeroGuia.trim() || buscandoPorGuia || agregarPorGuiaMutation.isPending}
            >
              {buscandoPorGuia || agregarPorGuiaMutation.isPending ? 'Asociando...' : 'Asociar por Guía'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={selectedPaquetes.length === 0 || agregarMutation.isPending}
            >
              {agregarMutation.isPending ? 'Asignando...' : 'Asignar Hijos'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
