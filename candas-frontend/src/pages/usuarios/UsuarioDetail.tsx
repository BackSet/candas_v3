import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useUsuario, useRolesUsuario, useDeleteUsuario } from '@/hooks/useUsuarios'
import { useRoles } from '@/hooks/useRoles'
import { useAgencia } from '@/hooks/useAgencias'
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
import { Edit, Trash2, ArrowLeft, UserCog, Mail, Calendar, Hash, Shield, User, Building2 } from 'lucide-react'
import AsignarRolesDialog from './AsignarRolesDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'

export default function UsuarioDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAsignarRoles, setShowAsignarRoles] = useState(false)

  const { data: usuario, isLoading } = useUsuario(id ? Number(id) : undefined)
  const { data: rolesIds } = useRolesUsuario(id ? Number(id) : undefined)
  const { data: rolesData } = useRoles(0, 100)
  const { data: agencia } = useAgencia(usuario?.idAgencia)
  const deleteMutation = useDeleteUsuario()

  const roles = rolesData?.content.filter((r) => rolesIds?.includes(r.idRol!)) || []

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteMutation.mutateAsync(Number(id))
        navigate({ to: '/usuarios' })
      } catch { /* hook */ }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando información...</span>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center">
          <User className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground text-sm">Usuario no encontrado</p>
        <Button variant="outline" onClick={() => navigate({ to: '/usuarios' })} className="rounded-lg">
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-lg font-bold uppercase border border-primary/10">
              {usuario.nombreCompleto?.charAt(0) || '?'}
            </div>
          }
          title={usuario.nombreCompleto}
          subtitle={`@${usuario.username}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/usuarios' })} className="h-8 text-xs rounded-lg">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Volver
              </Button>
              <ProtectedByPermission permission={PERMISSIONS.USUARIOS.ASIGNAR_ROLES}>
                <Button variant="ghost" size="sm" onClick={() => setShowAsignarRoles(true)} className="h-8 text-xs rounded-lg">
                  <UserCog className="h-3.5 w-3.5 mr-1.5" />
                  Roles
                </Button>
              </ProtectedByPermission>
              <ProtectedByPermission permission={PERMISSIONS.USUARIOS.EDITAR}>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/usuarios/${id}/edit` })} className="h-8 text-xs rounded-lg">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              </ProtectedByPermission>
              <ProtectedByPermission permission={PERMISSIONS.USUARIOS.ELIMINAR}>
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
              className={`text-xs px-3 py-1 rounded-lg border-0 font-semibold ${usuario.activo !== false
                  ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-100/80 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
            >
              {usuario.activo !== false ? '● Activo' : '● Inactivo'}
            </Badge>
            {usuario.fechaRegistro && (
              <span className="text-xs text-muted-foreground">
                Registrado el {new Date(usuario.fechaRegistro).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info Card */}
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Información Personal</h3>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre Completo</span>
                    <p className="text-sm font-medium text-foreground">{usuario.nombreCompleto}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Username</span>
                    <p className="text-sm font-mono font-medium text-foreground">@{usuario.username}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</span>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-foreground">{usuario.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Associations Card */}
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Building2 className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Asociaciones</h3>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cliente</span>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-foreground">{usuario.idCliente || 'No asociado'}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agencia</span>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-foreground">
                        {usuario.idAgencia != null
                          ? (agencia?.nombre ?? `Agencia #${usuario.idAgencia}`)
                          : 'No asociada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Card */}
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Auditoría</h3>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fecha de Registro</span>
                    <p className="text-sm font-medium text-foreground">
                      {usuario.fechaRegistro ? new Date(usuario.fechaRegistro).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Último Acceso</span>
                    <p className="text-sm font-medium text-foreground">
                      {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString() : 'Nunca'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar — Roles */}
            <div className="space-y-6">
              <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Shield className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Roles</h3>
                      <p className="text-xs text-muted-foreground">{roles.length} asignado{roles.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {roles.length === 0 ? (
                    <div className="text-center py-6 px-4">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground italic">Sin roles asignados</p>
                    </div>
                  ) : (
                    roles.map(rol => (
                      <div key={rol.idRol} className="p-3 bg-muted/15 border border-border/30 rounded-xl hover:bg-muted/25 transition-colors duration-150">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                          <p className="font-medium text-sm">{rol.nombre}</p>
                        </div>
                        {rol.descripcion && <p className="text-xs text-muted-foreground mt-1.5 pl-5">{rol.descripcion}</p>}
                      </div>
                    ))
                  )}
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
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
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

      <AsignarRolesDialog
        usuarioId={Number(id)}
        open={showAsignarRoles}
        onOpenChange={setShowAsignarRoles}
      />
    </PageContainer>
  )
}
