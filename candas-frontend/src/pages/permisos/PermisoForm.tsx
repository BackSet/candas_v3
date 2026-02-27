import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePermiso, useCreatePermiso, useUpdatePermiso } from '@/hooks/usePermisos'
import type { Permiso } from '@/types/permiso'
import { Key, Save, ArrowLeft, Folder, Zap, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { LoadingState } from '@/components/states/LoadingState'

const permisoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  recurso: z.string().optional(),
  accion: z.string().optional(),
})

type PermisoFormData = z.infer<typeof permisoSchema>

export default function PermisoForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: permiso, isLoading: loadingPermiso } = usePermiso(id ? Number(id) : undefined)
  const createMutation = useCreatePermiso()
  const updateMutation = useUpdatePermiso()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PermisoFormData>({
    resolver: zodResolver(permisoSchema),
  })

  useEffect(() => {
    if (permiso) {
      setValue('nombre', permiso.nombre)
      setValue('descripcion', permiso.descripcion || '')
      setValue('recurso', permiso.recurso || '')
      setValue('accion', permiso.accion || '')
    }
  }, [permiso, setValue])

  const onSubmit = async (data: PermisoFormData) => {
    const permisoData: Permiso = {
      ...data,
      descripcion: data.descripcion || undefined,
      recurso: data.recurso || undefined,
      accion: data.accion || undefined,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: permisoData })
      } else {
        await createMutation.mutateAsync(permisoData)
      }
      navigate({ to: '/permisos' })
    } catch { /* hook */ }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingPermiso) {
    return (
      <StandardPageLayout title={isEdit ? 'Editar Permiso' : 'Nuevo Permiso'} icon={<Key className="h-4 w-4" />}>
        <div className="p-8">
          <LoadingState label="Cargando formulario..." />
        </div>
      </StandardPageLayout>
    )
  }

  return (
    <StandardPageLayout
      title={isEdit ? 'Editar Permiso' : 'Nuevo Permiso'}
      subtitle={isEdit ? 'Modificar datos del permiso' : 'Crear nuevo permiso en el sistema'}
      icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center"><Key className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>}
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate({ to: '/permisos' })} disabled={isSaving} className="h-8 text-xs rounded-lg">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Volver
          </Button>
          <Button type="button" size="sm" disabled={isSaving} onClick={() => handleSubmit(onSubmit)()} className="h-8 text-xs rounded-lg shadow-sm">
            {isSaving ? 'Guardando...' : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Guardar
              </>
            )}
          </Button>
        </div>
      }
    >
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <form id="permiso-form" onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto p-6 space-y-8">

          {/* Basic Info Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Información del Permiso</h3>
                  <p className="text-xs text-muted-foreground">Nombre y descripción</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="nombre"
                    {...register('nombre')}
                    className={cn("h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm", errors.nombre && "border-red-500/50")}
                    placeholder="ej. USUARIOS_VER"
                  />
                </div>
                {errors.nombre && <p className="text-[10px] text-red-500">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...register('descripcion')}
                  placeholder="Descripción del permiso..."
                  rows={3}
                  className="bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Technical Details Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Detalles Técnicos</h3>
                  <p className="text-xs text-muted-foreground">Recurso y acción asociados</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="recurso" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recurso</Label>
                <div className="relative">
                  <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="recurso"
                    {...register('recurso')}
                    className="h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm"
                    placeholder="ej. USUARIOS"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Entidad o módulo al que aplica el permiso.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accion" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acción</Label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="accion"
                    {...register('accion')}
                    className="h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm"
                    placeholder="ej. VER"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Operación permitida (VER, CREAR, EDITAR, etc.).</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </StandardPageLayout>
  )
}
