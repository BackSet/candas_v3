import { CopyActionButton } from '@/components/ui/copy-action-button'
import { ClipboardList, ListOrdered, MapPin } from 'lucide-react'

export interface DespachoMasivoCopyActionsProps {
  /** Texto del resumen completo del despacho. */
  resumenText?: string
  /** Guías, una por línea. */
  guiasText?: string
  /** Texto del destino (tipo de envío, distribuidor, transporte). */
  destinoText?: string
  size?: 'default' | 'sm'
  className?: string
}

/**
 * Botones de copiado para despacho masivo. Reutiliza `CopyActionButton`
 * (clipboard + notify con fallback). Renderiza solo los botones cuyo texto se
 * provee, para usarse igual en el builder (antes de crear) y en la lista del lote.
 */
export function DespachoMasivoCopyActions({
  resumenText,
  guiasText,
  destinoText,
  size = 'sm',
  className,
}: DespachoMasivoCopyActionsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {resumenText && (
        <CopyActionButton
          textToCopy={resumenText}
          successMessage="Resumen copiado"
          title="Copiar resumen del despacho"
          size={size}
        >
          <ClipboardList className="size-4" /> Copiar resumen
        </CopyActionButton>
      )}
      {guiasText && (
        <CopyActionButton
          textToCopy={guiasText}
          successMessage="Guías copiadas"
          title="Copiar guías del despacho"
          size={size}
          variant="secondary"
        >
          <ListOrdered className="size-4" /> Copiar guías
        </CopyActionButton>
      )}
      {destinoText && (
        <CopyActionButton
          textToCopy={destinoText}
          successMessage="Destino copiado"
          title="Copiar destino del despacho"
          size={size}
          variant="secondary"
        >
          <MapPin className="size-4" /> Copiar destino
        </CopyActionButton>
      )}
    </div>
  )
}
