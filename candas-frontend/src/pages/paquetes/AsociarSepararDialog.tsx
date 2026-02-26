import { useState } from 'react'
import { paqueteService } from '@/lib/api/paquete.service'
import { useCambiarTipoMasivo } from '@/hooks/usePaquetes'
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
import { Loader2, CheckCircle2, XCircle, PackageMinus } from 'lucide-react'
import { TipoPaquete } from '@/types/paquete'
import { parseGuias } from '@/utils/parseGuias'
import { ResultStatsGrid } from '@/components/dialogs/ResultStatsGrid'
import { cn } from '@/lib/utils'

interface ResultadoSeparar {
  numeroGuia: string
  exito: boolean
  mensaje: string
}

interface AsociarSepararDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AsociarSepararDialog({
  open,
  onOpenChange,
}: AsociarSepararDialogProps) {
  const [listaGuias, setListaGuias] = useState('')
  const [resultados, setResultados] = useState<ResultadoSeparar[] | null>(null)
  const [procesando, setProcesando] = useState(false)
  const cambiarTipoMasivo = useCambiarTipoMasivo()

  const handleProcesar = async () => {
    const guias = parseGuias(listaGuias)
    if (guias.length === 0) return

    setProcesando(true)
    setResultados(null)

    try {
      const resueltos = await Promise.allSettled(
        guias.map(async (guia) => {
          const paquete = await paqueteService.findByNumeroGuia(guia)
          return { numeroGuia: guia, paquete }
        })
      )

      const ids: number[] = []
      const resultadosParciales: ResultadoSeparar[] = []

      for (let i = 0; i < guias.length; i++) {
        const guia = guias[i]
        const r = resueltos[i]
        if (r.status === 'fulfilled' && r.value.paquete?.idPaquete) {
          ids.push(r.value.paquete.idPaquete)
          resultadosParciales.push({ numeroGuia: guia, exito: true, mensaje: 'Encontrado' })
        } else {
          const mensaje = r.status === 'rejected' ? (r.reason?.response?.data?.message ?? r.reason?.message ?? 'No encontrada') : 'No encontrada'
          resultadosParciales.push({ numeroGuia: guia, exito: false, mensaje })
        }
      }

      if (ids.length > 0) {
        await cambiarTipoMasivo.mutateAsync({ ids, nuevoTipo: TipoPaquete.SEPARAR })
        resultadosParciales.forEach((r, i) => {
          if (r.exito) r.mensaje = 'Marcado como SEPARAR'
        })
      }

      setResultados(resultadosParciales)
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al procesar'
      setResultados(
        parseGuias(listaGuias).map(guia => ({
          numeroGuia: guia,
          exito: false,
          mensaje: message,
        }))
      )
    } finally {
      setProcesando(false)
    }
  }

  const handleCerrar = () => {
    setListaGuias('')
    setResultados(null)
    onOpenChange(false)
  }

  const guias = parseGuias(listaGuias)
  const hayContenido = guias.length > 0

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <PackageMinus className="h-4 w-4" />
            </div>
            Marcar como Separar
          </DialogTitle>
          <DialogDescription>
            Ingrese la lista de guías a marcar como tipo SEPARAR. Cada guía se buscará y se actualizará su tipo.
          </DialogDescription>
        </DialogHeader>

        {!resultados ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lista-guias" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lista de guías a marcar como Separar
                  </Label>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {guias.length} detectados
                  </span>
                </div>
                <Textarea
                  id="lista-guias"
                  placeholder="Pegar lista de guías (una por línea o separadas por comas/espacios)..."
                  value={listaGuias}
                  onChange={(e) => setListaGuias(e.target.value)}
                  className="font-mono text-xs min-h-[200px] resize-none border-dashed focus:border-solid bg-muted/20"
                />
              </div>

              {hayContenido && (
                <div className="rounded-lg border border-border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">
                    Se marcarán <strong className="text-foreground">{guias.length}</strong> paquete(s) como SEPARAR.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/10">
              <Button variant="ghost" onClick={handleCerrar}>Cancelar</Button>
              <Button onClick={handleProcesar} disabled={!hayContenido || procesando}>
                {procesando ? (
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
                        <TableHead>Guía</TableHead>
                        <TableHead className="w-24 text-center">Estado</TableHead>
                        <TableHead>Mensaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-center text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{resultado.numeroGuia}</TableCell>
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
                setListaGuias('')
              }}>
                Nueva lista
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
