import { useState, useEffect, useMemo } from 'react'
import { usePermisos } from '@/hooks/usePermisos'
import { usePermisosRol, useAsignarPermisosRol } from '@/hooks/useRoles'
import { Button } from '@/components/ui/button'
import { CheckboxIndicator } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Key, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AsignarPermisosDialogProps {
  rolId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AsignarPermisosDialog({
  rolId,
  open,
  onOpenChange,
}: AsignarPermisosDialogProps) {
  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([])
  const [busqueda, setBusqueda] = useState('')
  const { data: permisosData } = usePermisos(0, 100)
  const { data: permisosActuales } = usePermisosRol(open && rolId ? rolId : undefined)
  const asignarMutation = useAsignarPermisosRol()

  useEffect(() => {
    if (permisosActuales) {
      setSelectedPermisos(permisosActuales)
    }
  }, [permisosActuales, open])

  const permisos = permisosData?.content || []
  const permisosFiltrados = permisos.filter((p) => {
    if (busqueda && !p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
      !p.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) &&
      !p.recurso?.toLowerCase().includes(busqueda.toLowerCase())) {
      return false
    }
    return true
  })

  const permisosPorRecurso = useMemo(() => {
    return permisosFiltrados.reduce((acc, permiso) => {
      const recurso = permiso.recurso || 'Otros'
      if (!acc[recurso]) {
        acc[recurso] = []
      }
      acc[recurso].push(permiso)
      return acc
    }, {} as Record<string, typeof permisosFiltrados>)
  }, [permisosFiltrados])

  const handleTogglePermiso = (idPermiso: number) => {
    setSelectedPermisos((prev) =>
      prev.includes(idPermiso)
        ? prev.filter((id) => id !== idPermiso)
        : [...prev, idPermiso]
    )
  }

  const handleSelectAllInRecurso = (recurso: string) => {
    const permisosRecurso = permisosPorRecurso[recurso] || []
    const todosSeleccionados = permisosRecurso.every(p => selectedPermisos.includes(p.idPermiso!))

    if (todosSeleccionados) {
      setSelectedPermisos(prev => prev.filter(id => !permisosRecurso.some(p => p.idPermiso === id)))
    } else {
      const nuevosIds = permisosRecurso.map(p => p.idPermiso!).filter(id => !selectedPermisos.includes(id))
      setSelectedPermisos(prev => [...prev, ...nuevosIds])
    }
  }

  const handleSelectAll = () => {
    if (selectedPermisos.length === permisosFiltrados.length) {
      setSelectedPermisos([])
    } else {
      setSelectedPermisos(permisosFiltrados.map(p => p.idPermiso!))
    }
  }

  const handleSubmit = async () => {
    try {
      await asignarMutation.mutateAsync({
        id: rolId,
        permisos: selectedPermisos,
      })
      setBusqueda('')
      onOpenChange(false)
    } catch { /* hook */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 rounded-2xl border-border/50 max-h-[80vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
              <Key className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Asignar Permisos</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedPermisos.length > 0
                  ? `${selectedPermisos.length} permiso${selectedPermisos.length > 1 ? 's' : ''} seleccionado${selectedPermisos.length > 1 ? 's' : ''}`
                  : 'Selecciona los permisos para este rol'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border/20 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              placeholder="Buscar por nombre, descripción o recurso..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-8 bg-muted/30 border-border/30 text-xs rounded-lg"
            />
          </div>
          {Object.keys(permisosPorRecurso).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-[10px] whitespace-nowrap rounded-lg"
            >
              {selectedPermisos.length === permisosFiltrados.length ? 'Deseleccionar' : 'Seleccionar todos'}
            </Button>
          )}
        </div>

        {/* Permissions List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {Object.keys(permisosPorRecurso).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No se encontraron permisos</p>
                {busqueda && <p className="text-xs mt-1">Intenta con otros términos</p>}
              </div>
            ) : (
              Object.entries(permisosPorRecurso).map(([recurso, permisosRecurso]) => {
                const todosSeleccionados = permisosRecurso.every(p => selectedPermisos.includes(p.idPermiso!))

                return (
                  <div key={recurso} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-amber-500" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{recurso}</h4>
                        <span className="text-[10px] text-muted-foreground">({permisosRecurso.length})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAllInRecurso(recurso)}
                        className="h-6 text-[10px] px-2 rounded-md"
                      >
                        {todosSeleccionados ? 'Quitar' : 'Todos'}
                      </Button>
                    </div>
                    <div className="space-y-1 pl-5 border-l-2 border-border/30">
                      {permisosRecurso.map((permiso) => {
                        const isSelected = selectedPermisos.includes(permiso.idPermiso!)
                        return (
                          <div
                            key={permiso.idPermiso}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleTogglePermiso(permiso.idPermiso!)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleTogglePermiso(permiso.idPermiso!)
                              }
                            }}
                            className={cn(
                              "flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-150 select-none border border-transparent",
                              isSelected && "bg-primary/5 hover:bg-primary/10 border-primary/20"
                            )}
                          >
                            <CheckboxIndicator checked={isSelected} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Key className="h-3 w-3 text-blue-500 shrink-0" />
                                <p className="text-sm font-semibold">{permiso.nombre}</p>
                              </div>
                              {permiso.descripcion && (
                                <p className="text-xs text-muted-foreground mt-1 pl-5">{permiso.descripcion}</p>
                              )}
                              {permiso.accion && (
                                <div className="pl-5 mt-1.5">
                                  <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                    {permiso.accion}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-border/20 bg-muted/5 text-xs text-muted-foreground shrink-0 flex items-center justify-between">
          <span>
            {selectedPermisos.length > 0 ? (
              <span className="font-medium text-foreground">
                {selectedPermisos.length} permiso{selectedPermisos.length !== 1 ? 's' : ''} seleccionado{selectedPermisos.length !== 1 ? 's' : ''}
              </span>
            ) : (
              'Ningún permiso seleccionado'
            )}
          </span>
          <span>{permisosFiltrados.length} disponible{permisosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border/20 bg-muted/5 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={asignarMutation.isPending}
            className="rounded-lg"
          >
            {asignarMutation.isPending ? 'Asignando...' : 'Asignar Permisos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
