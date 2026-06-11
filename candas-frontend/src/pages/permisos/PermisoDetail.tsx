import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { LoadingState } from '@/components/states/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePermiso } from '@/hooks/usePermisos'
import { PERMISSIONS } from '@/types/permissions'
import { useNavigate,useParams } from '@tanstack/react-router'
import { Edit,FileText,Folder,Key,Zap } from 'lucide-react'

export default function PermisoDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })

  const { data: permiso, isLoading } = usePermiso(id ? Number(id) : undefined)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <LoadingState label="Cargando permiso..." />
      </div>
    )
  }

  if (!permiso) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
          <Key className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground">Permiso no encontrado</p>
        <Button variant="outline" onClick={() => navigate({ to: '/permisos' })} className="rounded-lg">
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <DetailPageLayout
      title={permiso.nombre}
      subtitle={`Permiso #${permiso.idPermiso} · definido en código`}
      backUrl="/permisos"
      maxWidth="md"
      actions={
        <ProtectedByPermission permission={PERMISSIONS.PERMISOS.EDITAR}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: `/permisos/${id}/edit` })}
            className="h-8 text-xs rounded-lg"
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Editar nombre
          </Button>
        </ProtectedByPermission>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        {permiso.recurso ? (
          <Badge variant="warning" className="gap-1.5 rounded-lg px-3 py-1 text-xs">
            <Folder className="h-3.5 w-3.5" />
            {permiso.recurso}
          </Badge>
        ) : null}
        {permiso.accion ? (
          <Badge variant="info" className="gap-1.5 rounded-lg px-3 py-1 text-xs">
            <Zap className="h-3.5 w-3.5" />
            {permiso.accion}
          </Badge>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="border-b border-border/30 bg-muted/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <FileText className="h-3.5 w-3.5 text-info" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Información del permiso</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre</span>
            <p className="text-sm font-semibold text-foreground">{permiso.nombre}</p>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descripción</span>
            <p className="text-sm text-foreground">
              {permiso.descripcion || <span className="italic text-muted-foreground">Sin descripción</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="border-b border-border/30 bg-muted/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <Folder className="h-3.5 w-3.5 text-warning" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Detalles técnicos</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recurso</span>
            <div className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                {permiso.recurso || <span className="font-normal italic text-muted-foreground">No especificado</span>}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acción</span>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                {permiso.accion || <span className="font-normal italic text-muted-foreground">No especificada</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DetailPageLayout>
  )
}
