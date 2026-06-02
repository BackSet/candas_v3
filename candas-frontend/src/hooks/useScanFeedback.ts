import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Retroalimentación sonora y háptica para estaciones de escaneo (ensacado).
 *
 * Genera tonos con Web Audio API (sin assets) y vibra el dispositivo cuando
 * está disponible. Pensado para que el operador no necesite mirar la pantalla:
 * - success: confirma que la guía se marcó como ensacada.
 * - warning: la guía ya estaba ensacada (duplicado).
 * - error: guía no encontrada o fallo al marcar.
 *
 * El AudioContext se crea de forma perezosa; los navegadores exigen un gesto
 * del usuario antes de reproducir audio, que aquí ocurre al entrar en modo
 * "escanear". El estado de silencio se persiste en localStorage.
 */

const STORAGE_KEY = 'ensacado:sound-enabled'

type ToneStep = { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number }

function readEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(STORAGE_KEY) !== 'false'
}

export function useScanFeedback() {
  const [enabled, setEnabled] = useState<boolean>(readEnabled)
  const ctxRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioCtx()
      } catch {
        return null
      }
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const playTones = useCallback(
    (steps: ToneStep[]) => {
      if (!enabledRef.current) return
      const ctx = ensureContext()
      if (!ctx) return
      const now = ctx.currentTime
      for (const step of steps) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = step.type ?? 'sine'
        osc.frequency.value = step.freq
        const peak = step.gain ?? 0.12
        const t0 = now + step.start
        const t1 = t0 + step.duration
        // Envolvente suave para evitar clicks
        gain.gain.setValueAtTime(0.0001, t0)
        gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t1)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t0)
        osc.stop(t1 + 0.02)
      }
    },
    [ensureContext]
  )

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!enabledRef.current) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {
        /* noop */
      }
    }
  }, [])

  const success = useCallback(() => {
    playTones([
      { freq: 880, start: 0, duration: 0.09 },
      { freq: 1175, start: 0.1, duration: 0.12 },
    ])
    vibrate(60)
  }, [playTones, vibrate])

  const warning = useCallback(() => {
    playTones([{ freq: 620, start: 0, duration: 0.18, type: 'triangle', gain: 0.14 }])
    vibrate([40, 60, 40])
  }, [playTones, vibrate])

  const error = useCallback(() => {
    playTones([
      { freq: 240, start: 0, duration: 0.16, type: 'square', gain: 0.1 },
      { freq: 170, start: 0.16, duration: 0.22, type: 'square', gain: 0.1 },
    ])
    vibrate([120, 70, 120])
  }, [playTones, vibrate])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, String(next))
      }
      // Reproduce una confirmación corta al activar
      if (next) {
        const ctx = ensureContext()
        if (ctx) {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.frequency.value = 1046
          const now = ctx.currentTime
          gain.gain.setValueAtTime(0.0001, now)
          gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
          osc.connect(gain).connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.12)
        }
      }
      return next
    })
  }, [ensureContext])

  // Cerrar el contexto al desmontar
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        void ctxRef.current.close().catch(() => {})
      }
    }
  }, [])

  return { enabled, toggle, success, warning, error }
}
