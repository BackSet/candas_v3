import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Encapsula la lectura continua de códigos de barras con ZXing (`@zxing/browser`)
 * usando la cámara del dispositivo, tanto en móvil como en escritorio.
 *
 * Estrategia de inicio (robusta cross-platform):
 * 1. Pide permiso con una constraint suave (`facingMode: { ideal: 'environment' }`),
 *    con reintento sin `facingMode` si el dispositivo no la soporta (escritorio).
 * 2. Enumera las cámaras disponibles (las etiquetas solo están tras conceder permiso).
 * 3. Elige la trasera si existe; en caso contrario usa la cámara por defecto.
 * 4. Abre la cámara elegida con `decodeFromVideoDevice(deviceId, video, cb)`, que
 *    asigna el stream a `video.srcObject` y lo reproduce de forma fiable.
 *
 * Expone la lista de dispositivos y permite cambiar de cámara en caliente.
 * Mantiene un enfriamiento (`cooldownMs`) anti-doble-lectura y permite pausar la
 * lectura sin apagar la cámara (`paused`). Requiere contexto seguro (HTTPS o
 * localhost) y `navigator.mediaDevices`; si no, expone `permission: 'unsupported'`.
 */

export type ScannerPermission = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

export interface CameraDevice {
  deviceId: string
  label: string
}

interface UseBarcodeScannerOptions {
  /** Se invoca con el texto decodificado de cada lectura aceptada. */
  onResult: (text: string) => void
  /** Tiempo de enfriamiento para no re-emitir el mismo código (ms). Por defecto 2000. */
  cooldownMs?: number
  /** Si es `true`, ignora las lecturas sin apagar la cámara (bloqueo temporal). */
  paused?: boolean
}

interface UseBarcodeScannerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  permission: ScannerPermission
  isScanning: boolean
  error: string | null
  devices: CameraDevice[]
  selectedDeviceId: string | null
  selectDevice: (deviceId: string) => void
  start: () => Promise<void>
  stop: () => void
}

function isSecureCameraContext(): boolean {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext) return true
  // Permitir desarrollo en localhost aunque no sea HTTPS.
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

/** Prefiere la cámara trasera (móvil); si no la hay, la primera disponible (escritorio). */
function pickPreferredDevice(devices: CameraDevice[]): string | null {
  if (devices.length === 0) return null
  const back = devices.find((d) => /back|rear|trasera|environment|posterior/i.test(d.label))
  return (back ?? devices[0]).deviceId
}

export function useBarcodeScanner({
  onResult,
  cooldownMs = 2000,
  paused = false,
}: UseBarcodeScannerOptions): UseBarcodeScannerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const startingRef = useRef(false)
  // Token incremental para descartar arranques obsoletos (cambio de cámara / desmontaje).
  const startTokenRef = useRef(0)

  // Estado leído dentro del callback de decodificación sin reiniciar la cámara.
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // Antirrebote de la misma lectura.
  const lastTextRef = useRef<string | null>(null)
  const lastAtRef = useRef(0)

  const [permission, setPermission] = useState<ScannerPermission>('idle')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  const handleDecode = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t || pausedRef.current) return
      const now = Date.now()
      if (t === lastTextRef.current && now - lastAtRef.current < cooldownMs) return
      lastTextRef.current = t
      lastAtRef.current = now
      onResultRef.current(t)
    },
    [cooldownMs]
  )

  const stopControls = useCallback(() => {
    try {
      controlsRef.current?.stop()
    } catch {
      /* noop */
    }
    controlsRef.current = null
  }, [])

  /** Abre (o reabre) la cámara indicada y arranca la decodificación continua. */
  const beginDecode = useCallback(
    async (deviceId: string | undefined, token: number) => {
      const video = videoRef.current
      if (!video) return
      const reader = readerRef.current ?? (readerRef.current = new BrowserMultiFormatReader())
      stopControls()

      const controls = await reader.decodeFromVideoDevice(deviceId, video, (result) => {
        if (result) handleDecode(result.getText())
      })

      // El componente pudo desmontarse o cambiar de cámara mientras se resolvía.
      if (token !== startTokenRef.current) {
        try {
          controls.stop()
        } catch {
          /* noop */
        }
        return
      }

      controlsRef.current = controls
      setIsScanning(true)
      setPermission('granted')
      setError(null)
    },
    [handleDecode, stopControls]
  )

  const start = useCallback(async () => {
    if (startingRef.current || controlsRef.current) return

    if (!isSecureCameraContext() || !navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported')
      setError('La cámara requiere un navegador compatible y conexión segura (HTTPS).')
      return
    }

    startingRef.current = true
    const token = ++startTokenRef.current
    setError(null)
    setIsScanning(false)
    setPermission('requesting')

    try {
      // 1) Conceder permiso (necesario para obtener etiquetas de dispositivos) con
      //    constraint suave y reintento sin facingMode para escritorio/webcams.
      let primeStream: MediaStream
      try {
        primeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch (e) {
        const name = (e as { name?: string })?.name
        if (name === 'OverconstrainedError' || name === 'NotFoundError') {
          primeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        } else {
          throw e
        }
      }

      // 2) Enumerar cámaras (ya con etiquetas) y 3) liberar el stream de permiso:
      //    ZXing reabrirá la cámara elegida por deviceId.
      const all = await navigator.mediaDevices.enumerateDevices()
      const cams: CameraDevice[] = all
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Cámara ${i + 1}` }))
      primeStream.getTracks().forEach((t) => t.stop())

      if (token !== startTokenRef.current) return

      setDevices(cams)
      const preferred = pickPreferredDevice(cams)
      setSelectedDeviceId(preferred)

      // 4) Abrir la cámara elegida (deviceId explícito = render fiable en escritorio).
      await beginDecode(preferred ?? undefined, token)
    } catch (err) {
      if (token !== startTokenRef.current) return
      setIsScanning(false)
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermission('denied')
        setError('Permiso de cámara denegado. Habilítalo en el navegador para escanear.')
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
        setPermission('unsupported')
        setError('No se encontró una cámara disponible en este dispositivo.')
      } else {
        setPermission('denied')
        setError('No se pudo iniciar la cámara. Intenta de nuevo o usa el ingreso manual.')
      }
    } finally {
      startingRef.current = false
    }
  }, [beginDecode])

  const stop = useCallback(() => {
    startingRef.current = false
    startTokenRef.current++ // descarta cualquier arranque en curso
    stopControls()
    lastTextRef.current = null
    lastAtRef.current = 0
    setIsScanning(false)
  }, [stopControls])

  const selectDevice = useCallback(
    (deviceId: string) => {
      if (deviceId === selectedDeviceId && controlsRef.current) return
      setSelectedDeviceId(deviceId)
      const token = ++startTokenRef.current
      setIsScanning(false)
      beginDecode(deviceId, token).catch(() => {
        setError('No se pudo cambiar de cámara.')
      })
    },
    [beginDecode, selectedDeviceId]
  )

  // Liberar la cámara al desmontar.
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    videoRef,
    permission,
    isScanning,
    error,
    devices,
    selectedDeviceId,
    selectDevice,
    start,
    stop,
  }
}
