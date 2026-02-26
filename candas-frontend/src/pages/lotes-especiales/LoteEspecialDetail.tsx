import { useParams, useNavigate } from '@tanstack/react-router'
import { useLoteRecepcion } from '@/hooks/useLotesRecepcion'
import { LoteEspecialDetailContent } from './LoteEspecialDetailContent'
import { DetailPageLayout } from '@/components/detail/DetailPageLayout'
import { LoadingState } from '@/components/states'

/** Vista de detalle de lote especial. Redirige a lotes-recepcion para unificar URL; renderiza contenido compartido. */
export default function LoteEspecialDetail() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const idNum = id ? Number(id) : undefined

  const { data: lote, isLoading } = useLoteRecepcion(idNum)

  if (idNum == null) {
    navigate({ to: '/lotes-recepcion', replace: true })
    return null
  }

  if (isLoading) {
    return (
      <DetailPageLayout title="Cargando..." backUrl="/lotes-recepcion" maxWidth="2xl">
        <LoadingState />
      </DetailPageLayout>
    )
  }

  if (!lote) {
    navigate({ to: '/lotes-recepcion', replace: true })
    return null
  }

  if (lote.tipoLote !== 'ESPECIAL') {
    navigate({ to: `/lotes-recepcion/${idNum}`, replace: true })
    return null
  }

  return <LoteEspecialDetailContent id={idNum} backUrl="/lotes-recepcion" />
}
