import { useState, useRef, useCallback, type ReactNode } from 'react'
import { usePlantillaWhatsAppDespacho, useVariablesPlantillaDespacho, useGuardarPlantillaWhatsAppDespacho } from '@/hooks/usePlantillaWhatsAppDespacho'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { Save, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { reemplazarVariables } from '@/utils/plantillaWhatsApp'

/**
 * Parsea el texto y devuelve nodos React con el formato de WhatsApp:
 * *texto* = negrita, _texto_ = cursiva, ~texto~ = tachado, ```texto``` = monospace.
 */
function renderPreviewComoWhatsApp(text: string, keyPrefix = 'wp'): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\*([^*]*)\*|_([^_]*)_|~([^~]*)~|```([^`]*)```/g
  let last = 0
  let match
  let keyIndex = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    const k = `${keyPrefix}-${keyIndex++}`
    if (match[1] !== undefined) {
      parts.push(<strong key={k}>{renderPreviewComoWhatsApp(match[1], k)}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(<em key={k}>{renderPreviewComoWhatsApp(match[2], k)}</em>)
    } else if (match[3] !== undefined) {
      parts.push(<span key={k} className="line-through">{renderPreviewComoWhatsApp(match[3], k)}</span>)
    } else if (match[4] !== undefined) {
      parts.push(<span key={k} className="font-mono text-[13px]">{renderPreviewComoWhatsApp(match[4], k)}</span>)
    }
    last = re.lastIndex
  }
  if (last < text.length) {
    parts.push(text.slice(last))
  }
  return parts
}

/** Valores de ejemplo para la vista previa (mismo orden que las variables del backend). */
const VALORES_EJEMPLO: Record<string, string> = {
  numero_manifiesto: 'MAN-00000004',
  fecha_despacho: '14/1/2026',
  destinatario_directo: 'CALZADOS NIÑA MIA - VENTANAS',
  encargado: 'RONALD ENRIQUE UCHUARI MONTAÑO',
  distribuidor: 'YOBEL EXPRESS',
  guia: '001985319',
  guias: '001985319',
  cantidad_sacas: '3',
  cantidad_paquetes: '0',
  detalle_sacas: '1. Saca #1 (0 paq)\n2. Saca #2 (0 paq)\n3. Saca #3 (0 paq)',
  agencia: 'Agencia Centro',
  observaciones: 'Sin observaciones',
  codigo_presinto: 'PRES-ABC123',
}

interface CursorPosition {
  start: number
  end: number
}

export function MensajeWhatsAppDespachoSection() {
  const [plantillaLocal, setPlantillaLocal] = useState('')
  const [inicializado, setInicializado] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<CursorPosition | null>(null)

  const { data, isLoading, error } = usePlantillaWhatsAppDespacho()
  const { data: variables } = useVariablesPlantillaDespacho()
  const guardarMutation = useGuardarPlantillaWhatsAppDespacho()

  if (data && !inicializado) {
    setPlantillaLocal(data.plantilla ?? '')
    setInicializado(true)
  }

  const guardarPosicionCursor = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea && document.activeElement === textarea) {
      cursorPositionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd }
    }
  }, [])

  const insertarVariable = useCallback((clave: string) => {
    const placeholder = `{{${clave}}}`
    const pos = cursorPositionRef.current
    const start = pos ? Math.min(pos.start, plantillaLocal.length) : plantillaLocal.length
    const end = pos ? Math.min(pos.end, plantillaLocal.length) : plantillaLocal.length
    const antes = plantillaLocal.slice(0, start)
    const despues = plantillaLocal.slice(end)
    const nueva = antes + placeholder + despues
    const nuevaPos = antes.length + placeholder.length
    setPlantillaLocal(nueva)
    cursorPositionRef.current = { start: nuevaPos, end: nuevaPos }
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) {
        ta.focus()
        ta.setSelectionRange(nuevaPos, nuevaPos)
      }
    })
  }, [plantillaLocal])

  const preview = reemplazarVariables(plantillaLocal, VALORES_EJEMPLO)

  const handleGuardar = () => {
    guardarMutation.mutate(plantillaLocal)
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message="No se pudo cargar la configuración." onRetry={() => window.location.reload()} />

  return (
    <section className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Mensaje de despacho WhatsApp</h2>
            <p className="text-sm text-muted-foreground">
              Define el formato del mensaje que se usará para los despachos. Usa las variables para insertar datos del despacho.
            </p>
          </div>
        </div>
        <ProtectedByPermission permission={PERMISSIONS.PARAMETROS_SISTEMA.EDITAR}>
          <Button
            onClick={handleGuardar}
            disabled={guardarMutation.isPending || !plantillaLocal.trim()}
          >
            <Save className="size-4 mr-2" />
            Guardar
          </Button>
        </ProtectedByPermission>
      </div>

      <div className="space-y-2">
        <Label>Plantilla del mensaje</Label>
        <Textarea
          ref={textareaRef}
          value={plantillaLocal}
          onChange={(e) => setPlantillaLocal(e.target.value)}
          onBlur={guardarPosicionCursor}
          onSelect={guardarPosicionCursor}
          placeholder="Ej: Despacho {{numero_manifiesto}}&#10;Fecha: {{fecha_despacho}}..."
          rows={8}
          className="font-mono text-sm resize-y"
        />
      </div>

      {variables && variables.length > 0 && (
        <div className="space-y-2">
          <Label>Insertar variable</Label>
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <Button
                key={v.clave}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertarVariable(v.clave)}
                title={v.descripcion}
              >
                {v.clave}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Vista previa (como en WhatsApp)</Label>
        <p className="text-xs text-muted-foreground">
          *negrita* · _cursiva_ · ~tachado~ · ```mono```
        </p>
        <div
          className={cn(
            'w-full min-h-[120px] rounded-lg border border-border/50 px-4 py-3',
            'bg-[#dcf8c6]/90 dark:bg-[#005c4b]/20 text-[#111b21] dark:text-foreground',
            'whitespace-pre-wrap text-sm leading-relaxed'
          )}
        >
          {preview ? renderPreviewComoWhatsApp(preview) : '(Sin contenido)'}
        </div>
      </div>
    </section>
  )
}
