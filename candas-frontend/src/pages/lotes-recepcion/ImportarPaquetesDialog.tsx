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
import { Textarea } from '@/components/ui/textarea'
import { loteRecepcionService } from '@/lib/api/lote-recepcion.service'
import type { LoteRecepcionImportResult } from '@/types/lote-recepcion'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, FileText, Download } from 'lucide-react'
import { notify } from '@/lib/notify'
import { useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ImportarPaquetesDialogProps {
  recepcionId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

export default function ImportarPaquetesDialog({
  recepcionId,
  open,
  onOpenChange,
  onImportSuccess,
}: ImportarPaquetesDialogProps) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [listadoManual, setListadoManual] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<LoteRecepcionImportResult | null>(null)
  const [activeTab, setActiveTab] = useState<'excel' | 'manual'>('excel')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar que sea un archivo Excel
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

  const handleSubmitExcel = async () => {
    if (!file) {
      notify.error('Por favor, selecciona un archivo')
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      const resultado = await loteRecepcionService.importarPaquetesDesdeExcel(recepcionId, file)
      setResultado(resultado)

      if (resultado.paquetesEncontrados > 0) {
        notify.success(
          `Importación completada: ${resultado.paquetesEncontrados} de ${resultado.totalRegistros} paquetes asociados`
        )
      }

      if (resultado.paquetesNoEncontrados > 0) {
        notify.warning(
          `${resultado.paquetesNoEncontrados} guías no encontradas.`
        )
      }

      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (error: any) {
      notify.error(
        error.response?.data?.message || 'Error al importar el archivo.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitManual = async () => {
    if (!listadoManual.trim()) {
      notify.error('Por favor, ingresa al menos un número de guía')
      return
    }

    // Separar números de guía por líneas o comas
    const numerosGuia = listadoManual
      .split(/[\n,;]/)
      .map(guia => guia.trim())
      .filter(guia => guia.length > 0)

    if (numerosGuia.length === 0) {
      notify.error('Por favor, ingresa al menos un número de guía válido')
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      const resultado = await loteRecepcionService.agregarPaquetesPorNumeroGuia(recepcionId, numerosGuia)
      setResultado(resultado)

      if (resultado.paquetesEncontrados > 0) {
        notify.success(
          `${resultado.paquetesEncontrados} de ${resultado.totalRegistros} paquetes asociados correctamente`
        )
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes', recepcionId] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes-no-encontrados', recepcionId] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion', recepcionId] })

      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (error: any) {
      notify.error(
        error.response?.data?.message || 'Error al agregar paquetes.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setListadoManual('')
    setResultado(null)
    setActiveTab('excel')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/60 shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Paquetes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Agrega paquetes al lote mediante archivo Excel o listado manual.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <Tabs defaultValue="excel" value={activeTab} onValueChange={(v) => setActiveTab(v as 'excel' | 'manual')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/40">
              <TabsTrigger value="excel" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Desde Excel
              </TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Listado Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="space-y-4 py-2">
              {!resultado ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                      file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        {file ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {file ? file.name : "Selecciona o arrastra tu archivo Excel"}
                        </p>
                        {!file && (
                          <p className="text-xs text-muted-foreground">
                            Formato: .xlsx o .xls con una columna de guías
                          </p>
                        )}
                      </div>

                      <label htmlFor="file-upload" className="cursor-pointer mt-2 inline-block">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button variant={file ? "secondary" : "default"} size="sm" asChild className="pointer-events-none">
                          <span>{file ? "Cambiar archivo" : "Explorar archivos"}</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 py-2">
              {!resultado ? (
                <div className="space-y-3">
                  <Textarea
                    value={listadoManual}
                    onChange={(e) => setListadoManual(e.target.value)}
                    placeholder={`Pegue aquí los números de guía...\nEjemplo:\nGUIA-001\nGUIA-002`}
                    className="font-mono text-sm min-h-[200px] resize-none border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/20"
                  />
                  <p className="text-xs text-muted-foreground ml-1">
                    * Ingrese un número de guía por línea.
                  </p>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          {/* Resultado Section used for both tabs */}
          {resultado && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4 py-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                      resultado.paquetesEncontrados > 0 ? "bg-success/10 text-success border border-success/20" : "bg-error/10 text-error border border-error/20"
                    )}>
                      {resultado.paquetesEncontrados > 0 ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Procesado completo</p>
                      <p className="text-xs text-muted-foreground">
                        {resultado.paquetesEncontrados} de {resultado.totalRegistros} importados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Badges */}
                <div className="flex gap-2 text-xs">
                  <div className="px-2 py-1 bg-muted rounded-md border flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                    Total: <span className="font-semibold">{resultado.totalRegistros}</span>
                  </div>
                  <div className="px-2 py-1 bg-success/10 text-success rounded-md border border-success/20 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Éxito: <span className="font-semibold">{resultado.paquetesEncontrados}</span>
                  </div>
                  {resultado.paquetesNoEncontrados > 0 && (
                    <div className="px-2 py-1 bg-error/10 text-error rounded-md border border-error/20 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-error" />
                      Fallidos: <span className="font-semibold">{resultado.paquetesNoEncontrados}</span>
                    </div>
                  )}
                </div>

                {/* Error List */}
                {((resultado.numerosGuiaNoEncontrados?.length ?? 0) > 0 || (resultado.paquetesNoImportados?.length ?? 0) > 0) && (
                  <div className="mt-4 border rounded-md overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>Errores / No encontrados</span>
                    </div>
                    <div className="max-h-[150px] overflow-y-auto p-2 bg-muted/10 space-y-1">
                      {(resultado.numerosGuiaNoEncontrados ?? []).map((guia, i) => (
                        <div key={`nf-${i}`} className="flex items-center gap-2 text-xs text-error px-2 py-1 hover:bg-error/5 rounded">
                          <XCircle className="h-3 w-3" />
                          <span className="font-mono">{guia}</span>
                          <span className="text-muted-foreground ml-auto">No encontrado</span>
                        </div>
                      ))}
                      {(resultado.paquetesNoImportados ?? []).map((p, i) => (
                        <div key={`err-${i}`} className="flex items-center gap-2 text-xs text-error px-2 py-1 hover:bg-error/5 rounded">
                          <AlertCircle className="h-3 w-3" />
                          <span className="font-mono">{p.numeroGuia}</span>
                          <span className="text-muted-foreground ml-auto">{p.motivo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading} className="hover:bg-muted/80">
            {resultado ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!resultado && (
            <Button
              onClick={activeTab === 'excel' ? handleSubmitExcel : handleSubmitManual}
              disabled={isLoading || (activeTab === 'excel' ? !file : !listadoManual.trim())}
              className="bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
