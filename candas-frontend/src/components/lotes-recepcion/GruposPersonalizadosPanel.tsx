import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGruposPersonalizadosLocal, type GrupoPersonalizadoLocal } from '@/hooks/useGruposPersonalizadosLocal'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface GruposPersonalizadosPanelProps {
  loteRecepcionId?: number
  onCrearGrupo: (provincia?: string, canton?: string) => void
  onSeleccionarGrupo?: (grupo: GrupoPersonalizadoLocal) => void
  grupoSeleccionado?: string | null
  mostrarSimplificado?: boolean
}

export default function GruposPersonalizadosPanel({
  loteRecepcionId,
  onCrearGrupo,
  onSeleccionarGrupo,
  grupoSeleccionado,
  mostrarSimplificado = false,
}: GruposPersonalizadosPanelProps) {
  const { grupos, eliminarGrupo, obtenerEstructura, refrescarGrupos } = useGruposPersonalizadosLocal(loteRecepcionId)
  const [grupoAEliminar, setGrupoAEliminar] = useState<string | null>(null)

  const handleEliminar = () => {
    if (!grupoAEliminar) return
    eliminarGrupo(grupoAEliminar)
    setGrupoAEliminar(null)
    // refrescarGrupos se llama automáticamente en eliminarGrupo
  }

  const estructura = obtenerEstructura()
  
  // Refrescar cuando cambian los grupos
  useEffect(() => {
    refrescarGrupos()
  }, [grupos.length, refrescarGrupos])

  if (!loteRecepcionId) {
    return null
  }

  // Vista simplificada: solo mostrar si hay grupos y permitir seleccionar
  if (mostrarSimplificado) {
    if (grupos.length === 0) {
      return null // No mostrar nada si no hay grupos
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Grupos Personalizados</CardTitle>
          <CardDescription>
            Selecciona un grupo para resaltarlo en la tabla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {grupos.map((grupo) => (
              <Button
                key={grupo.id}
                variant={grupoSeleccionado === grupo.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSeleccionarGrupo?.(grupo)}
              >
                {grupo.nombre} ({grupo.provincia} {'>'} {grupo.canton})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grupos Personalizados</CardTitle>
              <CardDescription>
                Grupos de paquetes organizados por Provincia {'>'} Cantón (solo en esta sesión)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(estructura).length > 0 ? (
            <div className="space-y-4">
              {Object.keys(estructura).map((provincia) => (
                <div key={provincia} className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{provincia}</h4>
                  {Object.keys(estructura[provincia]).map((canton) => (
                    <div key={canton} className="ml-4 space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground">{canton}</h5>
                      {Object.values(estructura[provincia][canton]).map((grupo) => (
                        <div
                          key={grupo.id}
                          className={`flex items-center justify-between p-3 border rounded-md transition-colors ${
                            grupoSeleccionado === grupo.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => onSeleccionarGrupo?.(grupo)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{grupo.nombre}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {grupo.idPaquetes.length} paquete{grupo.idPaquetes.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {grupo.descripcion && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {grupo.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onSeleccionarGrupo?.(grupo)}
                              title={grupoSeleccionado === grupo.id ? 'Ocultar grupo' : 'Mostrar grupo'}
                            >
                              {grupoSeleccionado === grupo.id ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setGrupoAEliminar(grupo.id)}
                              title="Eliminar grupo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() => onCrearGrupo(provincia, canton)}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Grupo en {canton}
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay grupos personalizados creados</p>
              <p className="text-xs mt-2">Selecciona paquetes y crea un grupo desde el toolbar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!grupoAEliminar} onOpenChange={(open) => !open && setGrupoAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este grupo personalizado? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrupoAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminar}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
