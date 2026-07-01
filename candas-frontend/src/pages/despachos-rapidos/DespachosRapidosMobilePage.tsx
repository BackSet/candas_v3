import { EnsacadoLayoutHeader } from '@/components/ensacado/EnsacadoLayoutHeader'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDeleteDialog } from '@/components/dialogs/ConfirmDeleteDialog'
import { MobileScannerPanel } from '@/components/ensacado/MobileScannerPanel'
import { paqueteService } from '@/lib/api/paquete.service'
import { DestinoSelector } from '@/components/despachos-rapidos/DestinoSelector'
import { DespachoRapidoActivoCard } from '@/components/despachos-rapidos/DespachoRapidoActivoCard'
import { DespachosRapidosMobileList } from '@/components/despachos-rapidos/DespachosRapidosMobileList'
import { PaquetesTipeadosPanel } from '@/components/despachos-rapidos/PaquetesTipeadosPanel'
import { SacaActivaPanel } from '@/components/despachos-rapidos/SacaActivaPanel'
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
import { calcularTamanoSugerido } from '@/utils/saca'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, PackagePlus, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const LOCK_MS = 1200
const ACTIVE_DESPACHO_STORAGE_KEY = 'candas-despacho-rapido-mobile-active-id'

function normalizarNumeroGuia(numeroGuia: string): string {
  return numeroGuia.trim().toUpperCase()
}

function readStoredDespachoId(): number | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(ACTIVE_DESPACHO_STORAGE_KEY)
  const parsed = value ? Number(value) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function debugDespachoRapidoMobile(evento: string, data?: unknown) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return
  if (window.localStorage.getItem('candas-debug-despacho-rapido') !== '1') return
  console.debug(`[despacho-rapido-mobile] ${evento}`, data)
}

