import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { UserCog, Save, User, Mail, Hash, Lock } from 'lucide-react'
import { notify } from '@/lib/notify'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from '@/lib/api/auth.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const perfilSchema = z.object({
  username: z.string().min(1, 'El username es obligatorio'),
  email: z.string().email('El correo debe ser válido'),
  nombreCompleto: z.string().min(1, 'El nombre completo es obligatorio'),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6, 'La contraseña debe tener al menos 6 caracteres'),
})

type PerfilFormData = z.infer<typeof perfilSchema>

export default function MiPerfil() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      username: '',
      email: '',
      nombreCompleto: '',
      password: '',
    },
  })

  useEffect(() => {
    if (!user) return
    setValue('username', user.username)
    setValue('email', user.email)
    setValue('nombreCompleto', user.nombreCompleto)
    setValue('password', '')
  }, [setValue, user])

  const onSubmit = async (data: PerfilFormData) => {
    try {
      await authService.updateMe({
        username: data.username.trim(),
        email: data.email.trim(),
        nombreCompleto: data.nombreCompleto.trim(),
        password: data.password?.trim() ? data.password.trim() : undefined,
      })
      notify.success('Perfil actualizado correctamente')
      navigate({ to: '/dashboard' })
    } catch (error) {
      notify.error(error, 'No se pudo actualizar tu perfil')
    }
  }

  return (
    <StandardPageLayout
      title="Mi perfil"
      subtitle="Actualiza tus datos básicos de acceso"
      icon={
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
          <UserCog className="h-4 w-4 text-primary" />
        </div>
      }
      actions={
        <Button
          type="button"
          size="sm"
          disabled={isSubmitting}
          onClick={() => handleSubmit(onSubmit)()}
          className="h-8 rounded-lg text-xs shadow-sm"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Guardar cambios
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="border-b border-border/30 bg-muted/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Datos de acceso</h3>
                  <p className="text-xs text-muted-foreground">Información de tu cuenta para iniciar sesión</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Usuario <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    id="username"
                    {...register('username')}
                    className={cn(
                      'h-9 rounded-lg border-border/30 bg-muted/30 pl-9 text-sm transition-all focus:border-primary/40 focus:bg-background',
                      errors.username && 'border-red-500/50'
                    )}
                    placeholder="ej. juan.perez"
                  />
                </div>
                {errors.username && <p className="text-[10px] text-red-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreCompleto" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    id="nombreCompleto"
                    {...register('nombreCompleto')}
                    className={cn(
                      'h-9 rounded-lg border-border/30 bg-muted/30 pl-9 text-sm transition-all focus:border-primary/40 focus:bg-background',
                      errors.nombreCompleto && 'border-red-500/50'
                    )}
                    placeholder="Nombre y apellido"
                  />
                </div>
                {errors.nombreCompleto && <p className="text-[10px] text-red-500">{errors.nombreCompleto.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Correo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={cn(
                      'h-9 rounded-lg border-border/30 bg-muted/30 pl-9 text-sm transition-all focus:border-primary/40 focus:bg-background',
                      errors.email && 'border-red-500/50'
                    )}
                    placeholder="usuario@empresa.com"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="border-b border-border/30 bg-muted/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                  <Lock className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Seguridad</h3>
                  <p className="text-xs text-muted-foreground">Cambia tu contraseña cuando lo necesites</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nueva contraseña (opcional)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={cn(
                      'h-9 rounded-lg border-border/30 bg-muted/30 pl-9 text-sm transition-all focus:border-primary/40 focus:bg-background',
                      errors.password && 'border-red-500/50'
                    )}
                    placeholder="Dejar vacío para mantener la actual"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres.</p>
                {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-1">
            <Button type="submit" disabled={isSubmitting} className="h-9 rounded-lg">
              {isSubmitting ? 'Guardando...' : 'Actualizar perfil'}
            </Button>
          </div>
        </form>
      </div>
    </StandardPageLayout>
  )
}
