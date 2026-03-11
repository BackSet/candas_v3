import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/lib/api/auth.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { RegisterRequest } from '@/types/user'

const registerSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  nombreCompleto: z.string().min(2, 'El nombre completo es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export default function Register() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterRequest) => {
    setLoading(true)
    setError(null)
    try {
      await authService.register(data)
      // Después de registrar, redirigir a login para que el usuario inicie sesión
      navigate({ to: '/login', state: { message: 'Registro exitoso. Por favor inicia sesión.' } })
    } catch (err: unknown) {
      let errorMessage = 'Error al registrar usuario'
      const errObj = err as { code?: string; response?: { status?: number; data?: { message?: string } } }
      if (errObj?.code === 'ERR_NETWORK' || !errObj?.response) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución y que la URL de la API sea correcta.'
      } else if (errObj?.response?.status === 400) {
        errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos'
      } else if (errObj?.response?.status === 409) {
        errorMessage = 'El usuario o email ya existe'
      } else if (errObj?.response?.data?.message) {
        errorMessage = errObj.response.data.message
      } else if (errObj?.response?.status) {
        errorMessage = `Error del servidor (${errObj.response.status})`
      } else {
        errorMessage = getApiErrorMessage(err, 'Error al registrar usuario')
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Regístrate para comenzar a usar Candas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md border border-error bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Nombre de Usuario
              </label>
              <Input
                id="username"
                type="text"
                {...register('username')}
                placeholder="usuario"
                className={errors.username ? 'border-error' : ''}
              />
              {errors.username && (
                <p className="text-xs text-error">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="usuario@ejemplo.com"
                className={errors.email ? 'border-error' : ''}
              />
              {errors.email && (
                <p className="text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="nombreCompleto" className="text-sm font-medium">
                Nombre Completo
              </label>
              <Input
                id="nombreCompleto"
                type="text"
                {...register('nombreCompleto')}
                placeholder="Juan Pérez"
                className={errors.nombreCompleto ? 'border-error' : ''}
              />
              {errors.nombreCompleto && (
                <p className="text-xs text-error">{errors.nombreCompleto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={errors.password ? 'border-error' : ''}
              />
              {errors.password && (
                <p className="text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-foreground underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
