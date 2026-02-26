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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import type { ListasEtiquetadasBatchResult } from '@/types/listas-etiquetadas'
import { useQuery } from '@tanstack/react-query'
import { Tag, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseGuiasUnicas } from '@/utils/parseGuias'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'

interface ImportarPaquetesEspecialesMiamiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

export default function ImportarPaquetesEspecialesMiamiDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportarPaquetesEspecialesMiamiDialogProps) {
  const [numerosGuiaText, setNumerosGuiaText] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [instruccion, setInstruccion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<ListasEtiquetadasBatchResult | null>(null)

  const { data: etiquetasExistentes = [] } = useQuery({
    queryKey: ['listas-etiquetadas', 'etiquetas'],
    queryFn: () => listasEtiquetadasService.getAllEtiquetas(),
    enabled: open,
  })

  const handleSubmit = async () => {
    const guias = parseGuiasUnicas(numerosGuiaText)
    if (guias.length === 0) {
      toast.error('Ingresa al menos un número de guía')
      return
    }
    const etiquetaTrim = etiqueta.trim()
    if (!etiquetaTrim) {
      toast.error('La etiqueta es obligatoria')
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      const res = await listasEtiquetadasService.createBatch({
        etiqueta: etiquetaTrim.toUpperCase(),
        numerosGuia: guias,
        instruccion: instruccion?.trim() || undefined,
      })
      setResultado(res)
      toast.success(`Procesados ${res.totalProcesados} paquetes`)
      if (onImportSuccess) onImportSuccess()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al importar'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNumerosGuiaText('')
    setEtiqueta('')
    setInstruccion('')
    setResultado(null)
    onOpenChange(false)
  }

  const guiasParsed = parseGuiasUnicas(numerosGuiaText)
  const canSubmit =
    guiasParsed.length > 0 && etiqueta.trim().length > 0 && !isLoading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Tag className="h-4 w-4" />
            </div>
            Importar paquetes especiales (MIAMI)
          </DialogTitle>
          <DialogDescription>
            Lista de números de guía y etiqueta. Se asignará la etiqueta como REF y en observaciones internas; los paquetes se crean o actualizan con datos básicos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {!resultado ? (
            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="numeros-guia" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Números de guía
                  </Label>
                  {guiasParsed.length > 0 && (
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {guiasParsed.length} detectados
                    </span>
                  )}
                </div>
                <Textarea
                  id="numeros-guia"
                  placeholder="Uno por línea o separados por coma..."
                  value={numerosGuiaText}
                  onChange={(e) => setNumerosGuiaText(e.target.value)}
                  className="font-mono text-sm min-h-[150px] resize-y bg-muted/20 border-dashed focus:border-solid"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="etiqueta" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Etiqueta
                  </Label>
                  <Input
                    id="etiqueta"
                    list="etiquetas-list"
                    placeholder="ej. MIAMI"
                    value={etiqueta}
                    onChange={(e) => setEtiqueta(e.target.value)}
                  />
                  <datalist id="etiquetas-list">
                    {etiquetasExistentes.map((e) => (
                      <option key={e} value={e} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instruccion" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Instrucción (opcional)
                  </Label>
                  <Input
                    id="instruccion"
                    placeholder="Se añade a observaciones"
                    value={instruccion}
                    onChange={(e) => setInstruccion(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total procesados
                  </div>
                  <div className="text-2xl font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    {resultado.totalProcesados}
                  </div>
                </div>
                {resultado.guiasEnVariasListas && resultado.guiasEnVariasListas.length > 0 && (
                  <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center bg-amber-50 dark:bg-amber-950/30">
                    <div className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                      Guías en varias listas
                    </div>
                    <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                      {resultado.guiasEnVariasListas.length}
                    </div>
                  </div>
                )}
              </div>

              {resultado.guiasEnVariasListas && resultado.guiasEnVariasListas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" /> Guías que quedaron en VARIAS
                  </h4>
                  <div className="rounded-md border border-border overflow-hidden max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="h-8 text-xs">Número de guía</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.guiasEnVariasListas.map((guia, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="py-2 text-xs font-mono">{guia}</TableCell>
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
            <Button onClick={handleClose}>Cerrar resumen</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <ProtectedByPermission permission={PERMISSIONS.PAQUETES.CREAR}>
                <Button onClick={handleSubmit} disabled={!canSubmit}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...
                    </>
                  ) : (
                    'Importar'
                  )}
                </Button>
              </ProtectedByPermission>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
