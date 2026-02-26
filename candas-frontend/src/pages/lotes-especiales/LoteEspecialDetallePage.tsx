import { useParams } from '@tanstack/react-router'
import { LoteEspecialDetailContent } from './LoteEspecialDetailContent'

export default function LoteEspecialDetallePage() {
  const { id } = useParams({ strict: false })
  if (!id) return null
  return <LoteEspecialDetailContent id={Number(id)} backUrl="/lotes-recepcion" />
}
