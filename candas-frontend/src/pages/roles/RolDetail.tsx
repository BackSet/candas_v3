import { useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useRol, usePermisosRol, useDeleteRol } from '@/hooks/useRoles'
import { usePermisos } from '@/hooks/usePermisos'
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
import { Edit, Trash2, ArrowLeft, Shield, Folder, Key, Calendar, FileText } from 'lucide-react'
import AsignarPermisosDialog from './AsignarPermisosDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'

export default function RolDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAsignarPermisos, setShowAsignarPermisos] = useState(false)

  const { data: rol, isLoading } = useRol(id ? Number(id) : undefined)
  const { data: permisosIds } = usePermisosRol(id ? Number(id) : undefined)
  const { data: permisosData } = usePermisos(0, 100)
  const deleteMutation = useDeleteRol()

  const permisos = permisosData?.content.filter((p) => permisosIds?.includes(p.idPermiso!)) || []

  const permisosPorRecurso = useMemo(() => {
    return permisos.reduce((acc, permiso) => {
      const recurso = permiso.recurso || 'Otros'
      if (!acc[recurso]) {
        acc[recurso] = []
      }
      acc[recurso].push(permiso)
      return acc
    }, {} as Record<string, typeof permisos>)
  }, [permisos])

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/roles' })
      } catch { /* hook */ }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-violet-500 animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando rol...</span>
      </div>
    )
  }

  if (!rol) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center">
          <Shield className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground text-sm">Rol no encontrado</p>
        <Button variant="outline" onClick={() => navigate({ to: '/roles' })} className="rounded-lg">
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center border border-violet-500/10">
              <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          }
          title={rol.nombre}
          subtitle={`Rol #${rol.idRol}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/roles' })} className="h-8 text-xs rounded-lg">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Volver
              </Button>
              <ProtectedByPermission permission={PERMISSIONS.ROLES.ASIGNAR_PERMISOS}>
                <Button variant="ghost" size="sm" onClick={() => setShowAsignarPermisos(true)} className="h-8 text-xs rounded-lg">
                  <Key className="h-3.5 w-3.5 mr-1.5" />
                  Permisos
                </Button>
              </ProtectedByPermission>
              <ProtectedByPermission permission={PERMISSIONS.ROLES.EDITAR}>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/roles/${id}/edit` })} className="h-8 text-xs rounded-lg">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              </ProtectedByPermission>
              <ProtectedByPermission permission={PERMISSIONS.ROLES.ELIMINAR}>
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
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* Status Banner */}
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className={`text-xs px-3 py-1 rounded-lg border-0 font-semibold ${rol.activo !== false
                  ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-100/80 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
            >
              {rol.activo !== false ? '● Activo' : '● Inactivo'}
            </Badge>
            {rol.fechaCreacion && (
              <span className="text-xs text-muted-foreground">
                Creado el {new Date(rol.fechaCreacion).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Información Básica</h3>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre</span>
                    <p className="text-sm font-mono font-semibold text-foreground">{rol.nombre}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descripción</span>
                    <p className="text-sm text-foreground">{rol.descripcion || <span className="italic text-muted-foreground">Sin descripción</span>}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fecha de Creación</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-foreground">
                        {rol.fechaCreacion ? new Date(rol.fechaCreacion).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Permisos</span>
                    <p className="text-sm font-semibold text-foreground">{permisos.length}</p>
                  </div>
                </div>
              </div>

              {/* Permissions Card */}
              {permisos.length > 0 && (
                <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Key className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Permisos Asignados</h3>
                        <p className="text-xs text-muted-foreground">{permisos.length} permiso{permisos.length !== 1 ? 's' : ''} en {Object.keys(permisosPorRecurso).length} recurso{Object.keys(permisosPorRecurso).length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {Object.entries(permisosPorRecurso).map(([recurso, permisosRecurso]) => (
                      <div key={recurso} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5 text-amber-500" />
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{recurso}</h4>
                          <span className="text-[10px] text-muted-foreground">({permisosRecurso.length})</span>
                        </div>
                        <div className="space-y-1.5 pl-5 border-l-2 border-border/30">
                          {permisosRecurso.map((permiso) => (
                            <div
                              key={permiso.idPermiso}
                              className="p-3 bg-muted/15 border border-border/30 rounded-xl hover:bg-muted/25 transition-colors duration-150"
                            >
                              <div className="flex items-center gap-2">
                                <Key className="h-3 w-3 text-blue-500 shrink-0" />
                                <p className="font-medium text-sm">{permiso.nombre}</p>
                              </div>
                              {permiso.descripcion && (
                                <p className="text-xs text-muted-foreground mt-1.5 pl-5">{permiso.descripcion}</p>
                              )}
                              {permiso.accion && (
                                <div className="pl-5 mt-1.5">
                                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-medium bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                    {permiso.accion}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — Summary */}
            <div className="space-y-6">
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Resumen</h3>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Permisos</span>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {permisos.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Recursos</span>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold bg-amber-100/80 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      {Object.keys(permisosPorRecurso).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Estado</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-2 py-0.5 rounded-md border-0 font-semibold ${rol.activo !== false
                          ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-red-100/80 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                    >
                      {rol.activo !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {permisos.length === 0 && (
                <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="p-6 text-center">
                    <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground italic">Sin permisos asignados</p>
                    <ProtectedByPermission permission={PERMISSIONS.ROLES.ASIGNAR_PERMISOS}>
                      <Button variant="outline" size="sm" onClick={() => setShowAsignarPermisos(true)} className="mt-3 rounded-lg text-xs">
                        <Key className="h-3 w-3 mr-1.5" />
                        Asignar
                      </Button>
                    </ProtectedByPermission>
                  </div>
                </div>
              )}
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
              ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.
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

      {showAsignarPermisos && (
        <AsignarPermisosDialog
          rolId={Number(id)}
          open={showAsignarPermisos}
          onOpenChange={setShowAsignarPermisos}
        />
      )}
    </PageContainer>
  )
}
