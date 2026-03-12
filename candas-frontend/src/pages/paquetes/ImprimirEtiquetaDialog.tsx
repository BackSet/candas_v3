import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Printer } from 'lucide-react'
import type { Paquete } from '@/types/paquete'
import { imprimirEtiqueta } from '@/utils/imprimirEtiqueta'

interface ImprimirEtiquetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paquete: Paquete | null
}

export default function ImprimirEtiquetaDialog({
  open,
  onOpenChange,
  paquete,
}: ImprimirEtiquetaDialogProps) {

  if (!paquete) return null

  const handlePrint = () => {
    imprimirEtiqueta(paquete)
    onOpenChange(false)
  }

  // Datos para vista previa simplified (mock data logic from util)
  const direccionDestinatario = [
    paquete.provinciaDestinatario,
    paquete.paisDestinatario,
    paquete.cantonDestinatario
  ].filter(Boolean).join(' - ')

  const nombreAgencia = paquete.nombreAgenciaDestino || paquete.nombrePuntoOrigen

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-muted-foreground" />
            Imprimir Etiqueta
          </DialogTitle>
          <DialogDescription>
            Vista previa de impresión (Estilo A4, 6 etiquetas por hoja)
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center p-6 bg-muted/20 rounded-lg border border-dashed border-border">
          {/* HTML Preview Simulation */}
          <div className="bg-white text-black p-4 w-[500px] h-[140px] shadow-sm border border-border flex relative overflow-hidden">

            {/* Header */}
            <div className="absolute top-2 right-4 text-[10px] font-bold text-muted-foreground uppercase">
              {nombreAgencia}
            </div>

            {/* Left */}
            <div className="w-[45%] border-r border-border/50 flex flex-col items-center justify-center pr-2">
              <div className="w-full h-12 bg-black/10 flex items-center justify-center mb-1 text-[8px] text-muted-foreground">
                [CÓDIGO DE BARRAS]
              </div>
              <div className="text-2xl font-extrabold font-mono tracking-tighter text-center leading-none">
                {paquete.numeroGuia || 'SIN-GUIA'}
              </div>
              {paquete.numeroMaster && <div className="text-[8px] text-muted-foreground mt-1">MASTER: {paquete.numeroMaster}</div>}
            </div>

            {/* Right */}
            <div className="flex-1 flex flex-col justify-center pl-3 text-left">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Destinatario</div>
              <div className="text-sm font-bold uppercase leading-tight mb-1 line-clamp-1">
                {paquete.nombreClienteDestinatario || 'NOMBRE DESTINATARIO'}
              </div>

              <div className="text-[10px] leading-tight text-foreground/80 mb-2 line-clamp-2">
                {paquete.direccionDestinatarioCompleta || paquete.direccionDestinatario || 'Dirección no disponible'}
              </div>

              <div className="text-[10px] font-medium mb-auto">
                Telf: {paquete.telefonoDestinatario || 'N/A'}
              </div>

              <div className="border-t border-border/50 pt-1 mt-1">
                <div className="text-[10px] font-bold uppercase">
                  {direccionDestinatario || 'CIUDAD - PAIS'}
                </div>
                {paquete.documentoDestinatario && (
                  <div className="text-[9px] text-muted-foreground">C.I.: {paquete.documentoDestinatario}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
