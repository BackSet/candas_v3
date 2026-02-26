import React, { useMemo, useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TipoDestino, type Paquete } from '@/types/paquete'
import { Badge } from '@/components/ui/badge'
import { useUpdatePaquete } from '@/hooks/usePaquetes'
import { toast } from 'sonner'
import { useAgencias } from '@/hooks/useAgencias'
import { useDestinatariosDirectos } from '@/hooks/useDestinatariosDirectos'

interface CambiarTipoDestinoMasivoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paquetes: Paquete[]
  onSuccess?: () => void
}

export default function CambiarTipoDestinoMasivoDialog({
  open,
  onOpenChange,
  paquetes,
  onSuccess,
}: CambiarTipoDestinoMasivoDialogProps) {
  const [nuevoTipoDestino, setNuevoTipoDestino] = useState<TipoDestino | '' | null>(null)
  const [nuevoIdAgenciaDestino, setNuevoIdAgenciaDestino] = useState<number | null>(null)
  const [nuevoIdDestinatarioDirecto, setNuevoIdDestinatarioDirecto] = useState<number | null>(null)
  const updatePaqueteMutation = useUpdatePaquete()
  const { data: agenciasPage, isLoading: loadingAgencias } = useAgencias(0, 1000)
  const { data: destinatarios = [], isLoading: loadingDestinatarios } = useDestinatariosDirectos()

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setNuevoTipoDestino(null)
      setNuevoIdAgenciaDestino(null)
      setNuevoIdDestinatarioDirecto(null)
    }
  }, [open])

  const agencias = useMemo(() => {
    return (agenciasPage?.content || []).filter((a) => a.activa !== false && !!a.idAgencia)
  }, [agenciasPage])

  // Ciudad recomendada: la más frecuente en los paquetes seleccionados
  const ciudadRecomendada = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const p of paquetes) {
      const ciudad = (p.ciudadDestinatario || '').trim()
      if (!ciudad) continue
      const key = ciudad.toLowerCase()
      conteo.set(key, (conteo.get(key) || 0) + 1)
    }
    let bestKey: string | null = null
    let bestCount = 0
    for (const [k, c] of conteo.entries()) {
      if (c > bestCount) {
        bestKey = k
        bestCount = c
      }
    }
    return bestKey
  }, [paquetes])

  const agenciaRecomendadaId = useMemo(() => {
    if (!ciudadRecomendada) return null
    const match = agencias
      .slice()
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
      .find((a) => (a.ciudad || '').trim().toLowerCase() === ciudadRecomendada)
    return match?.idAgencia ?? null
  }, [agencias, ciudadRecomendada])

  const destinatarioRecomendadoId = useMemo(() => {
    if (!ciudadRecomendada) return null
    const match = (destinatarios || [])
      .filter((d) => d.activo !== false && !!d.idDestinatarioDirecto)
      .slice()
      .sort((a, b) => (a.nombreDestinatario || '').localeCompare(b.nombreDestinatario || ''))
      .find((d) => (d.ciudad || '').trim().toLowerCase() === ciudadRecomendada)
    return match?.idDestinatarioDirecto ?? null
  }, [destinatarios, ciudadRecomendada])

  // Auto-seleccionar agencia recomendada al pasar a AGENCIA (si el usuario no eligió una)
  useEffect(() => {
    if (nuevoTipoDestino !== TipoDestino.AGENCIA) return
    if (nuevoIdAgenciaDestino) return
    if (!agenciaRecomendadaId) return
    setNuevoIdAgenciaDestino(agenciaRecomendadaId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevoTipoDestino, agenciaRecomendadaId])

  // Auto-seleccionar destinatario recomendado al pasar a DOMICILIO (si el usuario no eligió uno)
  useEffect(() => {
    if (nuevoTipoDestino !== TipoDestino.DOMICILIO) return
    if (nuevoIdDestinatarioDirecto) return
    if (!destinatarioRecomendadoId) return
    setNuevoIdDestinatarioDirecto(destinatarioRecomendadoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevoTipoDestino, destinatarioRecomendadoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const tipoDestino =
      nuevoTipoDestino === '' || nuevoTipoDestino === null ? undefined : (nuevoTipoDestino as TipoDestino)

    if (nuevoTipoDestino === TipoDestino.AGENCIA && !nuevoIdAgenciaDestino) {
      toast.error('Debe seleccionar una agencia destino')
      return
    }

    const ids = paquetes
      .map(p => p.idPaquete)
      .filter((id): id is number => id !== undefined)

    if (ids.length === 0) {
      return
    }

    try {
      // Actualizar cada paquete
      const promises = ids.map((id) => {
        if (!id) return Promise.resolve()
        const dataToUpdate: Partial<Paquete> = {
          tipoDestino,
        }

        if (tipoDestino === TipoDestino.AGENCIA && nuevoIdAgenciaDestino) {
          dataToUpdate.idAgenciaDestino = nuevoIdAgenciaDestino
        }
        if (tipoDestino === TipoDestino.DOMICILIO && nuevoIdDestinatarioDirecto) {
          dataToUpdate.idDestinatarioDirecto = nuevoIdDestinatarioDirecto
        }

        return updatePaqueteMutation.mutateAsync({
          id,
          dto: dataToUpdate as Paquete,
        })
      })

      await Promise.all(promises)

      toast.success(`Se actualizó el destino de ${ids.length} paquete${ids.length !== 1 ? 's' : ''}`)

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('No se pudo actualizar el destino de los paquetes')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const tiposDestinoDisponibles: TipoDestino[] = [
    TipoDestino.AGENCIA,
    TipoDestino.DOMICILIO,
  ]

  // Agrupar paquetes por destino actual
  const paquetesPorDestino = paquetes.reduce((acc, paquete) => {
    const destino = paquete.tipoDestino || 'Sin asignar'
    if (!acc[destino]) {
      acc[destino] = []
    }
    acc[destino].push(paquete)
    return acc
  }, {} as Record<string, Paquete[]>)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Destino Potencial de Paquetes</DialogTitle>
          <DialogDescription>
            Cambiar el destino potencial de {paquetes.length} paquete{paquetes.length !== 1 ? 's' : ''} seleccionado{paquetes.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Destinos Actuales</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(paquetesPorDestino).map(([destino, paquetesDestino]) => (
                <div key={destino} className="flex items-center justify-between text-sm bg-muted/30 px-3 py-2 rounded-md">
                  <span className="text-muted-foreground">{destino}</span>
                  <Badge variant="secondary">{paquetesDestino.length}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nuevo Destino Potencial</Label>
            <Select
              value={nuevoTipoDestino === null ? 'SIN_DESTINO' : nuevoTipoDestino}
              onValueChange={(value) => {
                if (value === 'SIN_DESTINO') {
                  setNuevoTipoDestino(null)
                  setNuevoIdAgenciaDestino(null)
                  setNuevoIdDestinatarioDirecto(null)
                } else {
                  const destino = value as TipoDestino
                  setNuevoTipoDestino(destino)
                  if (destino === TipoDestino.DOMICILIO) {
                    setNuevoIdAgenciaDestino(null)
                    // Mantener/auto-seleccionar destinatario
                  } else if (destino === TipoDestino.AGENCIA) {
                    setNuevoIdDestinatarioDirecto(null)
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIN_DESTINO">Sin destino</SelectItem>
                {tiposDestinoDisponibles.map((destino) => (
                  <SelectItem key={destino} value={destino}>
                    {destino}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nuevoTipoDestino === TipoDestino.AGENCIA && (
            <div className="space-y-2">
              <Label>
                Agencia Destino <span className="text-destructive">*</span>
              </Label>
              <Select
                value={nuevoIdAgenciaDestino?.toString() || ''}
                onValueChange={(value) => setNuevoIdAgenciaDestino(value ? Number(value) : null)}
                disabled={loadingAgencias}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencias.map((agencia) => {
                    const id = agencia.idAgencia!
                    const esRecomendada = agenciaRecomendadaId === id
                    return (
                      <SelectItem key={id} value={id.toString()}>
                        <div className="flex items-center gap-2 max-w-[320px]">
                          <span className="text-sm truncate block" title={`${agencia.nombre}${agencia.canton ? ` — ${agencia.canton}` : ''}`}>
                            {agencia.nombre}
                            {agencia.canton ? ` — ${agencia.canton}` : ''}
                          </span>
                          {esRecomendada && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                              Recomendada
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {!nuevoIdAgenciaDestino && (
                <p className="text-xs text-destructive">
                  Debe seleccionar una agencia cuando el destino es AGENCIA
                </p>
              )}
            </div>
          )}

          {nuevoTipoDestino === TipoDestino.DOMICILIO && (
            <div className="space-y-2">
              <Label>Destinatario Directo (opcional)</Label>
              <Select
                value={nuevoIdDestinatarioDirecto?.toString() || 'none'}
                onValueChange={(value) =>
                  setNuevoIdDestinatarioDirecto(value === 'none' ? null : Number(value))
                }
                disabled={loadingDestinatarios}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un destinatario directo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin destinatario (opcional)</SelectItem>
                  {(destinatarios || [])
                    .filter((d) => d.activo !== false && !!d.idDestinatarioDirecto)
                    .map((d) => {
                      const id = d.idDestinatarioDirecto!
                      const esRecomendado = destinatarioRecomendadoId === id
                      return (
                        <SelectItem key={id} value={id.toString()}>
                          <div className="flex items-center gap-2 max-w-[320px]">
                            <span className="text-sm truncate block" title={`${d.nombreDestinatario}${d.ciudad ? ` — ${d.ciudad}` : ''}`}>
                              {d.nombreDestinatario}
                              {d.ciudad ? ` — ${d.ciudad}` : ''}
                            </span>
                            {esRecomendado && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                Recomendada
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updatePaqueteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                updatePaqueteMutation.isPending ||
                (nuevoTipoDestino === TipoDestino.AGENCIA && !nuevoIdAgenciaDestino)
              }
            >
              {updatePaqueteMutation.isPending ? 'Cambiando...' : `Cambiar Destino (${paquetes.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
