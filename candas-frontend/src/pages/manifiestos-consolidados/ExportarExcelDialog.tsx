import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ManifiestoConsolidadoDetalle } from '@/types/manifiesto-consolidado'
import { generarExcelDestinatariosDirectos } from '@/utils/generarExcelManifiestoConsolidado'
import GenerarExcelDialog from './GenerarExcelDialog'
import { FileSpreadsheet, Table2, Users, Loader2 } from 'lucide-react'
import { notify } from '@/lib/notify'

interface ExportarExcelDialogProps {
  manifiesto: ManifiestoConsolidadoDetalle
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ExportarExcelDialog({
  manifiesto,
  open,
  onOpenChange,
}: ExportarExcelDialogProps) {
  const [mostrarGenerarExcel, setMostrarGenerarExcel] = useState(false)
  const [generandoDestinatarios, setGenerandoDestinatarios] = useState(false)

  const handleExcelDestinatarios = async () => {
    if (generandoDestinatarios) return
    setGenerandoDestinatarios(true)
    const id = notify.start('Generando Excel de destinatarios directos…')
    try {
      await generarExcelDestinatariosDirectos(manifiesto)
      notify.finish(id, 'Excel de destinatarios directos descargado')
      onOpenChange(false)
    } catch (error: unknown) {
      notify.fail(id, error, 'No se pudo generar el Excel de destinatarios directos')
    } finally {
      setGenerandoDestinatarios(false)
    }
  }

  return (
    <>
      <Dialog open={open && !mostrarGenerarExcel} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-border/50 p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border/30 bg-gradient-to-b from-muted/20 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/20 border border-emerald-200/40 dark:border-emerald-800/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Exportar Excel</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Selecciona el tipo de exportación
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Opciones de exportación</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-4 px-4 min-w-0 whitespace-normal flex flex-col items-start gap-2 text-left rounded-xl border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200"
                onClick={() => setMostrarGenerarExcel(true)}
              >
                <span className="w-full flex items-center gap-2.5 text-sm font-semibold">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Table2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Excel Consolidado
                </span>
                <span className="w-full text-[11px] text-muted-foreground leading-tight whitespace-normal break-words pl-9.5">
                  Manifiesto completo con fecha y hora de generación
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={generandoDestinatarios}
                className="h-auto py-4 px-4 min-w-0 whitespace-normal flex flex-col items-start gap-2 text-left rounded-xl border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200 disabled:opacity-60"
                onClick={handleExcelDestinatarios}
              >
                <span className="w-full flex items-center gap-2.5 text-sm font-semibold">
                  <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                    {generandoDestinatarios ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600 dark:text-violet-400" />
                    ) : (
                      <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  Destinatarios Directos
                </span>
                <span className="w-full text-[11px] text-muted-foreground leading-tight whitespace-normal break-words pl-9.5">
                  Solo paquetes de destinatarios directos
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {mostrarGenerarExcel && (
        <GenerarExcelDialog
          manifiesto={manifiesto}
          open={mostrarGenerarExcel}
          onOpenChange={(openState) => {
            setMostrarGenerarExcel(openState)
            if (!openState) {
              onOpenChange(false)
            }
          }}
        />
      )}
    </>
  )
}
