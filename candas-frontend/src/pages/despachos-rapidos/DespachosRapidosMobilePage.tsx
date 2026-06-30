import { EnsacadoLayoutHeader } from '@/components/ensacado/EnsacadoLayoutHeader'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import { DestinoSelector } from '@/components/despachos-rapidos/DestinoSelector'
import { SacaActivaCard } from '@/components/despachos-rapidos/SacaActivaCard'
import { SacasPaquetesList } from '@/components/despachos-rapidos/SacasPaquetesList'
import { DESPACHOS_RAPIDOS_POLL } from '@/constants/despachosRapidos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useScanFeedback } from '@/hooks/useScanFeedback'
import { despachoRapidoService } from '@/lib/api/despacho-rapido.service'
import { notify } from '@/lib/notify'
import type { DespachoRapido } from '@/types/despacho-rapido'
import { ESTADO_DESPACHO_RAPIDO_LABEL } from '@/types/despacho-rapido'
import type { TamanoSaca } from '@/types/saca'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, PackagePlus, Truck, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const LOCK_MS = 1200

function DespachosRapidosMobilePage() {
  const [despacho, setDespacho] = useState<DespachoRapido | null>(null)
  const [activeSacaId, setActiveSacaId] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)

  const feedback = useScanFeedback()
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

  const cerrado = despacho?.estado === 'LISTO_PARA_GUIA' || despacho?.estado === 'FINALIZADO'
  const despachoId = despacho?.idDespacho

  const lockBriefly = useCallback(() => {
    setLocked(true)
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    unlockTimerRef.current = setTimeout(() => setLocked(false), LOCK_MS)
  }, [])

  /** Aplica el DTO devuelto y reconcilia la saca activa (la mantiene si sigue existiendo). */
  const aplicar = useCallback(
    (dto: DespachoRapido) => {
      setDespacho(dto)
      setActiveSacaId((prev) => {
        if (prev != null && dto.sacas.some((s) => s.idSaca === prev)) return prev
        return dto.sacas.length > 0 ? dto.sacas[dto.sacas.length - 1].idSaca : null
      })
    },
    []
  )

  const despachoQuery = useQuery({
    queryKey: ['despachos-rapidos', 'detalle', despachoId],
    queryFn: () => despachoRapidoService.obtener(despachoId!),
    enabled: despachoId != null,
    refetchInterval: despachoId != null ? DESPACHOS_RAPIDOS_POLL.mobileMs : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  useEffect(() => {
    if (!despachoQuery.data) return
    aplicar(despachoQuery.data)
  }, [aplicar, despachoQuery.data])

  const cachearDespacho = useCallback(
    (dto: DespachoRapido) => {
      queryClient.setQueryData(['despachos-rapidos', 'detalle', dto.idDespacho], dto)
      void queryClient.invalidateQueries({ queryKey: ['despachos-rapidos'] })
    },
    [queryClient]
  )

  const refrescarDespachoActual = useCallback(() => {
    if (despachoId == null) return
    void queryClient.invalidateQueries({ queryKey: ['despachos-rapidos', 'detalle', despachoId] })
    void queryClient.invalidateQueries({ queryKey: ['despachos-rapidos'] })
  }, [despachoId, queryClient])

  // --- Mutaciones ---
  const crearMut = useMutation({
    mutationFn: () => despachoRapidoService.crear({}),
    onSuccess: (dto) => {
      setDespacho(dto)
      setActiveSacaId(null)
      cachearDespacho(dto)
    },
    onError: (e) => notify.error(e, 'No se pudo crear el despacho rápido'),
  })

  const agregarMut = useMutation({
    mutationFn: (guia: string) =>
      despachoRapidoService.agregarPaquete(despacho!.idDespacho, {
        numeroGuia: guia,
        idSaca: activeSacaId ?? undefined,
      }),
    onSuccess: (dto, guia) => {
      setDespacho(dto)
      cachearDespacho(dto)
      const sacaConGuia = dto.sacas.find((s) =>
        s.paquetes.some((p) => p.numeroGuia.toLowerCase() === guia.trim().toLowerCase())
      )
      setActiveSacaId(sacaConGuia ? sacaConGuia.idSaca : activeSacaId)
      feedback.success()
      lockBriefly()
    },
    onError: (e) => {
      feedback.error()
      notify.error(e, 'No se pudo agregar la guía')
      refrescarDespachoActual()
    },
  })

  const moverMut = useMutation({
    mutationFn: (vars: { idPaquete: number; idSacaDestino: number }) =>
      despachoRapidoService.moverPaquete(despacho!.idDespacho, vars),
    onSuccess: (dto) => {
      aplicar(dto)
      cachearDespacho(dto)
      notify.success('Paquete movido')
    },
    onError: (e) => {
      notify.error(e, 'No se pudo mover el paquete')
      refrescarDespachoActual()
    },
  })

  const nuevaSacaMut = useMutation({
    mutationFn: (tamanoSaca: TamanoSaca) =>
      despachoRapidoService.crearSaca(despacho!.idDespacho, { tamanoSaca }),
    onSuccess: (dto) => {
      setDespacho(dto)
      cachearDespacho(dto)
      if (dto.sacas.length > 0) setActiveSacaId(dto.sacas[dto.sacas.length - 1].idSaca)
    },
    onError: (e) => {
      notify.error(e, 'No se pudo crear la saca')
      refrescarDespachoActual()
    },
  })

  const presintoMut = useMutation({
    mutationFn: (vars: { idSaca: number; codigoPresinto: string }) =>
      despachoRapidoService.actualizarPresinto(despacho!.idDespacho, vars.idSaca, {
        codigoPresinto: vars.codigoPresinto,
      }),
    onSuccess: (dto) => {
      aplicar(dto)
      cachearDespacho(dto)
      notify.success('Presinto actualizado')
    },
    onError: (e) => {
      notify.error(e, 'No se pudo actualizar el presinto')
      refrescarDespachoActual()
    },
  })

  const destinoMut = useMutation({
    mutationFn: (payload: Parameters<typeof despachoRapidoService.actualizarDestino>[1]) =>
      despachoRapidoService.actualizarDestino(despacho!.idDespacho, payload),
    onSuccess: (dto) => {
      aplicar(dto)
      cachearDespacho(dto)
      notify.success('Destino actualizado')
    },
    onError: (e) => {
      notify.error(e, 'No se pudo actualizar el destino')
      refrescarDespachoActual()
    },
  })

  const listoMut = useMutation({
    mutationFn: () => despachoRapidoService.marcarListoParaGuia(despacho!.idDespacho),
    onSuccess: (dto) => {
      aplicar(dto)
      cachearDespacho(dto)
      feedback.success()
      notify.success('Despacho marcado como listo para guía')
    },
    onError: (e) => {
      notify.error(e, 'No se pudo marcar listo para guía')
      refrescarDespachoActual()
    },
  })

  // --- Captura ---
  const handleScan = useCallback(
    (texto: string) => {
      const guia = texto.trim()
      if (!guia || !despacho || cerrado || agregarMut.isPending) return
      agregarMut.mutate(guia)
    },
    [despacho, cerrado, agregarMut]
  )

  const scanner = useBarcodeScanner({
    onResult: handleScan,
    paused: locked || agregarMut.isPending,
    cooldownMs: 2000,
  })
  const { start: startScanner, stop: stopScanner } = scanner

  // Iniciar/detener la cámara según haya un despacho abierto.
  useEffect(() => {
    if (despacho && !cerrado) {
      void startScanner()
    } else {
      stopScanner()
    }
  }, [despacho, cerrado, startScanner, stopScanner])

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    }
  }, [])

  const sacaActiva =
    despacho?.sacas.find((s) => s.idSaca === activeSacaId) ??
    (despacho && despacho.sacas.length > 0 ? despacho.sacas[despacho.sacas.length - 1] : null)

  const destinoDefinido = !!(despacho?.idAgencia || despacho?.idDestinatarioDirecto)
  const puedeMarcarListo = !!despacho && destinoDefinido && despacho.totalPaquetes > 0

  // --- Pantalla inicial: sin despacho ---
  if (!despacho) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <EnsacadoLayoutHeader title="Despacho rápido" subtitle="Captura móvil" showScanIcon />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Truck className="size-8" />
          </div>
          <div className="max-w-sm space-y-1">
            <h2 className="text-xl font-bold">Iniciar despacho rápido</h2>
            <p className="text-sm text-muted-foreground">
              Crea un borrador y empieza a escanear paquetes en sacas. El destino y la guía del
              distribuidor pueden definirse después.
            </p>
          </div>
          <Button onClick={() => crearMut.mutate()} disabled={crearMut.isPending} size="lg" className="gap-2">
            <PackagePlus className="size-5" />
            {crearMut.isPending ? 'Creando…' : 'Crear despacho'}
          </Button>
        </div>
      </div>
    )
  }

  // --- Pantalla de cierre: LISTO_PARA_GUIA / FINALIZADO ---
  if (cerrado) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <EnsacadoLayoutHeader
          title="Despacho rápido"
          subtitle={despacho.numeroManifiesto ?? undefined}
        />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4">
          <div className="surface-panel flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <Badge variant="success" className="mb-2">
                {ESTADO_DESPACHO_RAPIDO_LABEL[despacho.estado]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {despacho.estado === 'LISTO_PARA_GUIA'
                  ? 'El despacho quedó listo para que otro dispositivo le asigne la guía del distribuidor.'
                  : 'Despacho finalizado.'}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 pt-2 text-sm">
              <Resumen label="Destino" valor={despacho.nombreAgencia ?? despacho.nombreDestinatarioDirecto ?? '—'} />
              <Resumen label="Manifiesto" valor={despacho.numeroManifiesto ?? '—'} />
              <Resumen label="Sacas" valor={String(despacho.totalSacas)} />
              <Resumen label="Paquetes" valor={String(despacho.totalPaquetes)} />
            </div>
          </div>

          <SacasPaquetesList
            sacas={despacho.sacas}
            activeSacaId={null}
            onSeleccionarActiva={() => {}}
            onMoverPaquete={() => {}}
            moviendo={false}
            disabled
          />

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              setDespacho(null)
              setActiveSacaId(null)
            }}
          >
            <PackagePlus className="size-4" />
            Nuevo despacho rápido
          </Button>
        </div>
      </div>
    )
  }

  // --- Pantalla principal de captura ---
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <EnsacadoLayoutHeader
        title="Despacho rápido"
        subtitle={`${despacho.numeroManifiesto ?? 'Borrador'} · ${despacho.totalPaquetes} paq.`}
        showScanIcon
        trailing={
          <div className="flex items-center gap-1.5">
            <Badge variant={despacho.estado === 'EN_ENSACADO' ? 'info' : 'secondary'}>
              {ESTADO_DESPACHO_RAPIDO_LABEL[despacho.estado]}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={feedback.toggle}
              className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
              title={feedback.enabled ? 'Silenciar sonido' : 'Activar sonido'}
              aria-label={feedback.enabled ? 'Silenciar sonido' : 'Activar sonido'}
            >
              {feedback.enabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </Button>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        <SacaActivaCard
          saca={sacaActiva}
          onNuevaSaca={(tamano) => nuevaSacaMut.mutate(tamano)}
          onGuardarPresinto={(idSaca, codigo) => presintoMut.mutate({ idSaca, codigoPresinto: codigo })}
          creandoSaca={nuevaSacaMut.isPending}
          guardandoPresinto={presintoMut.isPending}
        />

        <MobileScannerPanel
          videoRef={scanner.videoRef}
          permission={scanner.permission}
          isScanning={scanner.isScanning}
          paused={locked || agregarMut.isPending}
          error={scanner.error}
          devices={scanner.devices}
          selectedDeviceId={scanner.selectedDeviceId}
          onSelectDevice={scanner.selectDevice}
          onStart={() => void scanner.start()}
          onManualSubmit={handleScan}
        />

        <SacasPaquetesList
          sacas={despacho.sacas}
          activeSacaId={sacaActiva?.idSaca ?? null}
          onSeleccionarActiva={(idSaca) => setActiveSacaId(idSaca)}
          onMoverPaquete={(idPaquete, idSacaDestino) => moverMut.mutate({ idPaquete, idSacaDestino })}
          moviendo={moverMut.isPending}
        />

        <DestinoSelector
          despacho={despacho}
          onGuardar={(payload) => destinoMut.mutate(payload)}
          guardando={destinoMut.isPending}
        />

        <Button
          type="button"
          className="w-full gap-2"
          size="lg"
          disabled={!puedeMarcarListo || listoMut.isPending}
          onClick={() => listoMut.mutate()}
        >
          <CheckCircle2 className="size-5" />
          {listoMut.isPending ? 'Marcando…' : 'Marcar listo para guía'}
        </Button>
        {!destinoDefinido ? (
          <p className="-mt-2 text-center text-xs text-warning">
            Define un destino antes de marcar listo para guía.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Resumen({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/60 p-2.5 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{valor}</p>
    </div>
  )
}

export default DespachosRapidosMobilePage
