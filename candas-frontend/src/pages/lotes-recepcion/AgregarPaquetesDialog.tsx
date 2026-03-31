import { useState } from 'react'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useAgregarPaquetesLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { getInteragencyRestrictionMessage } from '@/lib/api/errors'

interface AgregarPaquetesDialogProps {
  recepcionId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AgregarPaquetesDialog({
  recepcionId,
  open,
  onOpenChange,
}: AgregarPaquetesDialogProps) {
  const [selectedPaquetes, setSelectedPaquetes] = useState<number[]>([])
  const [busqueda, setBusqueda] = useState('')
  const { data, isLoading, error } = usePaquetes(0, 100)
  const agregarMutation = useAgregarPaquetesLoteRecepcion()
  const restrictionMessage =
    getInteragencyRestrictionMessage(error) ??
    getInteragencyRestrictionMessage(agregarMutation.error)

  const paquetesFiltrados = data?.content.filter((p) => {
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
          id: recepcionId,
          idPaquetes: selectedPaquetes,
        })
        setSelectedPaquetes([])
        setBusqueda('')
        onOpenChange(false)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar Paquetes al Lote de Recepción</DialogTitle>
          <DialogDescription>
            Selecciona los paquetes que deseas agregar a este lote de recepción
          </DialogDescription>
        </DialogHeader>
        {restrictionMessage && (
          <div className="mx-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {restrictionMessage}
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
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
            ) : restrictionMessage ? (
              <div className="text-center py-8 text-amber-700">
                {restrictionMessage}
              </div>
            ) : paquetesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron paquetes
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
                        Estado: {paquete.estado} | Tipo: {paquete.tipoPaquete}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedPaquetes.length === 0 || agregarMutation.isPending}
          >
            {agregarMutation.isPending ? 'Agregando...' : 'Agregar Paquetes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