function DespachosRapidosMobilePage() {
  const [activeDespachoId, setActiveDespachoId] = useState<number | null>(() => readStoredDespachoId())
  const [despacho, setDespacho] = useState<DespachoRapido | null>(null)
  const [activeSacaId, setActiveSacaId] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [permitirNoRegistrados, setPermitirNoRegistrados] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

  const feedback = useScanFeedback()
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

  const cerrado = despacho?.estado === 'FINALIZADO'
  const despachoId = activeDespachoId

  const lockBriefly = useCallback(() => {
    setLocked(true)
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    unlockTimerRef.current = setTimeout(() => setLocked(false), LOCK_MS)
  }, [])

  /** Aplica el DTO devuelto y reconcilia la saca activa (la mantiene si sigue existiendo). */
  const aplicar = useCallback(
    (dto: DespachoRapido) => {
      setDespacho(dto)
      setActiveDespachoId(dto.idDespacho)
      setActiveSacaId((prev) => {
        if (prev != null && dto.sacas.some((s) => s.idSaca === prev)) return prev
        return dto.sacas.length > 0 ? dto.sacas[dto.sacas.length - 1].idSaca : null
      })
    },
    []
  )

  const despachosQuery = useQuery({
    queryKey: ['despachos-rapidos', 'mobile-list'],
    queryFn: () => despachoRapidoService.listar(),
    refetchInterval: DESPACHOS_RAPIDOS_POLL.mobileMs,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeDespachoId == null) {
      window.localStorage.removeItem(ACTIVE_DESPACHO_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(ACTIVE_DESPACHO_STORAGE_KEY, String(activeDespachoId))
  }, [activeDespachoId])

  const cachearDespacho = useCallback(
    (dto: DespachoRapido) => {
      queryClient.setQueryData(['despachos-rapidos', 'detalle', dto.idDespacho], dto)
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'despachos-rapidos' && query.queryKey[1] !== 'detalle',
      })
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
      aplicar(dto)
      cachearDespacho(dto)
    },
    onError: (e) => notify.error(e, 'No se pudo crear el despacho rápido'),
  })

  const agregarMut = useMutation({
    mutationFn: async (guia: string) => {
      if (!despacho) throw new Error('No hay despacho activo')
      const guiaNorm = normalizarNumeroGuia(guia)

      // Validar si el paquete existe en el backend
      let existe = false
      let idPaquete: number | undefined = undefined
      try {
        const p = await paqueteService.findByNumeroGuia(guiaNorm)
        if (p && p.idPaquete != null) {
          existe = true
          idPaquete = p.idPaquete
        }
      } catch (err) {
        existe = false
      }

      if (!existe) {
        if (!permitirNoRegistrados) {
          throw new Error('La guía no está registrada. Active la opción para permitir guías no registradas.')
        }
      }

      const idSacaValida = despacho.sacas.some((saca) => saca.idSaca === activeSacaId)
        ? activeSacaId
        : undefined
      debugDespachoRapidoMobile('agregar:request', {
        idDespacho: despacho.idDespacho,
        numeroGuia: guiaNorm,
        idSaca: idSacaValida ?? null,
      })
      return despachoRapidoService.agregarPaquete(despacho.idDespacho, {
        numeroGuia: guiaNorm,
        idPaquete,
        idSaca: idSacaValida ?? undefined,
      })
    },
    onSuccess: (dto, guia) => {
      aplicar(dto)
      cachearDespacho(dto)
      const guiaNormalizada = normalizarNumeroGuia(guia)
      const sacaConGuia = dto.sacas.find((s) =>
        s.paquetes.some((p) => normalizarNumeroGuia(p.numeroGuia) === guiaNormalizada)
      )
      debugDespachoRapidoMobile('agregar:success', {
        idDespacho: dto.idDespacho,
        estado: dto.estado,
        numeroGuia: guiaNormalizada,
        contienePaquete: Boolean(sacaConGuia),
        idSaca: sacaConGuia?.idSaca ?? null,
      })
      if (sacaConGuia) setActiveSacaId(sacaConGuia.idSaca)
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

  const quitarPaqueteMut = useMutation({
    mutationFn: (vars: { idPaquete: number; idSaca: number }) =>
      despachoRapidoService.quitarPaquete(despacho!.idDespacho, vars.idSaca, vars.idPaquete),
    onSuccess: (dto) => {
      aplicar(dto)
      cachearDespacho(dto)
      notify.success('Paquete quitado del despacho')
    },
    onError: (e) => {
      notify.error(e, 'No se pudo quitar el paquete')
      refrescarDespachoActual()
    },
  })

  const eliminarDespachoMut = useMutation({
    mutationFn: () => despachoRapidoService.eliminar(despacho!.idDespacho),
    onSuccess: () => {
      notify.success('Despacho rápido eliminado con éxito')
      setConfirmandoEliminar(false)
      setActiveDespachoId(null)
      setDespacho(null)
      setActiveSacaId(null)
      void queryClient.invalidateQueries({ queryKey: ['despachos-rapidos'] })
    },
    onError: (e) => {
      setConfirmandoEliminar(false)
      notify.error(e, 'No se pudo eliminar el despacho')
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
      const guia = normalizarNumeroGuia(texto)
      if (!guia || !despacho || cerrado || agregarMut.isPending) return
      debugDespachoRapidoMobile('captura:guia', {
        idDespacho: despacho.idDespacho,
        estado: despacho.estado,
        numeroGuia: guia,
        activeSacaId,
      })
      const yaExiste = despacho.sacas.some((saca) =>
        saca.paquetes.some((paquete) => normalizarNumeroGuia(paquete.numeroGuia) === guia)
      )
      if (yaExiste) {
        feedback.error()
        lockBriefly()
        notify.error(`La guia ${guia} ya esta agregada a este despacho`)
        return
      }
      agregarMut.mutate(guia)
    },
    [despacho, cerrado, agregarMut, feedback, lockBriefly, activeSacaId]
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
  const tamanoSugeridoNuevaSaca = useMemo(() => {
    const paquetesBase = sacaActiva?.paquetes ?? []
    return calcularTamanoSugerido(paquetesBase, Math.max(paquetesBase.length, 1))
  }, [sacaActiva?.paquetes])

  const destinoDefinido = !!(despacho?.idAgencia || despacho?.idDestinatarioDirecto)
  const puedeMarcarListo = !!despacho && destinoDefinido && despacho.totalPaquetes > 0

  // --- Pantalla inicial: sin despacho ---
  if (!despacho) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <EnsacadoLayoutHeader title="Despacho rápido" subtitle="Ensacado rápido · captura móvil" showScanIcon />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-4">
          {activeDespachoId != null && despachoQuery.isLoading ? (
            <div className="surface-panel p-4 text-center text-sm text-muted-foreground">
              Cargando despacho activo...
            </div>
          ) : despachoQuery.error ? (
            <div className="surface-panel space-y-3 p-4 text-center">
              <p className="text-sm text-warning">No se pudo abrir el despacho activo guardado.</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActiveDespachoId(null)
                  setDespacho(null)
                  setActiveSacaId(null)
                }}
              >
                Elegir otro despacho
              </Button>
            </div>
          ) : null}

          <DespachosRapidosMobileList
            despachos={despachosQuery.data ?? []}
            activeDespachoId={activeDespachoId}
            loading={despachosQuery.isLoading}
            refreshing={despachosQuery.isFetching}
            creating={crearMut.isPending}
            onCrear={() => crearMut.mutate()}
            onSeleccionar={(idDespacho) => {
              setActiveDespachoId(idDespacho)
              setDespacho(null)
              setActiveSacaId(null)
            }}
            onRefresh={() => void despachosQuery.refetch()}
          />
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

          <PaquetesTipeadosPanel
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
              setActiveDespachoId(null)
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
        <DespachoRapidoActivoCard
          despacho={despacho}
          onCambiarDespacho={() => {
            setActiveDespachoId(null)
            setDespacho(null)
            setActiveSacaId(null)
          }}
          onEliminar={() => setConfirmandoEliminar(true)}
          eliminando={eliminarDespachoMut.isPending}
        />

        <SacaActivaPanel
          saca={sacaActiva}
          tamanoSugerido={tamanoSugeridoNuevaSaca}
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
          hasTorch={scanner.hasTorch}
          torchActive={scanner.torchActive}
          onToggleTorch={scanner.toggleTorch}
        />

        <label
          htmlFor="permitirNoRegistradosMobile"
          className="flex cursor-pointer select-none items-center gap-2 px-1 text-xs font-medium text-muted-foreground"
        >
          <Checkbox
            id="permitirNoRegistradosMobile"
            checked={permitirNoRegistrados}
            onCheckedChange={(checked) => setPermitirNoRegistrados(Boolean(checked))}
          />
          Permitir guías no registradas (crea el paquete al capturar)
        </label>

        <PaquetesTipeadosPanel
          sacas={despacho.sacas}
          activeSacaId={sacaActiva?.idSaca ?? null}
          onSeleccionarActiva={(idSaca) => setActiveSacaId(idSaca)}
          onMoverPaquete={(idPaquete, idSacaDestino) => moverMut.mutate({ idPaquete, idSacaDestino })}
          onQuitarPaquete={(idPaquete, idSaca) => quitarPaqueteMut.mutate({ idPaquete, idSaca })}
          moviendo={moverMut.isPending || quitarPaqueteMut.isPending}
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

      <ConfirmDeleteDialog
        open={confirmandoEliminar}
        onOpenChange={setConfirmandoEliminar}
        onConfirm={() => eliminarDespachoMut.mutate()}
        isPending={eliminarDespachoMut.isPending}
        title="Eliminar despacho rápido"
        description="Los paquetes se desasociarán del despacho, pero no se eliminarán del sistema."
        message={`¿Está seguro de que desea eliminar el despacho ${despacho.numeroManifiesto ?? `#${despacho.idDespacho}`}?`}
      />
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
