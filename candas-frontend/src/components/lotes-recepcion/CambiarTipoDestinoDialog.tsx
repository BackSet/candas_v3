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
import { useUpdatePaquete } from '@/hooks/usePaquetes'
import { useAgencias as useAgenciasApi } from '@/hooks/useAgencias'
import { useDestinatariosDirectos } from '@/hooks/useDestinatariosDirectos'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface CambiarTipoDestinoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paquete: Paquete
  onSuccess?: () => void
}

export default function CambiarTipoDestinoDialog({
  open,
  onOpenChange,
  paquete,
  onSuccess,
}: CambiarTipoDestinoDialogProps) {
  const [nuevoTipoDestino, setNuevoTipoDestino] = useState<TipoDestino | null>(null)
  const [nuevoIdAgenciaDestino, setNuevoIdAgenciaDestino] = useState<number | null>(null)
  const [nuevoIdDestinatarioDirecto, setNuevoIdDestinatarioDirecto] = useState<number | null>(null)
  const updatePaqueteMutation = useUpdatePaquete()
  const { data: agenciasPage, isLoading: loadingAgencias } = useAgenciasApi(0, 1000)
  const { data: destinatarios = [], isLoading: loadingDestinatarios } = useDestinatariosDirectos()
  const queryClient = useQueryClient()

  const agencias = useMemo(() => {
    return (agenciasPage?.content || []).filter((a) => a.activa !== false && !!a.idAgencia)
  }, [agenciasPage])

  const ciudadObjetivo = useMemo(() => {
    const ciudad = (paquete.ciudadDestinatario || '').trim()
    return ciudad ? ciudad.toLowerCase() : null
  }, [paquete.ciudadDestinatario])

  const agenciaRecomendadaId = useMemo(() => {
    if (!ciudadObjetivo) return null
    const match = agencias
      .slice()
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
      .find((a) => (a.ciudad || '').trim().toLowerCase() === ciudadObjetivo)
    return match?.idAgencia ?? null
  }, [agencias, ciudadObjetivo])

  const destinatarioRecomendadoId = useMemo(() => {
    if (!ciudadObjetivo) return null
    const match = (destinatarios || [])
      .filter((d) => d.activo !== false && !!d.idDestinatarioDirecto)
      .slice()
      .sort((a, b) => (a.nombreDestinatario || '').localeCompare(b.nombreDestinatario || ''))
      .find((d) => (d.ciudad || '').trim().toLowerCase() === ciudadObjetivo)
    return match?.idDestinatarioDirecto ?? null
  }, [destinatarios, ciudadObjetivo])

  // Resetear estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setNuevoTipoDestino(paquete.tipoDestino || null)
      setNuevoIdAgenciaDestino(paquete.idAgenciaDestino || null)
      setNuevoIdDestinatarioDirecto(paquete.idDestinatarioDirecto || null)
    }
  }, [open, paquete.tipoDestino, paquete.idAgenciaDestino, paquete.idDestinatarioDirecto])

  // Auto-seleccionar recomendada cuando se elige AGENCIA (si no hay una ya seleccionada)
  useEffect(() => {
    if (!open) return
    if (nuevoTipoDestino !== TipoDestino.AGENCIA) return
    if (nuevoIdAgenciaDestino) return
    if (!agenciaRecomendadaId) return
    setNuevoIdAgenciaDestino(agenciaRecomendadaId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nuevoTipoDestino, agenciaRecomendadaId])

  useEffect(() => {
    if (!open) return
    if (nuevoTipoDestino !== TipoDestino.DOMICILIO) return
    if (nuevoIdDestinatarioDirecto) return
    if (!destinatarioRecomendadoId) return
    setNuevoIdDestinatarioDirecto(destinatarioRecomendadoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nuevoTipoDestino, destinatarioRecomendadoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paquete.idPaquete) {
      return
    }

    // Validar que si el tipo es AGENCIA, se debe seleccionar una agencia
    if (nuevoTipoDestino === TipoDestino.AGENCIA && !nuevoIdAgenciaDestino) {
      toast.error('Debe seleccionar una agencia cuando el tipo destino es AGENCIA')
      return
    }

    // No hacer nada si el tipo y la asignación no cambiaron
    if (
      nuevoTipoDestino === paquete.tipoDestino &&
      nuevoIdAgenciaDestino === paquete.idAgenciaDestino &&
      nuevoIdDestinatarioDirecto === (paquete.idDestinatarioDirecto || null)
    ) {
      onOpenChange(false)
      return
    }

    try {
      // Crear objeto con solo tipoDestino - no incluir idAgenciaDestino
      // El backend limpiará automáticamente la agencia cuando tipoDestino es DOMICILIO
      const dataToUpdate: Partial<Paquete> = {
        tipoDestino: nuevoTipoDestino ?? undefined,
      }

      // Solo incluir idAgenciaDestino si el tipo es AGENCIA y se seleccionó una agencia
      if (nuevoTipoDestino === TipoDestino.AGENCIA && nuevoIdAgenciaDestino) {
        dataToUpdate.idAgenciaDestino = nuevoIdAgenciaDestino
      }
      // Para DOMICILIO, no incluir idAgenciaDestino - el backend lo limpiará automáticamente
      if (nuevoTipoDestino === TipoDestino.DOMICILIO && nuevoIdDestinatarioDirecto) {
        dataToUpdate.idDestinatarioDirecto = nuevoIdDestinatarioDirecto
      }

      // Asegurar que el objeto tenga al menos un campo para que el backend lo acepte
      if (!dataToUpdate.tipoDestino) {
        toast.error('Debe seleccionar un tipo destino')
        return
      }

      await updatePaqueteMutation.mutateAsync({
        id: paquete.idPaquete!,
        dto: dataToUpdate as Paquete,
      })

      // Invalidar todas las queries relacionadas para actualizar la UI
      // Invalidar todas las queries de lote-recepcion-paquetes (con cualquier ID)
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion-paquetes'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['paquete', paquete.idPaquete] })
      queryClient.invalidateQueries({ queryKey: ['lote-recepcion'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['paquetes'] })

      toast.success('Tipo destino actualizado correctamente')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Error al actualizar el tipo destino')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const tiposDestinoDisponibles: TipoDestino[] = [
    TipoDestino.AGENCIA,
    TipoDestino.DOMICILIO,
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Tipo Destino</DialogTitle>
          <DialogDescription>
            Cambiar el tipo destino del paquete {paquete.numeroGuia || `ID: ${paquete.idPaquete}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo Actual</Label>
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
              {paquete.tipoDestino || 'Sin asignar'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nuevo Tipo Destino</Label>
            <Select
              value={nuevoTipoDestino || ''}
              onValueChange={(value) => {
                const destino = value as TipoDestino
                setNuevoTipoDestino(destino)
                // Si cambia a DOMICILIO, limpiar la agencia
                if (destino === TipoDestino.DOMICILIO) {
                  setNuevoIdAgenciaDestino(null)
                } else if (destino === TipoDestino.AGENCIA) {
                  setNuevoIdDestinatarioDirecto(null)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo destino" />
              </SelectTrigger>
              <SelectContent>
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
                onValueChange={(value) => {
                  setNuevoIdAgenciaDestino(value === '' ? null : Number(value))
                }}
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
                  Debe seleccionar una agencia cuando el tipo destino es AGENCIA
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
                (nuevoTipoDestino === paquete.tipoDestino &&
                  nuevoIdAgenciaDestino === paquete.idAgenciaDestino &&
                  nuevoIdDestinatarioDirecto === (paquete.idDestinatarioDirecto || null)) ||
                updatePaqueteMutation.isPending ||
                (nuevoTipoDestino === TipoDestino.AGENCIA && !nuevoIdAgenciaDestino)
              }
            >
              {updatePaqueteMutation.isPending ? 'Cambiando...' : 'Cambiar Tipo Destino'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}