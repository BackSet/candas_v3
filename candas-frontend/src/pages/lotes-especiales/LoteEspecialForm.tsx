import { useParams } from '@tanstack/react-router'
import LoteRecepcionForm from '@/pages/lotes-recepcion/LoteRecepcionForm'

export default function LoteEspecialForm() {
  const { id } = useParams({ strict: false })
  const isEdit = !!id
  return (
    <LoteRecepcionForm
      backUrl="/lotes-especiales"
      defaultTipoLote="ESPECIAL"
      title={isEdit ? 'Editar lote especial' : 'Nuevo lote especial'}
      subtitle={
        isEdit
          ? 'Modifica la información del lote especial.'
          : 'Crea un lote especial para agregar listas de paquetes por etiqueta.'
      }
    />
  )
}
