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
import { Input } from '@/components/ui/input'
import { paqueteService, type ImportResult } from '@/lib/api/paquete.service'
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react'
import { notify } from '@/lib/notify'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ResultStatsGrid } from '@/components/dialogs/ResultStatsGrid'
import { cn } from '@/lib/utils'

interface ImportarPaquetesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

export default function ImportarPaquetesDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportarPaquetesDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls']
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf('.'))
        .toLowerCase()

      if (!validExtensions.includes(fileExtension)) {
        notify.error('Por favor, selecciona un archivo Excel (.xlsx o .xls)')
        return
      }

      setFile(selectedFile)
      setResultado(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      notify.error('Por favor, selecciona un archivo')
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      const resultado = await paqueteService.importarDesdeExcel(file)
      setResultado(resultado)

      if (resultado.registrosExitosos > 0) {
        notify.success(`Importación completada: ${resultado.registrosExitosos} paquetes`)
      }

      if (resultado.registrosFallidos > 0) {
        notify.warning(`${resultado.registrosFallidos} paquetes con error.`)
      }

      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Error al importar el archivo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResultado(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            Importar Paquetes
          </DialogTitle>
          <DialogDescription>
            Carga masiva desde archivo Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {!resultado ? (
            <div className="flex-1 flex flex-col justify-center">
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/50",
                  file && "border-primary bg-primary/5"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-sm">
                    {file ? file.name : 'Haz clic para seleccionar un archivo'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file ? 'Archivo seleccionado listo para importar' : 'Formatos soportados: .xlsx, .xls'}
                  </p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="mt-8 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estructura Requerida</h4>
                <div className="text-xs space-y-2 p-3 rounded-md bg-muted/30 border border-border/50 font-mono">
                  <div><span className="text-primary">Fila 1:</span> Metadata (MASTER...)</div>
                  <div><span className="text-primary">Fila 2:</span> Headers (HAWB | SACA | ...)</div>
                  <div><span className="text-primary">Fila 4+:</span> Data</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6">
              <ResultStatsGrid
                total={resultado.totalRegistros}
                exitosos={resultado.registrosExitosos}
                fallidos={resultado.registrosFallidos}
              />

              {/* Errors List */}
              {resultado.registrosFallidos > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" /> Detalles de Errores
                  </h4>
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="h-8 text-xs w-[120px]">Guía</TableHead>
                          <TableHead className="h-8 text-xs">Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(resultado.paquetesNoImportados ?? []).map((p, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="py-2 text-xs font-mono">{p.numeroGuia}</TableCell>
                            <TableCell className="py-2 text-xs text-destructive">{p.motivo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
          {resultado ? (
            <Button onClick={handleClose}>Cerrar Resumen</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!file || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...
                  </>
                ) : 'Iniciar Importación'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
