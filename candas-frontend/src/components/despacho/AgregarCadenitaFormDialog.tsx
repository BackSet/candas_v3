import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Link2 } from 'lucide-react'
import { paqueteService } from '@/lib/api/paquete.service'
import { notify } from '@/lib/notify'
import type { Paquete } from '@/types/paquete'

interface AgregarCadenitaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaquetesEncontrados: (paquetes: Paquete[]) => void
}

export default function AgregarCadenitaFormDialog({
  open,
  onOpenChange,
  onPaquetesEncontrados,
}: AgregarCadenitaFormDialogProps) {
  const [guiaPadre, setGuiaPadre] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const valor = guiaPadre.trim().toUpperCase()
    if (!valor) return

    setLoading(true)
    try {
      const hijos = await paqueteService.findHijosCadenita(valor)
      
      if (hijos.length === 0) {
        notify.warning('No se encontraron guías hijas tipo CADENITA para esta guía padre')
        return
      }

      onPaquetesEncontrados(hijos)
      setGuiaPadre('')
      onOpenChange(false)
      notify.success(`${hijos.length} guías hijas encontradas`)
    } catch (error) {
      console.error(error)
      notify.error('Error al buscar guías hijas. Verifica el número de guía.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setGuiaPadre('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            Agregar Cadenita
          </DialogTitle>
          <DialogDescription>
            Ingresa la guía padre para agregar todas sus guías hijas (CADENITA) en una nueva saca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guia-padre-cadenita" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guía padre
            </Label>
            <Input
              id="guia-padre-cadenita"
              placeholder="Ej: ECA7800100028"
              value={guiaPadre}
              onChange={(e) => setGuiaPadre(e.target.value)}
              className="font-mono uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!guiaPadre.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              'Agregar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
