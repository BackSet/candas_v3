import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Encapsula la lectura continua de códigos de barras con ZXing (`@zxing/browser`)
 * usando la cámara del dispositivo (preferentemente la trasera en móviles).
 *
 * Responsabilidades:
 * - Pedir acceso a la cámara y exponer el estado del permiso.
 * - Decodificar de forma continua sobre un `<video>` controlado por `videoRef`.
 * - Evitar doble lectura del mismo código mediante un enfriamiento (`cooldownMs`).
 * - Permitir pausar la lectura sin apagar la cámara (`paused`), p. ej. mientras se
 *   consulta la guía recién leída (bloqueo temporal).
 * - Liberar la cámara de forma segura al detener o desmontar.
 *
 * Requiere contexto seguro (HTTPS o localhost) y `navigator.mediaDevices`; si no
 * están disponibles, expone `permission: 'unsupported'` para que la UI ofrezca el
 * ingreso manual como alternativa.
 */

export type ScannerPermission = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

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

export function useBarcodeScanner({
  onResult,
  cooldownMs = 2000,
  paused = false,
}: UseBarcodeScannerOptions): UseBarcodeScannerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const startingRef = useRef(false)

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

  const stop = useCallback(() => {
    startingRef.current = false
    try {
      controlsRef.current?.stop()
    } catch {
      /* noop */
    }
    controlsRef.current = null
    lastTextRef.current = null
    lastAtRef.current = 0
    setIsScanning(false)
  }, [])

  const start = useCallback(async () => {
    if (controlsRef.current || startingRef.current) return

    if (!isSecureCameraContext() || !navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported')
      setError('La cámara requiere un navegador compatible y conexión segura (HTTPS).')
      return
    }

    startingRef.current = true
    setError(null)
    setPermission('requesting')

    try {
      const reader = readerRef.current ?? new BrowserMultiFormatReader()
      readerRef.current = reader

      const video = videoRef.current
      if (!video) {
        startingRef.current = false
        setPermission('idle')
        return
      }

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        video,
        (result) => {
          if (!result) return
          if (pausedRef.current) return
          const text = result.getText().trim()
          if (!text) return
          const now = Date.now()
          if (text === lastTextRef.current && now - lastAtRef.current < cooldownMs) return
          lastTextRef.current = text
          lastAtRef.current = now
          onResultRef.current(text)
        }
      )

      // El componente pudo desmontarse mientras se resolvía el permiso.
      if (!startingRef.current) {
        controls.stop()
        return
      }

      controlsRef.current = controls
      startingRef.current = false
      setPermission('granted')
      setIsScanning(true)
    } catch (err) {
      startingRef.current = false
      setIsScanning(false)
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermission('denied')
        setError('Permiso de cámara denegado. Habilítalo en el navegador para escanear.')
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setPermission('unsupported')
        setError('No se encontró una cámara disponible en este dispositivo.')
      } else {
        setPermission('denied')
        setError('No se pudo iniciar la cámara. Intenta de nuevo o usa el ingreso manual.')
      }
    }
  }, [cooldownMs])

  // Liberar la cámara al desmontar.
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { videoRef, permission, isScanning, error, start, stop }
}
