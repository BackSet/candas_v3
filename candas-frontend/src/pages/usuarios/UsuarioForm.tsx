import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckboxIndicator } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useUsuario,
  useCreateUsuario,
  useUpdateUsuario,
  useRolesUsuario,
  useAgenciasUsuario,
  useAsignarRolesUsuario,
  useAsignarAgenciasUsuario,
} from '@/hooks/useUsuarios'
import { useClientes, useAgencias } from '@/hooks/useSelectOptions'
import { useRoles } from '@/hooks/useRoles'
import { Search, Shield, Building2, User, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHasAnyRole } from '@/hooks/useHasRole'
import { FormPageLayout, FormSection, FieldRow } from '@/components/form'
import {
  usuarioSchema,
  type UsuarioFormData,
  usuarioFormDataToDto,
  usuarioToFormData,
} from '@/schemas/usuario'

export default function UsuarioForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const {
    data: usuario,
    isLoading: loadingUsuario,
    error: loadError,
    refetch,
  } = useUsuario(id ? Number(id) : undefined)
  const { data: clientes = [] } = useClientes()
  const { data: agencias = [] } = useAgencias()
  const { data: rolesData } = useRoles({ page: 0, size: 100 })
  const { data: rolesActuales } = useRolesUsuario(id ? Number(id) : undefined)
  const { data: agenciasActuales } = useAgenciasUsuario(id ? Number(id) : undefined)
  const createMutation = useCreateUsuario()
  const updateMutation = useUpdateUsuario()
  const asignarRolesMutation = useAsignarRolesUsuario()
  const asignarAgenciasMutation = useAsignarAgenciasUsuario()
  const canManageAgencias = useHasAnyRole(['ADMIN', 'SUPERVISOR'])

  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [selectedAgencias, setSelectedAgencias] = useState<number[]>([])
  const [busquedaRoles, setBusquedaRoles] = useState('')
  const [busquedaAgencias, setBusquedaAgencias] = useState('')
  const rolesInicializados = useRef(false)
  const agenciasInicializadas = useRef(false)

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
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
    if (usuario) {
      reset(usuarioToFormData(usuario))
    }
  }, [usuario, reset])

  const rolesActualesMemo = useMemo(() => {
    if (!rolesActuales || !Array.isArray(rolesActuales)) return null
    return [...rolesActuales].sort()
  }, [rolesActuales])

  useEffect(() => {
    rolesInicializados.current = false
    agenciasInicializadas.current = false
    setSelectedRoles([])
    setSelectedAgencias([])
  }, [id])

  useEffect(() => {
    if (isEdit && rolesActualesMemo && !rolesInicializados.current) {
      setSelectedRoles(rolesActualesMemo)
      rolesInicializados.current = true
    }
  }, [isEdit, rolesActualesMemo])

  useEffect(() => {
    if (isEdit && agenciasActuales && !agenciasInicializadas.current) {
      setSelectedAgencias(agenciasActuales)
      agenciasInicializadas.current = true
    }
  }, [isEdit, agenciasActuales])

  const roles = rolesData?.content || []
  const rolesFiltrados = roles.filter((r) => {
    if (busquedaRoles && !r.nombre?.toLowerCase().includes(busquedaRoles.toLowerCase()) &&
      !r.descripcion?.toLowerCase().includes(busquedaRoles.toLowerCase())) {
      return false
    }
    return true
  })

  const agenciasFiltradas = agencias.filter((a) =>
    a.label.toLowerCase().includes(busquedaAgencias.toLowerCase())
  )

  const handleToggleRol = (idRol: number) => {
    setSelectedRoles((prev) =>
      prev.includes(idRol)
        ? prev.filter((id) => id !== idRol)
        : [...prev, idRol]
    )
  }

  const handleSelectAllRoles = () => {
    if (selectedRoles.length === rolesFiltrados.length) {
      setSelectedRoles([])
    } else {
      setSelectedRoles(rolesFiltrados.map(r => r.idRol!))
    }
  }

  const handleToggleAgencia = (idAgencia: number) => {
    setSelectedAgencias((prev) =>
      prev.includes(idAgencia)
        ? prev.filter((id) => id !== idAgencia)
        : [...prev, idAgencia]
    )
  }

  const onSubmit = async (data: UsuarioFormData) => {
    const usuarioData = usuarioFormDataToDto(data, {
      selectedAgencias,
      canManageAgencias,
      isEdit,
      existingUsuario: usuario,
    })

    try {
      let usuarioId: number
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: usuarioData })
        usuarioId = Number(id)
      } else {
        const nuevoUsuario = await createMutation.mutateAsync(usuarioData)
        usuarioId = nuevoUsuario.idUsuario!
      }

      await asignarRolesMutation.mutateAsync({
        id: usuarioId,
        roles: selectedRoles,
      })

      if (canManageAgencias) {
        await asignarAgenciasMutation.mutateAsync({
          id: usuarioId,
          agencias: selectedAgencias,
        })
      }

      navigate({ to: '/usuarios' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isLoading = isEdit && loadingUsuario
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    asignarRolesMutation.isPending ||
    asignarAgenciasMutation.isPending

  return (
    <FormPageLayout
      title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      subtitle={isEdit ? 'Modificar datos y roles del usuario' : 'Crear nuevo usuario en el sistema'}
      backUrl="/usuarios"
      formId="usuario-form"
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => void refetch()}
      isSubmitting={isSaving}
      errors={errors as unknown as Record<string, unknown>}
      form={form as unknown as UseFormReturn<FieldValues>}
      width="xl"
    >
      <form id="usuario-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Credenciales"
          description="Datos de acceso del usuario."
          icon={Lock}
          cols={2}
        >
          <FieldRow
            label="Username"
            required
            htmlFor="username"
            error={errors.username}
          >
            <Input
              id="username"
              {...register('username')}
              className={cn(errors.username && 'border-destructive')}
              placeholder="ej. jdoe"
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

          <FieldRow
            label={
              <span className="flex items-center gap-2">
                Contraseña
                {isEdit && (
                  <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">
                    Dejar vacío para mantener actual
                  </span>
                )}
              </span>
            }
            required={!isEdit}
            htmlFor="password"
            error={errors.password}
            span="full"
          >
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={cn(errors.password && 'border-destructive')}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FieldRow>
        </FormSection>

        <FormSection
          title="Datos personales"
          description="Información básica del usuario."
          icon={User}
          cols={2}
        >
          <FieldRow
            label="Nombre completo"
            required
            htmlFor="nombreCompleto"
            error={errors.nombreCompleto}
          >
            <Input
              id="nombreCompleto"
              {...register('nombreCompleto')}
              className={cn(errors.nombreCompleto && 'border-destructive')}
              placeholder="Nombre Apellido"
            />
          </FieldRow>

          <FieldRow
            label="Email"
            required
            htmlFor="email"
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={cn(errors.email && 'border-destructive')}
              placeholder="usuario@ejemplo.com"
            />
          </FieldRow>
        </FormSection>

        <FormSection
          title="Asignaciones"
          description="Cliente, agencias habilitadas y roles asignados."
          icon={Building2}
          cols={2}
        >
          <FieldRow
            label="Cliente (Opcional)"
            htmlFor="idCliente"
            hint="Si el usuario pertenece a un cliente corporativo."
          >
            <Select
              value={watch('idCliente')?.toString() || 'none'}
              onValueChange={(value) =>
                setValue('idCliente', value === 'none' ? '' : Number(value), { shouldDirty: true })
              }
            >
              <SelectTrigger id="idCliente" className="h-9">
                <SelectValue placeholder="Ninguno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.value} value={cliente.value.toString()}>
                    {cliente.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow
            label="Agencias habilitadas (Multi-agencia)"
            hint={
              canManageAgencias
                ? 'Selecciona una o más agencias para habilitar entornos del usuario.'
                : 'Solo ADMIN o SUPERVISOR puede editar agencias habilitadas.'
            }
          >
            <div className={cn('rounded-lg border border-border/40 p-3 space-y-2', !canManageAgencias && 'opacity-70')}>
              <Input
                placeholder="Buscar agencia..."
                value={busquedaAgencias}
                onChange={(e) => setBusquedaAgencias(e.target.value)}
                className="h-8 text-xs"
                disabled={!canManageAgencias}
              />
              <div className="max-h-36 overflow-auto space-y-1 pr-1">
                {agenciasFiltradas.map((agencia) => (
                  <button
                    key={agencia.value}
                    type="button"
                    onClick={() => handleToggleAgencia(agencia.value)}
                    disabled={!canManageAgencias}
                    className={cn(
                      'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 text-xs',
                      selectedAgencias.includes(agencia.value) && 'bg-primary/10'
                    )}
                  >
                    <CheckboxIndicator checked={selectedAgencias.includes(agencia.value)} />
                    <span className="truncate">{agencia.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </FieldRow>

          <FieldRow
            label="Roles asignados"
            hint={
              selectedRoles.length > 0
                ? `${selectedRoles.length} rol${selectedRoles.length > 1 ? 'es' : ''} seleccionado${selectedRoles.length > 1 ? 's' : ''}`
                : 'Ningún rol seleccionado'
            }
            span="full"
            action={
              rolesFiltrados.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllRoles}
                  className="h-7 text-[10px] rounded-lg"
                >
                  {selectedRoles.length === rolesFiltrados.length ? 'Deseleccionar' : 'Seleccionar Todos'}
                </Button>
              ) : null
            }
          >
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="p-3 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    placeholder="Buscar rol..."
                    value={busquedaRoles}
                    onChange={(e) => setBusquedaRoles(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
              </div>

              <ScrollArea className="h-[280px]">
                <div className="p-3 space-y-1.5">
                  {rolesFiltrados.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No se encontraron roles</p>
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
                            'flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-150 select-none border border-transparent',
                            isSelected && 'bg-primary/5 hover:bg-primary/10 border-primary/20'
                          )}
                        >
                          <CheckboxIndicator checked={isSelected} className="mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-none">{rol.nombre}</p>
                            {rol.descripcion && <p className="text-xs text-muted-foreground mt-1.5 opacity-80">{rol.descripcion}</p>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </FieldRow>
        </FormSection>
      </form>
    </FormPageLayout>
  )
}
