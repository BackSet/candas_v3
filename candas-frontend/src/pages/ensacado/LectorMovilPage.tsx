import { EnsacadoLayoutHeader } from '@/components/ensacado/EnsacadoLayoutHeader'
import { MobilePackageInfoPanel } from '@/components/ensacado/MobilePackageInfoPanel'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { esGuiaValidaParaBuscar, useBuscarPaquete } from '@/hooks/useEnsacado'
import { useScanFeedback } from '@/hooks/useScanFeedback'
import { getApiErrorMessage, getApiStatus } from '@/lib/api/errors'
import { ScanBarcode, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lector móvil de Ensacado: usa la cámara del teléfono (ZXing) como lector de
 * códigos de barras y muestra, en el mismo dispositivo, la información del paquete
 * de la guía leída.
 *
 * Zona superior: información del paquete. Zona inferior: cámara/lector con ingreso
 * manual de respaldo. Es una vista de consulta/validación rápida: NO marca el
 * paquete como ensacado.
 *
 * Tras cada lectura se aplica un bloqueo temporal (`LOCK_MS`) que pausa el lector
 * sin apagar la cámara, evitando relecturas de la misma guía mientras se consulta
 * y se da feedback visual/sonoro/háptico.
 */

const LOCK_MS = 1800

function LectorMovilPage() {
  const [guia, setGuia] = useState('')
  const [locked, setLocked] = useState(false)
  const [highlightSuccess, setHighlightSuccess] = useState(false)

  const feedback = useScanFeedback()

  // Guía para la que ya se emitió feedback (una sola vez por lectura).
  const guiaProcesadaRef = useRef('')
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const guiaValida = esGuiaValidaParaBuscar(guia)
  const {
    data: paqueteInfo,
    isFetching,
    error: errorPaquete,
  } = useBuscarPaquete(guiaValida ? guia : undefined)

  const programarDesbloqueo = useCallback(() => {
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    unlockTimerRef.current = setTimeout(() => setLocked(false), LOCK_MS)
  }, [])

  const handleScan = useCallback((text: string) => {
    const limpio = text.trim()
    if (!limpio) return
    setGuia(limpio)
    setLocked(true)
  }, [])

  const scanner = useBarcodeScanner({ onResult: handleScan, paused: locked, cooldownMs: 2000 })

  // Iniciar la cámara al entrar a la pantalla.
  const { start } = scanner
  useEffect(() => {
    void start()
  }, [start])

  // Feedback (sonido/vibración/visual) una sola vez por guía, al asentarse la consulta.
  useEffect(() => {
    const g = guia.trim()
    if (!g || guiaProcesadaRef.current === g) return

    // Guía demasiado corta o sospechosa: no se consulta.
    if (!guiaValida) {
      guiaProcesadaRef.current = g
      feedback.error()
      programarDesbloqueo()
      return
    }

    if (isFetching) return

    if (errorPaquete) {
      guiaProcesadaRef.current = g
      feedback.error()
      programarDesbloqueo()
      return
    }

    if (paqueteInfo) {
      guiaProcesadaRef.current = g
      if (paqueteInfo.yaEnsacado) {
        feedback.warning()
      } else {
        feedback.success()
        setHighlightSuccess(true)
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
        highlightTimerRef.current = setTimeout(() => setHighlightSuccess(false), 1200)
      }
      programarDesbloqueo()
    }
  }, [guia, guiaValida, isFetching, paqueteInfo, errorPaquete, feedback, programarDesbloqueo])

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [])

  const errorMessage =
    guia && !guiaValida
      ? 'Guía demasiado corta o no válida'
      : guiaValida && errorPaquete && !isFetching
        ? getApiStatus(errorPaquete) === 404
          ? 'Paquete no encontrado'
          : getApiErrorMessage(errorPaquete, 'Error al buscar el paquete')
        : null

  const infoActiva = guiaValida && !errorPaquete ? (paqueteInfo ?? null) : null
  const cargando = guiaValida && isFetching && !paqueteInfo

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <EnsacadoLayoutHeader
        title="Lector móvil"
        subtitle="Consulta rápida de paquetes"
        backTo="/ensacado"
        showScanIcon
        trailing={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={feedback.toggle}
            className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
            title={feedback.enabled ? 'Silenciar sonido de escaneo' : 'Activar sonido de escaneo'}
            aria-label={feedback.enabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {feedback.enabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        {/* Zona superior: información del paquete */}
        <MobilePackageInfoPanel
          info={infoActiva}
          isLoading={cargando}
          errorMessage={errorMessage}
          guiaConsultada={guia || null}
          highlightSuccess={highlightSuccess}
        />

        {/* Zona inferior: cámara / lector */}
        <div className="mt-auto">
          <MobileScannerPanel
            videoRef={scanner.videoRef}
            permission={scanner.permission}
            isScanning={scanner.isScanning}
            paused={locked}
            error={scanner.error}
            onStart={() => void scanner.start()}
            onManualSubmit={handleScan}
          />
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <AppIcon icon={ScanBarcode} size="xs" />
            Vista de consulta · no marca el paquete como ensacado
          </p>
        </div>
      </div>
    </div>
  )
}

export default LectorMovilPage
