import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import { useUsuario, useRolesUsuario, useDeleteUsuario, useAgenciasUsuario } from '@/hooks/useUsuarios'
import { useRoles } from '@/hooks/useRoles'
import { cn } from '@/lib/utils'
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
import { Edit, Trash2, UserCog, Mail, Calendar, Hash, Shield, User, Building2 } from 'lucide-react'
import AsignarRolesDialog from './AsignarRolesDialog'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import { agenciaService } from '@/lib/api/agencia.service'

const AGENCY_TONE_CLASSES = [
  'border-sky-300/70 bg-sky-50 text-sky-800 dark:border-sky-700/60 dark:bg-sky-950/35 dark:text-sky-200',
  'border-emerald-300/70 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/35 dark:text-emerald-200',
  'border-violet-300/70 bg-violet-50 text-violet-800 dark:border-violet-700/60 dark:bg-violet-950/35 dark:text-violet-200',
  'border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-200',
  'border-rose-300/70 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-950/35 dark:text-rose-200',
]

export default function UsuarioDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAsignarRoles, setShowAsignarRoles] = useState(false)

  const { data: usuario, isLoading } = useUsuario(id ? Number(id) : undefined)
  const { data: rolesIds } = useRolesUsuario(id ? Number(id) : undefined)
  const { data: agenciasIdsUsuario } = useAgenciasUsuario(id ? Number(id) : undefined)
  const { data: rolesData } = useRoles({ page: 0, size: 100 })
  const deleteMutation = useDeleteUsuario()

  const roles = rolesData?.content.filter((r) => rolesIds?.includes(r.idRol!)) || []
  const agenciasAsignadasIds = Array.from(
    new Set(
      (
        agenciasIdsUsuario
        ?? usuario?.idAgencias
        ?? (usuario?.idAgencia != null ? [usuario.idAgencia] : [])
      ).filter((idAgencia): idAgencia is number => idAgencia != null)
    )
  )
  const agenciasAsignadasQueries = useQueries({
    queries: agenciasAsignadasIds.map((idAgencia) => ({
      queryKey: ['agencia', idAgencia],
      queryFn: () => agenciaService.findById(idAgencia),
      staleTime: 60000,
    })),
  })
  const agenciasAsignadas = agenciasAsignadasQueries
    .map((query, index) => ({
      id: agenciasAsignadasIds[index],
      nombre: query.data?.nombre ?? `Agencia #${agenciasAsignadasIds[index]}`,
    }))
    .filter((agenciaAsignada) => agenciaAsignada.id != null)
  const agenciasCargando = agenciasAsignadasQueries.some((query) => query.isLoading)
  const agenciasConError = agenciasAsignadasQueries.some((query) => query.isError)

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
      <DetailPageLayout backUrl="/usuarios" title="Usuario">
        <div className="p-8">
          <LoadingState label="Cargando información..." />
        </div>
      </DetailPageLayout>
    )
  }

  if (!usuario) {
    return (
      <DetailPageLayout backUrl="/usuarios" title="Usuario">
        <EmptyState
          title="Usuario no encontrado"
          action={
            <Button variant="outline" onClick={() => navigate({ to: '/usuarios' })} className="rounded-lg">
              Volver a la lista
            </Button>
          }
        />
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      backUrl="/usuarios"
      title={usuario.nombreCompleto ?? 'Usuario'}
      subtitle={`@${usuario.username}`}
      status={{ label: usuario.activo !== false ? 'Activo' : 'Inactivo', variant: usuario.activo !== false ? 'active' : 'inactive' }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
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
      maxWidth="2xl"
    >
      <div className="contents">
      <div className="space-y-6">

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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agencias asociadas</span>
                      <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] bg-primary/10 text-primary dark:bg-primary/20">
                        {agenciasAsignadasIds.length}
                      </Badge>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/80 p-3 shadow-sm">
                      {agenciasCargando ? (
                        <p className="text-xs text-muted-foreground">Cargando agencias asociadas...</p>
                      ) : agenciasConError ? (
                        <p className="text-xs text-destructive font-medium">No se pudieron cargar todas las agencias asociadas.</p>
                      ) : agenciasAsignadas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {agenciasAsignadas.map((agenciaAsignada, index) => (
                            <div
                              key={agenciaAsignada.id}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs',
                                'font-semibold shadow-[0_1px_0_rgba(0,0,0,0.02)]',
                                AGENCY_TONE_CLASSES[index % AGENCY_TONE_CLASSES.length]
                              )}
                            >
                              <Building2 className="h-3 w-3" />
                              <span>{agenciaAsignada.nombre}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Sin agencias asociadas.</p>
                      )}
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
      </div>
    </DetailPageLayout>
  )
}
