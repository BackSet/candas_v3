import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Plus } from 'lucide-react'
import { useListFilter } from '@/hooks/useListFilter'
import { usePaqueteScanner } from '@/hooks/usePaqueteScanner'
import type { Paquete } from '@/types/paquete'
import type { SacaFormData } from '@/hooks/useSacasManager'

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

  const paquetesFiltrados = useListFilter(
    paquetesDisponibles,
    '',
    [
      (p) => p.numeroGuia,
      (p) => p.idPaquete?.toString(),
    ]
  )

  const scanner = usePaqueteScanner(
    paquetesDisponibles,
    (paquete) => {
      const nuevosIds = saca.idPaquetes.includes(paquete.idPaquete!)
        ? saca.idPaquetes
        : [...saca.idPaquetes, paquete.idPaquete!]
      onPaquetesChange(sacaIndex, nuevosIds)
    },
    open
  )

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
        // Remover de la otra saca
        const nuevasSacas = [...sacas]
        nuevasSacas[paqueteEnOtraSaca].idPaquetes =
          nuevasSacas[paqueteEnOtraSaca].idPaquetes.filter(id => id !== paqueteId)
        // Actualizar todas las sacas
        nuevasSacas.forEach((s, idx) => {
          if (idx === sacaIndex && !s.idPaquetes.includes(paqueteId)) {
            s.idPaquetes.push(paqueteId)
          }
        })
        // Nota: Esto requiere una función más compleja para actualizar todas las sacas
        // Por ahora, solo actualizamos la saca actual
      }

      if (!saca.idPaquetes.includes(paqueteId)) {
        onPaquetesChange(sacaIndex, [...saca.idPaquetes, paqueteId])
      }
    } else {
      onPaquetesChange(sacaIndex, saca.idPaquetes.filter(id => id !== paqueteId))
    }
  }

  const handleClose = () => {
    scanner.limpiarBusqueda()
    setListadoPaquetes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Paquetes</DialogTitle>
          <DialogDescription>
            Escanea el código de barras o busca por número de guía. También puedes seleccionar de la lista.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Escanea código o busca por número de guía/ID (Enter para buscar)..."
                value={scanner.busqueda}
                onChange={(e) => scanner.handleBusquedaChange(e.target.value)}
                onKeyDown={scanner.handleBusquedaKeyDown}
                className="pl-9 text-lg"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Usa un escáner de códigos de barras o escribe el número de guía y presiona Enter
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              O pega un listado de números de guía (uno por línea)
            </label>
            <Textarea
              placeholder={`Pega aquí los números de guía, uno por línea:\nECA7800050583\nECA7800050605\n...`}
              value={listadoPaquetes}
              onChange={(e) => setListadoPaquetes(e.target.value)}
              rows={6}
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
                {scanner.busqueda
                  ? `No se encontraron paquetes con "${scanner.busqueda}"`
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
