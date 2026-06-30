import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CameraDevice, ScannerPermission } from '@/hooks/useBarcodeScanner'
import { CameraOff, Loader2, ScanLine, SwitchCamera } from 'lucide-react'
import { useState } from 'react'

interface MobileScannerPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  permission: ScannerPermission
  isScanning: boolean
  /** Bloqueo temporal tras una lectura: atenúa la cámara y muestra "Procesando…". */
  paused: boolean
  error: string | null
  /** Cámaras disponibles (para permitir cambiar de cámara). */
  devices: CameraDevice[]
  selectedDeviceId: string | null
  onSelectDevice: (deviceId: string) => void
  /** Inicia / reintenta el acceso a la cámara. */
  onStart: () => void
  /** Envío manual de guía (fallback sin cámara). */
  onManualSubmit: (guia: string) => void
}

/**
 * Zona inferior de la pantalla de lector móvil: vista de cámara con overlay de
 * escaneo, estados de permiso/error, selector de cámara (si hay varias) y un
 * ingreso manual de guía como alternativa cuando la cámara no está disponible o el
 * operador prefiere teclear. Funciona en móvil y escritorio.
 */
export function MobileScannerPanel({
  videoRef,
  permission,
  isScanning,
  paused,
  error,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onStart,
  onManualSubmit,
}: MobileScannerPanelProps) {
  const [manual, setManual] = useState('')

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault()
    const guia = manual.trim()
    if (!guia) return
    onManualSubmit(guia)
    setManual('')
  }

  const cycleCamera = () => {
    if (devices.length < 2) return
    const idx = devices.findIndex((d) => d.deviceId === selectedDeviceId)
    const next = devices[(idx + 1) % devices.length]
    onSelectDevice(next.deviceId)
  }

  const camaraBloqueada = permission === 'denied' || permission === 'unsupported'
  const selectedLabel =
    devices.find((d) => d.deviceId === selectedDeviceId)?.label ?? null
  const statusText = paused ? 'Procesando…' : 'Cámara activa · apunta al código de barras'

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/60 bg-foreground/90 shadow-sm sm:aspect-video">
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

        {/* Overlay de marco de escaneo (transparente, no tapa el video) */}
        {isScanning ? (
          <>
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
            </div>

            {/* Selector de cámara cuando hay más de una */}
            {devices.length > 1 ? (
              <button
                type="button"
                onClick={cycleCamera}
                className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-foreground/60 px-2.5 py-1 text-xs font-medium text-background backdrop-blur-sm transition-colors hover:bg-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                title="Cambiar cámara"
                aria-label="Cambiar cámara"
              >
                <SwitchCamera className="size-4" />
                <span className="hidden sm:inline">Cambiar cámara</span>
              </button>
            ) : null}

            {/* Estado en la parte inferior */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 px-3 text-center">
              <span className="rounded-full bg-foreground/60 px-3 py-1 text-xs font-medium text-background backdrop-blur-sm">
                {statusText}
              </span>
              {selectedLabel && devices.length > 1 && !paused ? (
                <p className="mt-1 truncate text-[10px] text-background/80">{selectedLabel}</p>
              ) : null}
            </div>
          </>
        ) : null}

        {/* Estado: solicitando permiso / buscando cámara */}
        {permission === 'requesting' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-background">
            <Loader2 className="size-7 animate-spin" />
            <p className="text-sm font-medium">Buscando cámara…</p>
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
            <p className="text-sm font-semibold text-background">
              {permission === 'denied' ? 'Permiso denegado' : 'No se encontró cámara'}
            </p>
            <p className="max-w-xs text-xs text-background/80">
              {error ?? 'La cámara no está disponible. Usa el ingreso manual.'}
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
