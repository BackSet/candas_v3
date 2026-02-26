import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { toast } from 'sonner'
import { Loader2, RefreshCw, ListFilter } from 'lucide-react'
import type { GuiaListaEtiquetadaConsultaDTO } from '@/types/listas-etiquetadas'
import { Button } from '@/components/ui/button'

export default function GuiasEnVariasListasCard() {
  const [guias, setGuias] = useState<GuiaListaEtiquetadaConsultaDTO[]>([])
  const [cargando, setCargando] = useState(true)
  const [asignando, setAsignando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await listasEtiquetadasService.getGuiasEnVariasListas()
      setGuias(data ?? [])
    } catch {
      toast.error('Error al cargar guías en varias listas')
      setGuias([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function elegirLista(numeroGuia: string, etiqueta: string) {
    if (!numeroGuia || !etiqueta) return
    setAsignando(numeroGuia)
    try {
      await listasEtiquetadasService.elegirEtiqueta(numeroGuia, etiqueta)
      toast.success(`Guía ${numeroGuia} asignada a la lista ${etiqueta}.`)
      await cargar()
    } catch {
      toast.error('Error al asignar la lista')
    } finally {
      setAsignando(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Guías en varias listas</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={cargar}
            disabled={cargando}
          >
            {cargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="ml-1.5">Actualizar</span>
          </Button>
        </div>
        <CardDescription>
          Guías que aparecen en más de una lista. Elija a qué lista pertenece cada una.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : guias.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No hay guías en varias listas pendientes de asignar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de guía</TableHead>
                <TableHead>Listas en que está</TableHead>
                <TableHead className="w-[220px]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guias.map((item) => (
                <TableRow key={item.numeroGuia}>
                  <TableCell className="font-mono text-sm">{item.numeroGuia}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.etiquetas?.length ? item.etiquetas.join(', ') : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value=""
                      onValueChange={(etiqueta) => elegirLista(item.numeroGuia, etiqueta)}
                      disabled={asignando === item.numeroGuia}
                    >
                      <SelectTrigger className="w-[200px] h-8 text-xs">
                        <SelectValue placeholder="Elegir lista" />
                      </SelectTrigger>
                      <SelectContent>
                        {item.etiquetas?.map((et) => (
                          <SelectItem key={et} value={et}>
                            {et}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {asignando === item.numeroGuia && (
                      <Loader2 className="inline h-3.5 w-3.5 animate-spin ml-2 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
