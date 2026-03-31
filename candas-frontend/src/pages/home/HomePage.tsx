import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, LogIn } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground font-sans">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LogIn className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Candas</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Sistema de gestión logística. Inicia sesión para continuar.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="h-10 min-w-[200px] font-medium">
            <Link to="/login">
              Ir al inicio de sesión
              <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Solicitar acceso
          </Link>
        </p>
      </div>
    </div>
  )
}
