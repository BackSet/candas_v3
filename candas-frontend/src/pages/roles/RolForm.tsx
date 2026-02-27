import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckboxIndicator } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRol, useCreateRol, useUpdateRol, useAsignarPermisosRol, usePermisosRol } from '@/hooks/useRoles'
import { usePermisos } from '@/hooks/usePermisos'
import type { Rol } from '@/types/rol'
import { Search, Key, Folder, Shield, Save, ArrowLeft, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'

const rolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

type RolFormData = z.infer<typeof rolSchema>

export default function RolForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: rol, isLoading: loadingRol } = useRol(id ? Number(id) : undefined)
  const { data: permisosData } = usePermisos(0, 100)
  const { data: permisosActuales } = usePermisosRol(id ? Number(id) : undefined)
  const createMutation = useCreateRol()
  const updateMutation = useUpdateRol()
  const asignarPermisosMutation = useAsignarPermisosRol()

  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([])
  const [busquedaPermisos, setBusquedaPermisos] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RolFormData>({
    resolver: zodResolver(rolSchema),
    defaultValues: {
      activo: true,
    },
  })

  useEffect(() => {
    if (rol) {
      setValue('nombre', rol.nombre)
      setValue('descripcion', rol.descripcion || '')
      setValue('activo', rol.activo ?? true)
    }
  }, [rol, setValue])

  const permisosActualesMemo = useMemo(() => {
    if (!permisosActuales || !Array.isArray(permisosActuales)) return null
    return [...permisosActuales].sort()
  }, [permisosActuales])

  useEffect(() => {
    if (permisosActualesMemo && permisosActualesMemo.length > 0) {
      setSelectedPermisos(permisosActualesMemo)
    } else {
      setSelectedPermisos([])
    }
  }, [permisosActualesMemo])

  const permisos = permisosData?.content || []
  const permisosFiltrados = permisos.filter((p) => {
    if (busquedaPermisos && !p.nombre?.toLowerCase().includes(busquedaPermisos.toLowerCase()) &&
      !p.descripcion?.toLowerCase().includes(busquedaPermisos.toLowerCase()) &&
      !p.recurso?.toLowerCase().includes(busquedaPermisos.toLowerCase())) {
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

  const handleSelectAllPermisos = () => {
    if (selectedPermisos.length === permisosFiltrados.length) {
      setSelectedPermisos([])
    } else {
      setSelectedPermisos(permisosFiltrados.map(p => p.idPermiso!))
    }
  }

  const onSubmit = async (data: RolFormData) => {
    const rolData: Rol = {
      ...data,
      descripcion: data.descripcion || undefined,
    }

    try {
      let rolId: number
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: rolData })
        rolId = Number(id)
      } else {
        const nuevoRol = await createMutation.mutateAsync(rolData)
        rolId = nuevoRol.idRol!
      }

      await asignarPermisosMutation.mutateAsync({
        id: rolId,
        permisos: selectedPermisos,
      })

      navigate({ to: '/roles' })
    } catch { /* hook */ }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || asignarPermisosMutation.isPending

  if (isEdit && loadingRol) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-violet-500 animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando formulario...</span>
      </div>
    )
  }

  return (
    <StandardPageLayout
      title={isEdit ? 'Editar Rol' : 'Nuevo Rol'}
      subtitle={isEdit ? 'Modificar datos y permisos del rol' : 'Crear nuevo rol en el sistema'}
      icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center"><Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>}
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate({ to: '/roles' })} disabled={isSaving} className="h-8 text-xs rounded-lg">
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
        <form id="rol-form" onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6 space-y-8">

          {/* Basic Info Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Datos Generales</h3>
                  <p className="text-xs text-muted-foreground">Nombre, descripción y estado del rol</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="nombre"
                    {...register('nombre')}
                    className={cn("h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm", errors.nombre && "border-red-500/50")}
                    placeholder="ej. ADMIN"
                  />
                </div>
                {errors.nombre && <p className="text-[10px] text-red-500">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Estado</Label>
                <Select
                  value={watch('activo') ? 'true' : 'false'}
                  onValueChange={(value) => setValue('activo', value === 'true')}
                >
                  <SelectTrigger className="h-9 bg-muted/30 border-border/30 rounded-lg focus:ring-0 focus:bg-background focus:border-primary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...register('descripcion')}
                  placeholder="Descripción del rol..."
                  rows={3}
                  className="bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Permissions Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Key className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Permisos Asignados</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedPermisos.length > 0
                        ? `${selectedPermisos.length} permiso${selectedPermisos.length > 1 ? 's' : ''} seleccionado${selectedPermisos.length > 1 ? 's' : ''}`
                        : 'Ningún permiso seleccionado'}
                    </p>
                  </div>
                </div>
                {Object.keys(permisosPorRecurso).length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllPermisos}
                    className="h-7 text-[10px] rounded-lg"
                  >
                    {selectedPermisos.length === permisosFiltrados.length ? 'Deseleccionar' : 'Seleccionar Todos'}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-border/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <Input
                  placeholder="Buscar permiso..."
                  value={busquedaPermisos}
                  onChange={(e) => setBusquedaPermisos(e.target.value)}
                  className="pl-9 h-8 bg-muted/30 border-border/30 text-xs rounded-lg"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {Object.keys(permisosPorRecurso).length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No se encontraron permisos</p>
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
                            type="button"
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
                                  <p className="text-sm font-medium leading-none">{permiso.nombre}</p>
                                  {permiso.descripcion && (
                                    <p className="text-xs text-muted-foreground mt-1 opacity-80">{permiso.descripcion}</p>
                                  )}
                                  {permiso.accion && (
                                    <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-100/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 mt-1.5">
                                      {permiso.accion}
                                    </span>
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

            {permisosFiltrados.length > 0 && (
              <div className="px-6 py-3 border-t border-border/20 bg-muted/5 flex items-center justify-between text-xs text-muted-foreground">
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
            )}
          </div>
        </form>
      </div>
    </StandardPageLayout>
  )
}
