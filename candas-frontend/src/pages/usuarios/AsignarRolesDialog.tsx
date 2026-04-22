import { useState, useEffect } from 'react'
import { useRoles } from '@/hooks/useRoles'
import { useRolesUsuario, useAsignarRolesUsuario } from '@/hooks/useUsuarios'
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
import { Search, Shield, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AsignarRolesDialogProps {
  usuarioId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AsignarRolesDialog({
  usuarioId,
  open,
  onOpenChange,
}: AsignarRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [busqueda, setBusqueda] = useState('')
  const { data: rolesData } = useRoles({ page: 0, size: 100 })
  const { data: rolesActuales } = useRolesUsuario(usuarioId)
  const asignarMutation = useAsignarRolesUsuario()

  useEffect(() => {
    if (rolesActuales) {
      setSelectedRoles(rolesActuales)
    }
  }, [rolesActuales, open])

  const roles = rolesData?.content || []
  const rolesFiltrados = roles.filter((r) => {
    if (busqueda && !r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
      !r.descripcion?.toLowerCase().includes(busqueda.toLowerCase())) {
      return false
    }
    return true
  })

  const handleToggleRol = (idRol: number) => {
    setSelectedRoles((prev) =>
      prev.includes(idRol)
        ? prev.filter((id) => id !== idRol)
        : [...prev, idRol]
    )
  }

  const handleSelectAll = () => {
    if (selectedRoles.length === rolesFiltrados.length) {
      setSelectedRoles([])
    } else {
      setSelectedRoles(rolesFiltrados.map(r => r.idRol!))
    }
  }

  const handleSubmit = async () => {
    try {
      await asignarMutation.mutateAsync({
        id: usuarioId,
        roles: selectedRoles,
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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
              <UserCog className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Asignar Roles</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedRoles.length > 0
                  ? `${selectedRoles.length} rol${selectedRoles.length > 1 ? 'es' : ''} seleccionado${selectedRoles.length > 1 ? 's' : ''}`
                  : 'Selecciona los roles para este usuario'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border/20 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-8 bg-muted/30 border-border/30 text-xs rounded-lg"
            />
          </div>
          {rolesFiltrados.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-[10px] whitespace-nowrap rounded-lg"
            >
              {selectedRoles.length === rolesFiltrados.length ? 'Deseleccionar' : 'Seleccionar todos'}
            </Button>
          )}
        </div>

        {/* Roles List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-1.5">
            {rolesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No se encontraron roles</p>
                {busqueda && <p className="text-xs mt-1">Intenta con otros términos</p>}
              </div>
            ) : (
              rolesFiltrados.map((rol) => {
                const isSelected = selectedRoles.includes(rol.idRol!)
                return (
                  <div
                    key={rol.idRol}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggleRol(rol.idRol!)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleToggleRol(rol.idRol!)
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-150 select-none border border-transparent",
                      isSelected && "bg-primary/5 hover:bg-primary/10 border-primary/20"
                    )}
                  >
                    <CheckboxIndicator checked={isSelected} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <p className="text-sm font-semibold">{rol.nombre}</p>
                      </div>
                      {rol.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1 pl-[22px]">{rol.descripcion}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-border/20 bg-muted/5 text-xs text-muted-foreground shrink-0">
          {rolesFiltrados.length} rol{rolesFiltrados.length !== 1 ? 'es' : ''} disponible{rolesFiltrados.length !== 1 ? 's' : ''}
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
            {asignarMutation.isPending ? 'Asignando...' : 'Asignar Roles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
