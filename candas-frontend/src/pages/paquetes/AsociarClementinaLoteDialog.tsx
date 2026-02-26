import { useState } from 'react'
import { useAsociarClementinaPorLote } from '@/hooks/usePaquetes'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, CheckCircle2, XCircle, ArrowRight, PackagePlus } from 'lucide-react'


import type { ResultadoAsociacion } from '@/types/paquete'
import { parseGuias } from '@/utils/parseGuias'
import { ResultStatsGrid } from '@/components/dialogs/ResultStatsGrid'
import { cn } from '@/lib/utils'

interface AsociarClementinaLoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AsociarClementinaLoteDialog({
  open,
  onOpenChange,
}: AsociarClementinaLoteDialogProps) {
  const [listaPadres, setListaPadres] = useState('')
  const [listaHijos, setListaHijos] = useState('')
  const [resultados, setResultados] = useState<ResultadoAsociacion[] | null>(null)
  const asociarMutation = useAsociarClementinaPorLote()

  const handleProcesar = async () => {
    const padres = parseGuias(listaPadres)
    const hijos = parseGuias(listaHijos)

    if (padres.length === 0 || hijos.length === 0) return

    const asociaciones = padres.map((padre, index) => ({
      numeroGuiaPadre: padre,
      numeroGuiaHijo: hijos[index] || '',
    })).filter(aso => aso.numeroGuiaHijo !== '')

    if (asociaciones.length === 0) return

    try {
      const resultado = await asociarMutation.mutateAsync(asociaciones)
      setResultados(resultado.resultados)
    } catch (error) {
      // Error handled
    }
  }

  const handleCerrar = () => {
    setListaPadres('')
    setListaHijos('')
    setResultados(null)
    onOpenChange(false)
  }

  const padres = parseGuias(listaPadres)
  const hijos = parseGuias(listaHijos)
  const asociacionesPrevistas = Math.min(padres.length, hijos.length)
  const hayContenido = padres.length > 0 && hijos.length > 0

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <PackagePlus className="h-4 w-4" />
            </div>
            Asociar CLEMENTINA por Lotes
          </DialogTitle>
          <DialogDescription>
            Vincula masivamente paquetes Padre (Clementina) con sus Hijos mediante listas ordenadas.
          </DialogDescription>
        </DialogHeader>

        {!resultados ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column 1: Parents */}
                <div className="space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lista-padres" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paquetes Padre (Clementina)</Label>
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{padres.length} detectados</span>
                  </div>
                  <Textarea
                    id="lista-padres"
                    placeholder={`Pegar lista de guías aquí...\nECA7800100028\nECA7800100029`}
                    value={listaPadres}
                    onChange={(e) => setListaPadres(e.target.value)}
                    className="font-mono text-xs flex-1 min-h-[300px] resize-none border-dashed focus:border-solid bg-muted/20"
                  />
                </div>

                {/* Column 2: Children */}
                <div className="space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lista-hijos" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paquetes Hijo</Label>
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{hijos.length} detectados</span>
                  </div>
                  <Textarea
                    id="lista-hijos"
                    placeholder={`Pegar lista de guías aquí...\nECA7800082012\nECA7800082013`}
                    value={listaHijos}
                    onChange={(e) => setListaHijos(e.target.value)}
                    className="font-mono text-xs flex-1 min-h-[300px] resize-none border-dashed focus:border-solid bg-muted/20"
                  />
                </div>
              </div>

              {/* Preview Section */}
              {hayContenido && (
                <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" /> Vista Previa
                    </h4>
                    <span className="text-xs text-muted-foreground">Se vincularán <strong className="text-foreground">{asociacionesPrevistas}</strong> pares</span>
                  </div>

                  <div className="max-h-[150px] overflow-y-auto border rounded-md bg-background">
                    <Table>
                      <TableHeader className="bg-muted/40 sticky top-0">
                        <TableRow className="h-8">
                          <TableHead className="h-8 text-xs w-12 text-center">#</TableHead>
                          <TableHead className="h-8 text-xs">Padre</TableHead>
                          <TableHead className="h-8 text-xs">Hijo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: asociacionesPrevistas }).map((_, index) => (
                          <TableRow key={index} className="h-8 hover:bg-muted/30">
                            <TableCell className="py-1 text-center text-xs text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="py-1 text-xs font-mono">{padres[index]}</TableCell>
                            <TableCell className="py-1 text-xs font-mono">{hijos[index]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex gap-4 text-xs">
                    {padres.length > hijos.length && (
                      <span className="text-warning flex items-center gap-1">
                        ⚠ {padres.length - hijos.length} padres sobrantes (sin hijo)
                      </span>
                    )}
                    {hijos.length > padres.length && (
                      <span className="text-warning flex items-center gap-1">
                        ⚠ {hijos.length - padres.length} hijos sobrantes (sin padre)
                      </span>
                    )}
                  </div>
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
                ) : 'Confirmar Asociación'}
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
                <div className="flex-1 overflow-auto relative">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Padre</TableHead>
                        <TableHead>Hijo</TableHead>
                        <TableHead className="w-24 text-center">Estado</TableHead>
                        <TableHead>Mensaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-center text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{resultado.numeroGuiaPadre}</TableCell>
                          <TableCell className="font-mono text-xs">{resultado.numeroGuiaHijo}</TableCell>
                          <TableCell className="text-center">
                            {resultado.exito ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-error mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className={cn("text-xs", resultado.exito ? 'text-success' : 'text-error')}>
                            {resultado.mensaje}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Espaciador para asegurar que el último elemento no quede pegado al borde si es necesario */}
                      <TableRow className="h-2 hover:bg-transparent border-0">
                        <TableCell colSpan={5} className="p-0"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
              <Button variant="outline" onClick={handleCerrar}>Cerrar</Button>
              <Button onClick={() => {
                setResultados(null)
                setListaPadres('')
                setListaHijos('')
              }}>
                Nueva Asociación
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
