import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/api/auth.service'
import type { LoginRequest } from '@/types/user'
import { AlertCircle, ArrowRight, Loader2, Lock, User } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      await authService.login(data)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      let errorMessage = 'Error al iniciar sesión'
      if (err?.code === 'ERR_NETWORK' || !err?.response) {
        errorMessage = 'No se pudo conectar con el servidor.'
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.response?.status === 401) {
        errorMessage = 'Credenciales incorrectas'
      } else if (err?.response?.status) {
        errorMessage = `Error (${err.response.status})`
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground font-sans">
      <div className="w-full max-w-[320px] space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          {/* Logo placeholder or Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary mb-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido a Candas V3
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive animate-in slide-in-from-top-2 fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-foreground" />
              <Input
                id="username"
                type="text"
                {...register('username')}
                placeholder="Usuario"
                className="pl-9 h-10 bg-background border-input/60 focus:border-primary/50 transition-all font-normal placeholder:text-muted-foreground/50"
                autoComplete="username"
              />
            </div>
            {errors.username && (
              <p className="text-[10px] text-destructive pl-1">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-foreground" />
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Contraseña"
                className="pl-9 h-10 bg-background border-input/60 focus:border-primary/50 transition-all font-normal placeholder:text-muted-foreground/50"
                autoComplete="current-password"
              />
            </div>
            {errors.password && (
              <p className="text-[10px] text-destructive pl-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>Ingresar <ArrowRight className="ml-2 h-4 w-4 opacity-50" /></>
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          ¿No tienes acceso?{' '}
          <Link to="/register" className="text-primary hover:underline underline-offset-4 transition-all">
            Solicitar cuenta
          </Link>
        </div>

      </div>
    </div>
  )
}
