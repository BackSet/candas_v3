import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Inbox, ScanBarcode, Truck, ShieldAlert } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Cabecera minimalista de la Landing */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
            C
          </div>
          <span className="text-sm font-semibold tracking-tight">Candas</span>
        </div>
        <div>
          <Button asChild variant="ghost" size="sm" className="rounded-lg text-[13px] font-medium">
            <Link to="/login">
              Iniciar sesión
            </Link>
          </Button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 max-w-5xl mx-auto w-full space-y-16">
        {/* Sección Hero */}
        <section className="text-center space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Plataforma Logística v3
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
            Gestión Integral de Paquetes y Despachos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Candas es la plataforma operativa diseñada para optimizar los procesos de recepción de carga, trazabilidad de ensacado mediante códigos y control logístico de despachos hacia distribuidores.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
            <Button asChild className="h-10 px-6 font-medium rounded-lg shadow-sm w-full sm:w-auto group">
              <Link to="/login">
                Iniciar sesión
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 px-6 font-medium rounded-lg w-full sm:w-auto">
              <Link to="/register">
                Solicitar acceso
              </Link>
            </Button>
          </div>
        </section>

        {/* Sección de Características en Cuadrícula */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-4">
          {/* Característica 1: Recepción */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80 flex flex-col space-y-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Inbox className="size-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Recepción organizada</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Control y registro meticuloso de lotes de ingreso, paquetes recibidos y validación de agencias de origen para asegurar consistencia de inventario.
              </p>
            </div>
          </div>

          {/* Característica 2: Ensacado */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80 flex flex-col space-y-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScanBarcode className="size-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Ensacado y trazabilidad</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Agrupación digital de paquetes físicos en sacas numeradas con códigos de barra únicos, asegurando la trazabilidad de extremo a extremo.
              </p>
            </div>
          </div>

          {/* Característica 3: Despachos */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80 flex flex-col space-y-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="size-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Despachos y salidas</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Preparación ágil de cargas, asignación a distribuidores logísticos y generación automatizada de manifiestos consolidados listos para tránsito.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-border/40 bg-muted/20 py-8 px-6 text-center mt-12 shrink-0">
        <div className="max-w-md mx-auto flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <ShieldAlert className="size-3.5 text-warning" />
            Acceso Autorizado
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Esta plataforma está reservada exclusivamente para el personal y agencias afiliadas de Candas. Las actividades en este sistema son monitoreadas.
          </p>
          <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground/60">
            <span>© {new Date().getFullYear()} Candas. Todos los derechos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
