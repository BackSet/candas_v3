import { useState } from 'react'
import { useAsociarCadenitaPorLote } from '@/hooks/usePaquetes'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, CheckCircle2, XCircle, Link2 } from 'lucide-react'
import type { ResultadoCadenita } from '@/types/paquete'
import { parseGuias } from '@/utils/parseGuias'
import { ResultStatsGrid } from '@/components/dialogs/ResultStatsGrid'
import { cn } from '@/lib/utils'

interface AsociarCadenitaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AsociarCadenitaDialog({
  open,
  onOpenChange,
}: AsociarCadenitaDialogProps) {
  const [guiaPadre, setGuiaPadre] = useState('')
  const [listaHijos, setListaHijos] = useState('')
  const [resultados, setResultados] = useState<ResultadoCadenita[] | null>(null)
  const asociarMutation = useAsociarCadenitaPorLote()

  const handleProcesar = async () => {
    const padreNorm = guiaPadre.trim().toUpperCase()
    const hijos = parseGuias(listaHijos)

    if (!padreNorm || hijos.length === 0) return

    try {
      const resultado = await asociarMutation.mutateAsync({
        numeroGuiaPadre: padreNorm,
        numeroGuiasHijos: hijos,
      })
      setResultados(resultado.resultados)
    } catch {
      // Error handled by hook toast
    }
  }

  const handleCerrar = () => {
    setGuiaPadre('')
    setListaHijos('')
    setResultados(null)
    onOpenChange(false)
  }

  const hijos = parseGuias(listaHijos)
  const hayContenido = guiaPadre.trim().length > 0 && hijos.length > 0

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            Asociar Cadenita
          </DialogTitle>
          <DialogDescription>
            Ingrese la guía padre y la lista de guías hijos. Cada hijo quedará asociado al padre con tipo CADENITA.
          </DialogDescription>
        </DialogHeader>

        {!resultados ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="guia-padre" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Guía padre
                </Label>
                <Input
                  id="guia-padre"
                  placeholder="Ej: ECA7800100028"
                  value={guiaPadre}
                  onChange={(e) => setGuiaPadre(e.target.value)}
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lista-hijos" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lista de guías hijos
                  </Label>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {hijos.length} detectados
                  </span>
                </div>
                <Textarea
                  id="lista-hijos"
                  placeholder="Pegar lista de guías (una por línea o separadas por comas/espacios)..."
                  value={listaHijos}
                  onChange={(e) => setListaHijos(e.target.value)}
                  className="font-mono text-xs min-h-[200px] resize-none border-dashed focus:border-solid bg-muted/20"
                />
              </div>

              {hayContenido && (
                <div className="rounded-lg border border-border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">
                    Se asociarán <strong className="text-foreground">{hijos.length}</strong> paquete(s) hijo(s) al padre <strong className="font-mono">{guiaPadre.trim().toUpperCase()}</strong>.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
              <Button variant="ghost" onClick={handleCerrar}>Cancelar</Button>
              <Button onClick={handleProcesar} disabled={!hayContenido || asociarMutation.isPending}>
                {asociarMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : (
                  'Procesar'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 pb-2">
              <ResultStatsGrid
                total={resultados.length}
                exitosos={resultados.filter(r => r.exito).length}
                fallidos={resultados.filter(r => !r.exito).length}
                className="mb-4"
              />
            </div>

            <div className="flex-1 overflow-hidden px-6 pb-6">
              <div className="border rounded-md h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Guía hijo</TableHead>
                        <TableHead className="w-24 text-center">Estado</TableHead>
                        <TableHead>Mensaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-center text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{resultado.numeroGuiaHijo}</TableCell>
                          <TableCell className="text-center">
                            {resultado.exito ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className={cn('text-xs', resultado.exito ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                            {resultado.mensaje}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
              <Button variant="outline" onClick={handleCerrar}>Cerrar</Button>
              <Button onClick={() => {
                setResultados(null)
                setGuiaPadre('')
                setListaHijos('')
              }}>
                Nueva asociación
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
