import { ModulePageIcon } from '@/components/icons'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { DespachoRapidoCard } from '@/components/despachos-rapidos/DespachoRapidoCard'
import { FinalizarDespachoDialog } from '@/components/despachos-rapidos/FinalizarDespachoDialog'
import { DESPACHOS_RAPIDOS_POLL } from '@/constants/despachosRapidos'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { useHasPermission } from '@/hooks/useHasRole'
import { despachoRapidoService } from '@/lib/api/despacho-rapido.service'
import { getApiErrorMessage } from '@/lib/api/errors'
import { notify } from '@/lib/notify'
import { PERMISSIONS } from '@/types/permissions'
import type { DespachoRapido, FinalizarDespachoRapidoPayload } from '@/types/despacho-rapido'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackageCheck, RefreshCw } from 'lucide-react'
import { useState } from 'react'

type Filtro = 'LISTO_PARA_GUIA' | 'TODOS'

const FILTRO_OPTIONS = [
  { value: 'LISTO_PARA_GUIA' as const, label: 'Listos para guía' },
  { value: 'TODOS' as const, label: 'Todos los activos' },
]

/**
 * Vista de escritorio del módulo "Despachos rápidos" (MVP 3/4): tablero de despachos
 * LISTO_PARA_GUIA para que el operario en oficina copie los datos al sistema externo,
 * ingrese distribuidor y guía de transporte, y finalice. Es de solo lectura sobre
 * paquetes/sacas (no los edita): el backend ya bloquea cambios de captura una vez que
 * un despacho llega a LISTO_PARA_GUIA, así que finalizar aquí no interfiere con el
 * operario que sigue ensacando otros despachos desde `/despachos/rapidos/mobile`.
 */
function DespachosRapidosPage() {
  const [filtro, setFiltro] = useState<Filtro>('LISTO_PARA_GUIA')
  const [despachoAFinalizar, setDespachoAFinalizar] = useState<DespachoRapido | null>(null)
  const queryClient = useQueryClient()
  const puedeFinalizar = useHasPermission(PERMISSIONS.DESPACHOS.EDITAR)

  const queryKey = ['despachos-rapidos', filtro] as const
  const {
    data: despachos = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => despachoRapidoService.listar(filtro === 'LISTO_PARA_GUIA' ? 'LISTO_PARA_GUIA' : undefined),
    refetchInterval: DESPACHOS_RAPIDOS_POLL.desktopMs,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const finalizarMut = useMutation({
    mutationFn: (vars: { idDespacho: number; payload: FinalizarDespachoRapidoPayload }) =>
      despachoRapidoService.finalizar(vars.idDespacho, vars.payload),
    onSuccess: (dto) => {
      notify.success(`Despacho ${dto.numeroManifiesto ?? dto.idDespacho} finalizado`)
      setDespachoAFinalizar(null)
      void queryClient.invalidateQueries({ queryKey: ['despachos-rapidos'] })
    },
    onError: (e) => {
      notify.error(getApiErrorMessage(e, 'No se pudo finalizar el despacho'))
      void queryClient.invalidateQueries({ queryKey: ['despachos-rapidos'] })
    },
  })

  const listosParaGuia = despachos.filter((d) => d.estado === 'LISTO_PARA_GUIA').length

  return (
    <PageContainer width="xl">
      <PageHeader
        icon={<ModulePageIcon module="despachos" />}
        title="Despachos rápidos"
        subtitle={
          listosParaGuia > 0
            ? `${listosParaGuia} despacho(s) listos para guía`
            : 'Finaliza los despachos que el operario dejó listos para guía'
        }
        actions={
          <div className="flex items-center gap-2">
            <SegmentedToggle value={filtro} options={FILTRO_OPTIONS} onChange={setFiltro} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              title="Actualizar"
              aria-label="Actualizar"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState label="Cargando despachos rápidos…" />
      ) : error ? (
        <ErrorState
          description={getApiErrorMessage(error, 'No se pudieron cargar los despachos rápidos')}
          onRetry={() => void refetch()}
        />
      ) : despachos.length === 0 ? (
        <EmptyState
          icon={<PackageCheck />}
          title={filtro === 'LISTO_PARA_GUIA' ? 'No hay despachos listos para guía' : 'No hay despachos activos'}
          description="Los despachos aparecen aquí cuando el operario los marca listos desde el lector móvil."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {despachos.map((d) => (
            <DespachoRapidoCard
              key={d.idDespacho}
              despacho={d}
              onFinalizar={puedeFinalizar ? setDespachoAFinalizar : undefined}
            />
          ))}
        </div>
      )}

      <FinalizarDespachoDialog
        despacho={despachoAFinalizar}
        open={despachoAFinalizar != null}
        onOpenChange={(open) => {
          if (!open) setDespachoAFinalizar(null)
        }}
        guardando={finalizarMut.isPending}
        onConfirm={(payload) => {
          if (!despachoAFinalizar) return
          finalizarMut.mutate({ idDespacho: despachoAFinalizar.idDespacho, payload })
        }}
      />
    </PageContainer>
  )
}

export default DespachosRapidosPage
