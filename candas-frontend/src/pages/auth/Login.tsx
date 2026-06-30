import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/api/auth.service'
import { API_BASE_URL } from '@/lib/api/openapi-client'
import { getApiErrorMessage,getNetworkErrorHint,isNetworkOrCorsError } from '@/lib/api/errors'
import { applyPageMeta } from '@/lib/document-meta'
import type { LoginRequest } from '@/types/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link,useNavigate } from '@tanstack/react-router'
import { AlertCircle,ArrowRight,Loader2,Lock,User } from 'lucide-react'
import { useEffect,useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applyPageMeta({
      title: 'Iniciar sesión',
      description:
        'Accede a Candas para gestionar recepción, despachos, ensacado y manifiestos de paquetes en bodega.',
    })
  }, [])

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
    } catch (err: unknown) {
      let errorMessage = 'Error al iniciar sesión'
      const errObj = err as { code?: string; response?: { status?: number; data?: { message?: string } } }
      if (isNetworkOrCorsError(err)) {
        errorMessage = getNetworkErrorHint(API_BASE_URL)
      } else if (errObj?.response?.status === 401) {
        errorMessage = 'Credenciales incorrectas'
      } else if (errObj?.response?.data?.message) {
        errorMessage = errObj.response.data.message
      } else if (errObj?.response?.status) {
        errorMessage = `Error (${errObj.response.status})`
      } else {
        errorMessage = getApiErrorMessage(err, 'Error al iniciar sesión')
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 p-4 text-foreground font-sans">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-[360px] animate-scale-in">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-xl">

          {/* Header */}
          <div className="flex flex-col items-center space-y-2 text-center">
            {/* Logo */}
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-primary-foreground shadow-lg shadow-primary/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido a Candas V3
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
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

          <div className="mt-6 text-center text-xs text-muted-foreground">
            ¿No tienes acceso?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline underline-offset-4 transition-all">
              Solicitar cuenta
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
