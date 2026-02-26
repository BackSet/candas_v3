import { useState } from 'react'
import { useSacas } from '@/hooks/useSacas'
import { useAgregarSacasDespacho } from '@/hooks/useDespachos'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Search } from 'lucide-react'
import { LoadingState } from '@/components/states'

interface AgregarSacasDialogProps {
  despachoId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AgregarSacasDialog({
  despachoId,
  open,
  onOpenChange,
}: AgregarSacasDialogProps) {
  const [selectedSacas, setSelectedSacas] = useState<number[]>([])
  const [busqueda, setBusqueda] = useState('')
  const { data, isLoading } = useSacas(0, 100)
  const agregarMutation = useAgregarSacasDespacho()

  const sacasFiltradas = data?.content.filter((s) => {
    if (busqueda && !s.codigoQr?.toLowerCase().includes(busqueda.toLowerCase()) &&
      !s.idSaca?.toString().includes(busqueda)) {
      return false
    }
    // Solo mostrar sacas que no tienen despacho asignado o que ya están en este despacho
    return !s.idDespacho || s.idDespacho === despachoId
  }) || []

  const handleToggleSaca = (idSaca: number) => {
    setSelectedSacas((prev) =>
      prev.includes(idSaca)
        ? prev.filter((id) => id !== idSaca)
        : [...prev, idSaca]
    )
  }

  const handleSubmit = async () => {
    if (selectedSacas.length > 0) {
      try {
        await agregarMutation.mutateAsync({
          id: despachoId,
          idSacas: selectedSacas,
        })
        setSelectedSacas([])
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
          <DialogTitle>Agregar Sacas al Despacho</DialogTitle>
          <DialogDescription>
            Selecciona las sacas que deseas agregar a este despacho
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código de barras o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto border border-border rounded-md p-4">
            {isLoading ? (
              <LoadingState label="Cargando sacas..." />
            ) : sacasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron sacas disponibles
              </div>
            ) : (
              <div className="space-y-2">
                {sacasFiltradas.map((saca) => (
                  <div
                    key={saca.idSaca}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`saca-${saca.idSaca}`}
                      checked={selectedSacas.includes(saca.idSaca!)}
                      onCheckedChange={() => handleToggleSaca(saca.idSaca!)}
                    />
                    <Label
                      htmlFor={`saca-${saca.idSaca}`}
                      className="flex-1 cursor-pointer select-none font-normal"
                    >
                      <p className="text-sm font-medium">
                        Saca #{saca.idSaca} - {saca.codigoQr}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tamaño: {saca.tamano} | Peso: {saca.pesoTotal || '-'} kg
                      </p>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSacas.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedSacas.length} saca(s) seleccionada(s)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedSacas.length === 0 || agregarMutation.isPending}
          >
            {agregarMutation.isPending ? 'Agregando...' : 'Agregar Sacas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
