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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { paqueteService, type ImportResult } from '@/lib/api/paquete.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import { Tag, AlertCircle, Loader2 } from 'lucide-react'
import { ResultStatsGrid } from '@/components/dialogs/ResultStatsGrid'
import { notify } from '@/lib/notify'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ImportarRefDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

export default function ImportarRefDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportarRefDialogProps) {
  const [listaPaquetes, setListaPaquetes] = useState('')
  const [listaReferencias, setListaReferencias] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<ImportResult | null>(null)

  const parsePares = () => {
    const lineasGuias = listaPaquetes.split(/\r?\n/).map((l) => l.trim())
    const lineasRefs = listaReferencias.split(/\r?\n/).map((l) => l.trim())
    return lineasGuias
      .map((g, i) => ({ numeroGuia: g, ref: lineasRefs[i] ?? '' }))
      .filter((p) => p.numeroGuia !== '')
      .map((p) => ({ numeroGuia: p.numeroGuia, ref: p.ref === '' ? null : p.ref }))
  }

  const handleSubmit = async () => {
    const pares = parsePares()
    if (pares.length === 0) {
      notify.error('Ingresa al menos un número de guía en la lista de paquetes.')
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      const res = await paqueteService.importarRefDesdeLista(pares)
      setResultado(res)

      if (res.registrosExitosos > 0) {
        notify.success(`Importación completada: ${res.registrosExitosos} REF actualizados`)
      }
      if (res.registrosFallidos > 0) {
        notify.warning(`${res.registrosFallidos} registros con error.`)
      }
      if (onImportSuccess) {
        onImportSuccess()
      }
    } catch (err: unknown) {
      notify.error(err, 'Error al importar REF.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setListaPaquetes('')
    setListaReferencias('')
    setResultado(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Tag className="h-4 w-4" />
            </div>
            Importar REF
          </DialogTitle>
          <DialogDescription>
            Ingresa la lista de paquetes (número de guía) y la lista de referencias. Cada línea de referencias corresponde a la misma línea de paquetes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {!resultado ? (
            <div className="flex flex-col gap-6">
              <p className="text-xs text-muted-foreground">
                Cada línea de la lista de referencias corresponde a la misma línea de la lista de paquetes. Si un paquete no tiene referencia, deja esa línea vacía.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lista-paquetes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lista de paquetes (número de guía)
                  </Label>
                  <Textarea
                    id="lista-paquetes"
                    placeholder="Una guía por línea..."
                    value={listaPaquetes}
                    onChange={(e) => setListaPaquetes(e.target.value)}
                    className="font-mono text-sm min-h-[150px] resize-y bg-muted/20 border-dashed focus:border-solid"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lista-referencias" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lista de referencias
                  </Label>
                  <Textarea
                    id="lista-referencias"
                    placeholder="Una REF por línea, mismo orden. Línea vacía = sin REF."
                    value={listaReferencias}
                    onChange={(e) => setListaReferencias(e.target.value)}
                    className="font-mono text-sm min-h-[150px] resize-y bg-muted/20 border-dashed focus:border-solid"
                  />
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

              {resultado.errores && resultado.errores.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" /> Detalles de Errores
                  </h4>
                  <div className="rounded-md border border-border overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="h-8 text-xs">Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.errores.map((error, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="py-2 text-xs text-destructive">{error}</TableCell>
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
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !listaPaquetes.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...
                  </>
                ) : (
                  'Iniciar Importación'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
