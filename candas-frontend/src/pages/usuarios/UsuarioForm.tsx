import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckboxIndicator } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUsuario, useCreateUsuario, useUpdateUsuario, useRolesUsuario, useAsignarRolesUsuario } from '@/hooks/useUsuarios'
import { useClientes, useAgencias } from '@/hooks/useSelectOptions'
import { useRoles } from '@/hooks/useRoles'
import type { Usuario } from '@/types/usuario'
import { Search, UserCog, Save, ArrowLeft, Shield, Building2, User, Mail, Lock, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'

const usuarioSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
  activo: z.boolean().optional(),
  idCliente: z.number().optional().or(z.literal('')),
  idAgencia: z.union([z.number(), z.literal('')]).optional(),
})

type UsuarioFormData = z.infer<typeof usuarioSchema>

export default function UsuarioForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: usuario, isLoading: loadingUsuario } = useUsuario(id ? Number(id) : undefined)
  const { data: clientes = [] } = useClientes()
  const { data: agencias = [] } = useAgencias()
  const { data: rolesData } = useRoles(0, 100)
  const { data: rolesActuales } = useRolesUsuario(id ? Number(id) : undefined)
  const createMutation = useCreateUsuario()
  const updateMutation = useUpdateUsuario()
  const asignarRolesMutation = useAsignarRolesUsuario()

  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [busquedaRoles, setBusquedaRoles] = useState('')
  const rolesInicializados = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      activo: true,
    },
  })

  useEffect(() => {
    if (usuario) {
      setValue('username', usuario.username)
      setValue('email', usuario.email)
      setValue('nombreCompleto', usuario.nombreCompleto)
      setValue('activo', usuario.activo ?? true)
      setValue('idCliente', usuario.idCliente ?? '')
      setValue('idAgencia', usuario.idAgencia ?? '')
    }
  }, [usuario, setValue])

  const rolesActualesMemo = useMemo(() => {
    if (!rolesActuales || !Array.isArray(rolesActuales)) return null
    return [...rolesActuales].sort()
  }, [rolesActuales])

  useEffect(() => {
    rolesInicializados.current = false
    setSelectedRoles([])
  }, [id])

  useEffect(() => {
    if (isEdit && rolesActualesMemo && !rolesInicializados.current) {
      setSelectedRoles(rolesActualesMemo)
      rolesInicializados.current = true
    }
  }, [isEdit, rolesActualesMemo])

  const roles = rolesData?.content || []
  const rolesFiltrados = roles.filter((r) => {
    if (busquedaRoles && !r.nombre?.toLowerCase().includes(busquedaRoles.toLowerCase()) &&
      !r.descripcion?.toLowerCase().includes(busquedaRoles.toLowerCase())) {
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

  const handleSelectAllRoles = () => {
    if (selectedRoles.length === rolesFiltrados.length) {
      setSelectedRoles([])
    } else {
      setSelectedRoles(rolesFiltrados.map(r => r.idRol!))
    }
  }

  const onSubmit = async (data: UsuarioFormData) => {
    const usuarioData: Usuario = {
      ...data,
      password: data.password || undefined,
      idCliente: data.idCliente === '' ? undefined : data.idCliente,
      idAgencia: data.idAgencia === '' || data.idAgencia == null ? undefined : data.idAgencia,
    }

    if (isEdit && !data.password) {
      delete usuarioData.password
    }

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

      navigate({ to: '/usuarios' })
    } catch { /* hook */ }
  }

  const isLoading = isEdit && loadingUsuario
  const isSaving = createMutation.isPending || updateMutation.isPending || asignarRolesMutation.isPending

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando formulario...</span>
      </div>
    )
  }

  return (
    <PageContainer width="full" spacing="0" className="w-full flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl z-10 shrink-0">
        <PageHeader
          className="pb-0 border-b-0"
          icon={<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><UserCog className="h-4 w-4 text-primary" /></div>}
          title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          subtitle={isEdit ? 'Modificar datos y roles del usuario' : 'Crear nuevo usuario en el sistema'}
          actions={
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate({ to: '/usuarios' })} disabled={isSaving} className="h-8 text-xs rounded-lg">
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
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <form id="usuario-form" onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6 space-y-8">

          {/* Basic Info Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Datos Generales</h3>
                  <p className="text-xs text-muted-foreground">Información básica del usuario</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Username <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="username"
                    {...register('username')}
                    className={cn("h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm", errors.username && "border-red-500/50")}
                    placeholder="ej. jdoe"
                  />
                </div>
                {errors.username && <p className="text-[10px] text-red-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreCompleto" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre Completo <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="nombreCompleto"
                    {...register('nombreCompleto')}
                    className={cn("h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm", errors.nombreCompleto && "border-red-500/50")}
                    placeholder="Nombre Apellido"
                  />
                </div>
                {errors.nombreCompleto && <p className="text-[10px] text-red-500">{errors.nombreCompleto.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={cn("h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm", errors.email && "border-red-500/50")}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
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
                <Label htmlFor="password" className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Contraseña {!isEdit && <span className="text-red-500">*</span>}</span>
                  {isEdit && <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">Dejar vacío para mantener actual</span>}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={cn("h-9 pl-9 bg-muted/30 border-border/30 rounded-lg focus:bg-background focus:border-primary/40 transition-all text-sm", errors.password && "border-red-500/50")}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
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
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Asociaciones</h3>
                  <p className="text-xs text-muted-foreground">Cliente y agencia vinculados</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cliente (Opcional)</Label>
                <Select
                  value={watch('idCliente')?.toString() || 'none'}
                  onValueChange={(value) => setValue('idCliente', value === 'none' ? '' : Number(value))}
                >
                  <SelectTrigger className="h-9 bg-muted/30 border-border/30 rounded-lg focus:ring-0 focus:bg-background focus:border-primary/40">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Ninguno</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.value} value={cliente.value.toString()}>
                        {cliente.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Si el usuario pertenece a un cliente corporativo.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agencia (Opcional)</Label>
                <Select
                  value={watch('idAgencia')?.toString() || 'none'}
                  onValueChange={(value) => setValue('idAgencia', value === 'none' ? '' : Number(value))}
                >
                  <SelectTrigger className="h-9 bg-muted/30 border-border/30 rounded-lg focus:ring-0 focus:bg-background focus:border-primary/40">
                    <SelectValue placeholder="Ninguna" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">Ninguna</SelectItem>
                    {agencias.map((agencia) => (
                      <SelectItem key={agencia.value} value={agencia.value.toString()}>
                        {agencia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Agencia a la que pertenece el usuario.</p>
              </div>
            </div>
          </div>

          {/* Roles Card */}
          <div className="border border-border/40 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Roles Asignados</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedRoles.length > 0
                        ? `${selectedRoles.length} rol${selectedRoles.length > 1 ? 'es' : ''} seleccionado${selectedRoles.length > 1 ? 's' : ''}`
                        : 'Ningún rol seleccionado'}
                    </p>
                  </div>
                </div>
                {rolesFiltrados.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllRoles}
                    className="h-7 text-[10px] rounded-lg"
                  >
                    {selectedRoles.length === rolesFiltrados.length ? 'Deseleccionar' : 'Seleccionar Todos'}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-border/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <Input
                  placeholder="Buscar rol..."
                  value={busquedaRoles}
                  onChange={(e) => setBusquedaRoles(e.target.value)}
                  className="pl-9 h-8 bg-muted/30 border-border/30 text-xs rounded-lg"
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
                          "flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-150 select-none border border-transparent",
                          isSelected && "bg-primary/5 hover:bg-primary/10 border-primary/20"
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
        </form>
      </div>
    </PageContainer>
  )
}
