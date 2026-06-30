import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ScannerPermission } from '@/hooks/useBarcodeScanner'
import { CameraOff, Loader2, ScanLine } from 'lucide-react'
import { useState } from 'react'

interface MobileScannerPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  permission: ScannerPermission
  isScanning: boolean
  /** Bloqueo temporal tras una lectura: atenúa la cámara y muestra "Procesando…". */
  paused: boolean
  error: string | null
  /** Inicia / reintenta el acceso a la cámara. */
  onStart: () => void
  /** Envío manual de guía (fallback sin cámara). */
  onManualSubmit: (guia: string) => void
  /** Texto de estado contextual (p. ej. "Apunta al código de barras"). */
  hint?: string
}

/**
 * Zona inferior de la pantalla de lector móvil: vista de cámara con overlay de
 * escaneo, estados de permiso/error y un ingreso manual de guía como alternativa
 * cuando la cámara no está disponible o el operador prefiere teclear.
 */
export function MobileScannerPanel({
  videoRef,
  permission,
  isScanning,
  paused,
  error,
  onStart,
  onManualSubmit,
  hint,
}: MobileScannerPanelProps) {
  const [manual, setManual] = useState('')

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault()
    const guia = manual.trim()
    if (!guia) return
    onManualSubmit(guia)
    setManual('')
  }

  const camaraBloqueada = permission === 'denied' || permission === 'unsupported'

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/60 bg-foreground/95 shadow-sm sm:aspect-video">
        {/* La cámara siempre monta el <video>; los estados se superponen encima. */}
        <video
          ref={videoRef}
          className={cn(
            'size-full object-cover transition-opacity duration-200',
            isScanning ? 'opacity-100' : 'opacity-0',
            paused && 'opacity-40'
          )}
          muted
          playsInline
          autoPlay
        />

        {/* Overlay de marco de escaneo cuando la cámara está activa */}
        {isScanning ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'relative h-2/5 w-4/5 rounded-xl border-2 transition-colors duration-200 sm:w-3/5',
                paused ? 'border-success' : 'border-background/80'
              )}
            >
              <span className="absolute -left-0.5 -top-0.5 size-5 rounded-tl-xl border-l-2 border-t-2 border-primary" />
              <span className="absolute -right-0.5 -top-0.5 size-5 rounded-tr-xl border-r-2 border-t-2 border-primary" />
              <span className="absolute -bottom-0.5 -left-0.5 size-5 rounded-bl-xl border-b-2 border-l-2 border-primary" />
              <span className="absolute -bottom-0.5 -right-0.5 size-5 rounded-br-xl border-b-2 border-r-2 border-primary" />
              {!paused ? (
                <ScanLine className="absolute inset-x-0 top-1/2 mx-auto size-8 -translate-y-1/2 text-primary/70" />
              ) : null}
            </div>
            <div className="absolute inset-x-0 bottom-3 text-center">
              <span className="rounded-full bg-foreground/60 px-3 py-1 text-xs font-medium text-background backdrop-blur-sm">
                {paused ? 'Procesando…' : (hint ?? 'Apunta al código de barras')}
              </span>
            </div>
          </div>
        ) : null}

        {/* Estado: solicitando permiso */}
        {permission === 'requesting' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-background">
            <Loader2 className="size-7 animate-spin" />
            <p className="text-sm font-medium">Solicitando cámara…</p>
          </div>
        ) : null}

        {/* Estado: cámara sin iniciar */}
        {permission === 'idle' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-background">
            <ScanLine className="size-9 opacity-80" />
            <Button type="button" variant="secondary" onClick={onStart}>
              Activar cámara
            </Button>
          </div>
        ) : null}

        {/* Estado: cámara denegada o no disponible */}
        {camaraBloqueada ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-background">
            <CameraOff className="size-9 opacity-80" />
            <p className="max-w-xs text-sm text-background/90">
              {error ?? 'La cámara no está disponible.'}
            </p>
            {permission === 'denied' ? (
              <Button type="button" variant="secondary" onClick={onStart}>
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Ingreso manual: siempre disponible como alternativa al escaneo */}
      <form onSubmit={handleManual} className="space-y-2">
        <Label htmlFor="lectorManualGuia" className="sr-only">
          Ingresar número de guía manualmente
        </Label>
        <div className="flex gap-2">
          <Input
            id="lectorManualGuia"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={camaraBloqueada ? 'Escribe la guía…' : 'O escribe la guía…'}
            className="h-11 font-mono"
            autoComplete="off"
            inputMode="text"
            enterKeyHint="search"
          />
          <Button type="submit" variant="outline" disabled={!manual.trim()} className="h-11 shrink-0">
            Buscar
          </Button>
        </div>
      </form>
    </div>
  )
}
