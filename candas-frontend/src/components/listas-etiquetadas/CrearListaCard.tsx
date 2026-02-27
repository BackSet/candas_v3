import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { listasEtiquetadasService } from '@/lib/api/listas-etiquetadas.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import { toast } from 'sonner'
import { Loader2, Plus, AlertTriangle, ShieldAlert, BadgeHelp, Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CrearListaCard() {
  const [etiqueta, setEtiqueta] = useState('')
  const [numerosGuia, setNumerosGuia] = useState('')
  const [instruccion, setInstruccion] = useState<string>('NINGUNA')
  const [creando, setCreando] = useState(false)

  const handleCrear = async () => {
    if (!etiqueta.trim()) {
      toast.error('Debes ingresar un nombre de etiqueta')
      return
    }

    if (!numerosGuia.trim()) {
      toast.error('Debes ingresar al menos un número de guía')
      return
    }

    // Parsear números de guía (pueden estar separados por comas, espacios o líneas)
    // Eliminar líneas vacías, convertir a mayúsculas y eliminar duplicados
    const guias = Array.from(
      new Set(
        numerosGuia
          .split(/[,\n\r]+/)
          .map(g => g.trim().toUpperCase())
          .filter(g => g.length > 0)
      )
    )

    if (guias.length === 0) {
      toast.error('No se encontraron números de guía válidos')
      return
    }

    // Verificar duplicados dentro de la lista antes de enviar
    const guiasSinDuplicados = Array.from(new Set(guias))
    if (guiasSinDuplicados.length !== guias.length) {
      const duplicados = guias.filter((g, index) => guias.indexOf(g) !== index)
      toast.error(`Se encontraron números de guía duplicados en la lista: ${duplicados.join(', ')}. Por favor, elimina los duplicados antes de continuar.`)
      return
    }

    setCreando(true)
    try {
      const etiquetaNormalizada = etiqueta.trim().toUpperCase()
      const resultado = await listasEtiquetadasService.createBatch({
        etiqueta: etiquetaNormalizada,
        numerosGuia: guias,
        instruccion: instruccion !== 'NINGUNA' ? instruccion : undefined,
      })

      const variasCount = resultado.guiasEnVariasListas?.length ?? 0
      let mensaje = `Lista "${etiqueta}" procesada: ${resultado.totalProcesados} guía(s)`

      if (instruccion !== 'NINGUNA') {
        mensaje += ` con instrucción ${instruccion}`
      }
      mensaje += '.'

      if (variasCount > 0) {
        toast.warning(
          `${variasCount} guía(s) están en varias listas. Indique a qué lista pertenece cada una en la pestaña "Guías en varias listas".`
        )
      }

      toast.success(mensaje)

      // Limpiar formulario
      setEtiqueta('')
      setNumerosGuia('')
      setInstruccion('NINGUNA')
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error, 'Error al crear la lista')
      // Si el backend indica que la guía ya está en otras listas, el mensaje ya incluye la sección "Guías en varias listas"
      if (errorMessage.includes('ya está registrada en la(s) lista(s)') || errorMessage.includes('Guías en varias listas')) {
        toast.error(errorMessage)
      } else if (errorMessage.includes('duplicado') || errorMessage.includes('duplicados')) {
        toast.error(`No se pueden guardar números de guía duplicados: ${errorMessage}`)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setCreando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Lista con Etiqueta</CardTitle>
        <CardDescription>
          Ingresa un nombre de etiqueta (ej: GEO, MIA) y pega los números de guía que deseas etiquetar.
          Puedes separar los números por comas, espacios o líneas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="etiqueta">Nombre de Etiqueta</Label>
          <Input
            id="etiqueta"
            placeholder="Ej: GEO, MIA, etc."
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            disabled={creando}
          />
          <div className="space-y-2 pt-2">
            <Label>Instrucción Especial (Opcional)</Label>
            <Select
              value={instruccion}
              onValueChange={(val) => setInstruccion(val)}
              disabled={creando}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una instrucción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NINGUNA">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span>Ninguna (Estándar)</span>
                  </div>
                </SelectItem>
                <SelectItem value="RETENER">
                  <div className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="font-bold">RETENER</span>
                  </div>
                </SelectItem>
                <SelectItem value="PREGUNTAR">
                  <div className="flex items-center gap-2 text-warning">
                    <BadgeHelp className="h-4 w-4" />
                    <span>PREGUNTAR</span>
                  </div>
                </SelectItem>
                <SelectItem value="ATENCION">
                  <div className="flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>ATENCIÓN</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Esta instrucción se mostrará resaltada al escanear los paquetes de esta lista.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numerosGuia">Números de Guía</Label>
          <Textarea
            id="numerosGuia"
            placeholder="Pega aquí los números de guía, separados por comas, espacios o líneas..."
            value={numerosGuia}
            onChange={(e) => setNumerosGuia(e.target.value)}
            disabled={creando}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {Array.from(new Set(numerosGuia.split(/[,\n\r]+/).map(g => g.trim().toUpperCase()).filter(g => g.length > 0))).length} número(s) de guía único(s) detectado(s)
          </p>
        </div>

        <Button onClick={handleCrear} disabled={creando} className="w-full">
          {creando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Crear Lista
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
