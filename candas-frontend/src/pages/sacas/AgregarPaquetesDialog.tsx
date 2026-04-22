import { useState } from 'react'
import { usePaquetes } from '@/hooks/usePaquetes'
import { useAgregarPaquetesSaca } from '@/hooks/useSacas'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Package, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInteragencyRestrictionMessage } from '@/lib/api/errors'

interface AgregarPaquetesDialogProps {
  sacaId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AgregarPaquetesDialog({
  sacaId,
  open,
  onOpenChange,
}: AgregarPaquetesDialogProps) {
  const [selectedPaquetes, setSelectedPaquetes] = useState<number[]>([])
  const [busqueda, setBusqueda] = useState('')
  const { data, isLoading, error } = usePaquetes({ page: 0, size: 100 })
  const agregarMutation = useAgregarPaquetesSaca()
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
          id: sacaId,
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
      <DialogContent className="max-w-2xl max-h-[85vh] h-full flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Agregar Paquetes
          </DialogTitle>
          <DialogDescription>
            Busca y selecciona los paquetes para añadir a esta saca.
          </DialogDescription>
        </DialogHeader>
        {restrictionMessage && (
          <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {restrictionMessage}
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
          {/* Search Bar */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por guía o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 bg-background border-border/50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-1">
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse text-sm">Cargando paquetes...</div>
              ) : restrictionMessage ? (
                <div className="py-12 text-center text-amber-700 border-2 border-dashed border-amber-300 rounded-lg">
                  {restrictionMessage}
                </div>
              ) : paquetesFiltrados.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No se encontraron paquetes
                </div>
              ) : (
                paquetesFiltrados.map((paquete) => {
                  const isSelected = selectedPaquetes.includes(paquete.idPaquete!)
                  return (
                    <div
                      key={paquete.idPaquete}
                      onClick={() => handleTogglePaquete(paquete.idPaquete!)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-background hover:shadow-sm hover:border-border/50 cursor-pointer transition-all",
                        isSelected ? "bg-primary/5 border-primary/20" : "bg-transparent"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleTogglePaquete(paquete.idPaquete!)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {paquete.numeroGuia || `Paquete #${paquete.idPaquete}`}
                          </p>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{paquete.estado}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{paquete.tipoPaquete}</span>
                          <span>•</span>
                          <span>{paquete.pesoKilos || '0'} kg</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground pl-2">
              {selectedPaquetes.length > 0 ? (
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <CheckSquare className="h-3.5 w-3.5" />
                  {selectedPaquetes.length} seleccionados
                </span>
              ) : (
                <span>Ninguno seleccionado</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} size="sm">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedPaquetes.length === 0 || agregarMutation.isPending}
                size="sm"
              >
                {agregarMutation.isPending ? 'Agregando...' : 'Agregar Paquetes'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
