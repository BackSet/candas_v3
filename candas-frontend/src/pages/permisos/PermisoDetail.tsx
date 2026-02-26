import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { usePermiso, useDeletePermiso } from '@/hooks/usePermisos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, ArrowLeft, Key, Folder, Zap, FileText } from 'lucide-react'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'

export default function PermisoDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: permiso, isLoading } = usePermiso(id ? Number(id) : undefined)
  const deleteMutation = useDeletePermiso()

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/permisos' })
      } catch { /* hook */ }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-blue-500 animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando permiso...</span>
      </div>
    )
  }

  if (!permiso) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center">
          <Key className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground text-sm">Permiso no encontrado</p>
        <Button variant="outline" onClick={() => navigate({ to: '/permisos' })} className="rounded-lg">
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <PageContainer width="full" spacing="0" className="w-full flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0">
        <PageHeader
          className="pb-0 border-b-0"
          icon={
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/10">
              <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          }
          title={permiso.nombre}
          subtitle={`Permiso #${permiso.idPermiso}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/permisos' })} className="h-8 text-xs rounded-lg">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Volver
              </Button>
              <ProtectedByPermission permission={PERMISSIONS.PERMISOS.EDITAR}>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/permisos/${id}/edit` })} className="h-8 text-xs rounded-lg">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              </ProtectedByPermission>
              <ProtectedByPermission permission={PERMISSIONS.PERMISOS.ELIMINAR}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Eliminar
                </Button>
              </ProtectedByPermission>
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          {/* Tags Banner */}
          <div className="flex items-center gap-3 flex-wrap">
            {permiso.recurso && (
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-lg border-0 font-semibold bg-amber-100/80 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                <Folder className="h-3.5 w-3.5 mr-1.5" />
                {permiso.recurso}
              </Badge>
            )}
            {permiso.accion && (
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-lg border-0 font-semibold bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                {permiso.accion}
              </Badge>
            )}
          </div>

          {/* Info Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Información del Permiso</h3>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre</span>
                <p className="text-sm font-semibold text-foreground">{permiso.nombre}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descripción</span>
                <p className="text-sm text-foreground">{permiso.descripcion || <span className="italic text-muted-foreground">Sin descripción</span>}</p>
              </div>
            </div>
          </div>

          {/* Technical Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Detalles Técnicos</h3>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recurso</span>
                <div className="flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">{permiso.recurso || <span className="italic text-muted-foreground font-normal">No especificado</span>}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acción</span>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">{permiso.accion || <span className="italic text-muted-foreground font-normal">No especificada</span>}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este permiso? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteMutation.isPending} className="rounded-lg">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-lg">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
