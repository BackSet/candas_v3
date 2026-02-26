import { useState, useEffect, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Paquete } from '@/types/paquete'
import { TipoDestino } from '@/types/paquete'
import type { Agencia } from '@/types/agencia'
import type { GrupoPersonalizadoLocal } from '@/hooks/useGruposPersonalizadosLocal'
import { generarExcelClementinaHijos } from '@/utils/generarExcelLoteRecepcion'
import { FileSpreadsheet, Download } from 'lucide-react'
import { DateTimePickerForm } from '@/components/ui/date-time-picker'
import { toast } from 'sonner'

interface PaquetesPorGrupoPersonalizado {
  [grupoPersonalizado: string]: Paquete[]
}

interface PaquetesPorTipoDestino {
  [tipoDestino: string]: PaquetesPorGrupoPersonalizado
}

interface PaquetesPorSubRef {
  [subRefKey: string]: PaquetesPorTipoDestino
}

interface PaquetesPorBucket {
  [bucketKey: string]: PaquetesPorSubRef
}

interface PaquetesPorCanton {
  [canton: string]: PaquetesPorBucket
}

interface PaquetesPorCiudad {
  [ciudad: string]: PaquetesPorCanton
}

interface ExportarClementinaHijosDialogProps {
  paquetes: Paquete[]
  numeroRecepcion?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  agencias?: Agencia[]
  paquetesAgrupados: PaquetesPorCiudad
  paqueteAGrupoPersonalizado: Map<number, GrupoPersonalizadoLocal>
}

export default function ExportarClementinaHijosDialog({
  paquetes,
  numeroRecepcion,
  open,
  onOpenChange,
  agencias = [],
  paquetesAgrupados,
  paqueteAGrupoPersonalizado,
}: ExportarClementinaHijosDialogProps) {
  // Obtener fecha y hora actual en formato datetime-local (YYYY-MM-DDTHH:mm)
  const obtenerFechaHoraActual = () => {
    const ahora = new Date()
    const año = ahora.getFullYear()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    return `${año}-${mes}-${dia}T${horas}:${minutos}`
  }

  const [fechaHora, setFechaHora] = useState(obtenerFechaHoraActual())
  const [tipoDestino, setTipoDestino] = useState<'todos' | TipoDestino>('todos')
  const [idAgencia, setIdAgencia] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Inicializar valores por defecto cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setFechaHora(obtenerFechaHoraActual())
      setTipoDestino('todos')
      setIdAgencia('')
    }
  }, [open])

  // Obtener agencias disponibles para el destino AGENCIA
  const agenciasDisponibles = useMemo(() => {
    if (!agencias || tipoDestino !== TipoDestino.AGENCIA) return []
    const idsAgencias = new Set<number>()
    paquetes
      .filter(p => p.tipoDestino === TipoDestino.AGENCIA && p.idAgenciaDestino)
      .forEach(p => {
        if (p.idAgenciaDestino) idsAgencias.add(p.idAgenciaDestino)
      })
    return agencias.filter(a => idsAgencias.has(a.idAgencia!))
  }, [paquetes, agencias, tipoDestino])

  // Calcular paquetes que se exportarán según los filtros
  const paquetesAExportar = useMemo(() => {
    let paquetesFiltrados = paquetes.filter((p) => p.numeroGuia && p.numeroGuia.trim() !== '')

    if (tipoDestino === TipoDestino.AGENCIA) {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoDestino === TipoDestino.AGENCIA)
      // Filtrar por agencia específica si se seleccionó
      if (idAgencia) {
        const idAgenciaNum = Number(idAgencia)
        paquetesFiltrados = paquetesFiltrados.filter(p => p.idAgenciaDestino === idAgenciaNum)
      }
    } else if (tipoDestino === TipoDestino.DOMICILIO) {
      paquetesFiltrados = paquetesFiltrados.filter(p => p.tipoDestino === TipoDestino.DOMICILIO)
    }
    // Si es 'todos', no filtrar por tipoDestino

    return paquetesFiltrados
  }, [paquetes, tipoDestino, idAgencia])

  const handleGenerar = () => {
    // Validar campo
    if (!fechaHora) {
      toast.error('Por favor, completa la fecha y la hora')
      return
    }

    // Extraer fecha y hora del valor datetime-local
    const [fecha, hora] = fechaHora.split('T')
    if (!fecha || !hora) {
      toast.error('Por favor, completa la fecha y la hora correctamente')
      return
    }

    if (paquetesAExportar.length === 0) {
      toast.error('No hay paquetes que coincidan con los filtros seleccionados')
      return
    }

    // Validar que si es AGENCIA, se haya seleccionado una agencia
    if (tipoDestino === TipoDestino.AGENCIA && !idAgencia) {
      toast.error('Por favor, selecciona una agencia')
      return
    }

    setIsGenerating(true)

    try {
      generarExcelClementinaHijos(
        paquetesAExportar,
        fecha,
        hora,
        numeroRecepcion,
        tipoDestino === 'todos' ? undefined : tipoDestino,
        idAgencia ? Number(idAgencia) : undefined,
        paquetesAgrupados,
        paqueteAGrupoPersonalizado
      )

      toast.success(`Excel de CLEMENTINA hijos generado exitosamente con ${paquetesAExportar.length} paquete(s)`)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el archivo Excel')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar CLEMENTINA Hijos
          </DialogTitle>
          <DialogDescription>
            Exporta los paquetes hijos de CLEMENTINA filtrados por tipo de distribución
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fechaHora">Fecha y Hora</Label>
            <DateTimePickerForm
              id="fechaHora"
              value={fechaHora}
              onChange={setFechaHora}
              inline
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Distribución</Label>
            <Select
              value={tipoDestino}
              onValueChange={(value) => {
                setTipoDestino(value as 'todos' | TipoDestino)
                setIdAgencia('') // Limpiar agencia al cambiar tipo
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de distribución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value={TipoDestino.AGENCIA}>AGENCIA</SelectItem>
                <SelectItem value={TipoDestino.DOMICILIO}>DOMICILIO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoDestino === TipoDestino.AGENCIA && (
            <div className="space-y-2">
              <Label>Agencia</Label>
              <Select
                value={idAgencia}
                onValueChange={setIdAgencia}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agenciasDisponibles.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay agencias disponibles
                    </SelectItem>
                  ) : (
                    agenciasDisponibles.map((agencia) => (
                      <SelectItem key={agencia.idAgencia} value={agencia.idAgencia!.toString()}>
                        {agencia.nombre}{agencia.canton ? ` - ${agencia.canton}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="text-sm font-medium">Resumen</div>
            <div className="text-xs text-muted-foreground">
              Paquetes a exportar: <span className="font-semibold text-foreground">{paquetesAExportar.length}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerar}
            disabled={isGenerating || paquetesAExportar.length === 0}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
