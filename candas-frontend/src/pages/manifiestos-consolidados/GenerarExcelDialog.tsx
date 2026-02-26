import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import type { ManifiestoConsolidadoDetalle } from '@/types/manifiesto-consolidado'
import { generarExcelManifiestoConsolidado } from '@/utils/generarExcelManifiestoConsolidado'
import { FileSpreadsheet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function obtenerFechaHoraActual(): string {
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  const horas = String(ahora.getHours()).padStart(2, '0')
  const minutos = String(ahora.getMinutes()).padStart(2, '0')
  return `${año}-${mes}-${dia}T${horas}:${minutos}`
}

interface GenerarExcelDialogProps {
  manifiesto: ManifiestoConsolidadoDetalle
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GenerarExcelDialog({
  manifiesto,
  open,
  onOpenChange,
}: GenerarExcelDialogProps) {
  const [fechaHora, setFechaHora] = useState(obtenerFechaHoraActual())
  const [isGenerating, setIsGenerating] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFechaHora(obtenerFechaHoraActual())
    } else {
      setFechaHora('')
    }
    onOpenChange(newOpen)
  }

  const handleGenerar = () => {
    if (!fechaHora) {
      toast.error('Por favor, completa la fecha y la hora')
      return
    }
    const [fecha, hora] = fechaHora.split('T')
    if (!fecha || !hora) {
      toast.error('Por favor, completa la fecha y la hora correctamente')
      return
    }

    setIsGenerating(true)

    try {
      generarExcelManifiestoConsolidado(manifiesto, fecha, hora)

      let totalPaquetes = 0
      for (const despacho of manifiesto.despachos || []) {
        for (const saca of despacho.sacas || []) {
          for (const paquete of saca.paquetes || []) {
            if (paquete.numeroGuia && paquete.numeroGuia.trim() !== '') {
              totalPaquetes++
            }
          }
        }
      }

      toast.success(`Excel generado exitosamente con ${totalPaquetes} paquete(s)`)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el archivo Excel')
    } finally {
      setIsGenerating(false)
    }
  }

  let totalPaquetes = 0
  for (const despacho of manifiesto.despachos || []) {
    for (const saca of despacho.sacas || []) {
      for (const paquete of saca.paquetes || []) {
        if (paquete.numeroGuia && paquete.numeroGuia.trim() !== '') {
          totalPaquetes++
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 gap-0 flex flex-col max-h-[90vh] rounded-2xl border-border/50 overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-b from-muted/20 to-transparent border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/20 border border-emerald-200/40 dark:border-emerald-800/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Generar Excel</DialogTitle>
              <DialogDescription className="mt-1">
                Exportar manifiesto consolidado a formato Excel
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
          {totalPaquetes === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No hay paquetes con número de guía en este manifiesto. El archivo Excel podría estar vacío.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted/20 rounded-xl border border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Paquetes a exportar</span>
                  <span className="text-lg font-bold tabular-nums">{totalPaquetes}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="fechaHora" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Fecha y Hora Generación
                </label>
                <DateTimePickerForm
                  id="fechaHora"
                  value={fechaHora}
                  onChange={setFechaHora}
                  inline
                  className="h-11 bg-background rounded-lg"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border/20 bg-muted/5 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating} className="rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={handleGenerar}
            disabled={isGenerating || totalPaquetes === 0}
            className="rounded-lg"
          >
            {isGenerating ? (
              <>Generando...</>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
