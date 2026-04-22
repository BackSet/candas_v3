import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Search, Key, Folder, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  rolSchema,
  type RolFormData,
  rolFormDataToDto,
  rolToFormData,
} from '@/schemas/rol'

export default function RolForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: rol,
    isLoading: loadingRol,
    error: loadError,
    refetch,
  } = useRol(id ? Number(id) : undefined)
  const { data: permisosData } = usePermisos({ page: 0, size: 100 })
  const { data: permisosActuales } = usePermisosRol(id ? Number(id) : undefined)
  const createMutation = useCreateRol()
  const updateMutation = useUpdateRol()
  const asignarPermisosMutation = useAsignarPermisosRol()

  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([])
  const [busquedaPermisos, setBusquedaPermisos] = useState('')

  const form = useForm<RolFormData>({
    resolver: zodResolver(rolSchema),
    defaultValues: {
      activo: true,
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form

  useEffect(() => {
    if (rol) {
      reset(rolToFormData(rol))
    }
  }, [rol, reset])

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
    const rolData = rolFormDataToDto(data)

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
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingRol
  const isSaving = createMutation.isPending || updateMutation.isPending || asignarPermisosMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Rol' : 'Nuevo Rol'}
      subtitle={isEdit ? 'Modificar datos y permisos del rol' : 'Crear nuevo rol en el sistema'}
      backUrl="/roles"
      formId="rol-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="lg"
    >
      <form id="rol-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Datos del rol"
          description="Nombre, descripción y estado del rol."
          icon={FileText}
          cols={2}
        >
          <FieldRow
            label="Nombre"
            required
            htmlFor="nombre"
            error={errors.nombre}
          >
            <Input
              id="nombre"
              {...register('nombre')}
              className={cn(errors.nombre && 'border-destructive')}
              placeholder="ej. ADMIN"
            />
          </FieldRow>

          <FieldRow label="Estado" htmlFor="activo">
            <Select
              value={watch('activo') ? 'true' : 'false'}
              onValueChange={(value) => setValue('activo', value === 'true', { shouldDirty: true })}
            >
              <SelectTrigger id="activo" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="Descripción" htmlFor="descripcion" span="full">
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Descripción del rol..."
              rows={3}
            />
          </FieldRow>
        </FormSection>

        <FormSection
          title="Permisos asignados"
          description={
            selectedPermisos.length > 0
              ? `${selectedPermisos.length} permiso${selectedPermisos.length > 1 ? 's' : ''} seleccionado${selectedPermisos.length > 1 ? 's' : ''}`
              : 'Ningún permiso seleccionado'
          }
          icon={Key}
          cols={1}
          actions={
            Object.keys(permisosPorRecurso).length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllPermisos}
                className="h-7 text-[10px] rounded-lg"
              >
                {selectedPermisos.length === permisosFiltrados.length ? 'Deseleccionar' : 'Seleccionar Todos'}
              </Button>
            ) : null
          }
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input
                placeholder="Buscar permiso..."
                value={busquedaPermisos}
                onChange={(e) => setBusquedaPermisos(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>

            <ScrollArea className="h-[400px] rounded-lg border border-border/40">
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
                                  'flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-150 select-none border border-transparent',
                                  isSelected && 'bg-primary/5 hover:bg-primary/10 border-primary/20'
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
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
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
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
