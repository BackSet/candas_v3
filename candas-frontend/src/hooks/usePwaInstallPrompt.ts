import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Lógica de instalación de la PWA, agnóstica de UI.
 *
 * - Captura el evento `beforeinstallprompt` (Chrome/Edge/Android) para poder
 *   disparar el diálogo nativo de instalación cuando el usuario lo pida.
 * - Detecta si la app ya corre en modo standalone (instalada) para ocultar la
 *   acción.
 * - Detecta iOS, donde no existe `beforeinstallprompt`: se ofrece una guía manual
 *   ("Compartir → Añadir a pantalla de inicio").
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type PromptOutcome = 'accepted' | 'dismissed' | 'unavailable'

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return Boolean(displayStandalone || iosStandalone)
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isIphoneIpad = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ se presenta como "MacIntel" con pantalla táctil.
  const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIphoneIpad || isIpadOS
}

export interface UsePwaInstallPrompt {
  /** Instalación nativa disponible (beforeinstallprompt capturado). */
  canInstall: boolean
  /** En iOS no hay prompt nativo: mostrar instrucciones manuales. */
  canShowIosHint: boolean
  isStandalone: boolean
  isIOS: boolean
  isInstalled: boolean
  /** Dispara el diálogo nativo de instalación. */
  promptInstall: () => Promise<PromptOutcome>
}

export function usePwaInstallPrompt(): UsePwaInstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const isStandalone = useMemo(() => detectStandalone(), [])
  const isIOS = useMemo(() => detectIOS(), [])

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Evita el mini-infobar automático para controlar el momento de instalar.
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<PromptOutcome> => {
    if (!deferred) return 'unavailable'
    await deferred.prompt()
    const choice = await deferred.userChoice
    // El evento solo puede usarse una vez.
    setDeferred(null)
    return choice.outcome
  }, [deferred])

  const canInstall = Boolean(deferred) && !isStandalone && !isInstalled
  const canShowIosHint = isIOS && !isStandalone && !isInstalled

  return { canInstall, canShowIosHint, isStandalone, isIOS, isInstalled, promptInstall }
}
