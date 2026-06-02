import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { ErrorState } from '@/components/states/ErrorState'
import { LoadingState } from '@/components/states/LoadingState'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGuardarPlantillaWhatsAppDespacho,usePlantillaWhatsAppDespacho,useVariablesPlantillaDespacho } from '@/hooks/usePlantillaWhatsAppDespacho'
import type { VariablePlantillaDespacho } from '@/lib/api/parametroSistema.service'
import { cn } from '@/lib/utils'
import { PERMISSIONS } from '@/types/permissions'
import { reemplazarVariables } from '@/utils/plantillaWhatsApp'
import { Bold,CheckCircle2,CircleDashed,Clock3,Code,Italic,MessageSquare,Save,Strikethrough } from 'lucide-react'
import { useCallback,useEffect,useMemo,useRef,useState,type KeyboardEvent,type MouseEvent,type ReactNode } from 'react'

/** Agrupación de variables para mejor orden en la UI (claves en el orden deseado). */
const VARIABLE_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: 'despacho', label: 'Despacho', keys: ['numero_manifiesto', 'fecha_despacho', 'observaciones', 'codigo_presinto'] },
  { id: 'destino', label: 'Destino', keys: ['destinatario_directo', 'agencia'] },
  { id: 'personas', label: 'Personas', keys: ['encargado', 'distribuidor'] },
  { id: 'guias', label: 'Guías y cantidades', keys: ['guia', 'guias', 'cantidad_sacas', 'cantidad_paquetes', 'detalle_sacas'] },
]

function groupVariables(
  variables: VariablePlantillaDespacho[],
  groups: { id: string; label: string; keys: string[] }[]
): { group: typeof groups[0]; variables: VariablePlantillaDespacho[] }[] {
  const map = new Map<string, VariablePlantillaDespacho>()
  variables.forEach((v) => map.set(v.clave, v))
  const result: { group: typeof groups[0]; variables: VariablePlantillaDespacho[] }[] = []
  const used = new Set<string>()
  for (const group of groups) {
    const vars: VariablePlantillaDespacho[] = []
    for (const key of group.keys) {
      const v = map.get(key)
      if (v) {
        vars.push(v)
        used.add(key)
      }
    }
    if (vars.length > 0) result.push({ group, variables: vars })
  }
  const otros = variables.filter((v) => !used.has(v.clave))
  if (otros.length > 0) {
    result.push({ group: { id: 'otros', label: 'Otros', keys: [] }, variables: otros })
  }
  return result
}

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
  numero_manifiesto: 'MAN-2026-00147',
  fecha_despacho: '14/01/2026 15:40',
  destinatario_directo: 'CALZADOS NIÑA MIA - VENTANAS',
  encargado: 'RONALD ENRIQUE UCHUARI MONTAÑO',
  distribuidor: 'YOBEL EXPRESS',
  guia: 'GUIA-001985319',
  guias: 'GUIA-001985319, GUIA-001985320, GUIA-001985321',
  cantidad_sacas: '3',
  cantidad_paquetes: '12',
  detalle_sacas: '1. Saca #1 (4 paq) - Individual - Código: SAC-2026-01\n2. Saca #2 (5 paq) - Mediano - Código: SAC-2026-02\n3. Saca #3 (3 paq) - Pequeño - Código: SAC-2026-03',
  agencia: 'Agencia Ventanas Centro',
  observaciones: 'Entregar en horario laboral. Verificar identidad del receptor y estado de los paquetes.',
  codigo_presinto: 'PRES-2026-AB123',
}

interface CursorPosition {
  start: number
  end: number
}

export function MensajeWhatsAppDespachoSection() {
  const [plantillaLocal, setPlantillaLocal] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<CursorPosition | null>(null)

  const { data, isLoading, error } = usePlantillaWhatsAppDespacho()
  const { data: variables } = useVariablesPlantillaDespacho()
  const guardarMutation = useGuardarPlantillaWhatsAppDespacho()

  // Cargar la configuración actual del servidor para que el operario pueda modificarla
  useEffect(() => {
    if (data?.plantilla != null) {
      setPlantillaLocal(data.plantilla)
    }
  }, [data?.plantilla])

  const guardarPosicionCursor = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea && document.activeElement === textarea) {
      cursorPositionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd }
    }
  }, [])

  const keepTextareaFocus = useCallback((e: MouseEvent<HTMLElement>) => {
    // Evita que el click en botones de toolbar quite el foco del textarea.
    e.preventDefault()
  }, [])

  const getCurrentSelection = useCallback((): CursorPosition => {
    const textarea = textareaRef.current
    if (textarea && document.activeElement === textarea) {
      return { start: textarea.selectionStart, end: textarea.selectionEnd }
    }
    if (cursorPositionRef.current) {
      return cursorPositionRef.current
    }
    const pos = plantillaLocal.length
    return { start: pos, end: pos }
  }, [plantillaLocal.length])

  const applyAtCursor = useCallback((valueToInsert: string) => {
    const pos = getCurrentSelection()
    const start = Math.min(pos.start, plantillaLocal.length)
    const end = Math.min(pos.end, plantillaLocal.length)
    const antes = plantillaLocal.slice(0, start)
    const despues = plantillaLocal.slice(end)
    const nueva = antes + valueToInsert + despues
    const nuevaPos = antes.length + valueToInsert.length
    setPlantillaLocal(nueva)
    cursorPositionRef.current = { start: nuevaPos, end: nuevaPos }
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) {
        ta.focus()
        ta.setSelectionRange(nuevaPos, nuevaPos)
      }
    })
  }, [getCurrentSelection, plantillaLocal])

  const insertarVariable = useCallback((clave: string) => {
    applyAtCursor(`{{${clave}}}`)
  }, [applyAtCursor])

  const wrapSelection = useCallback((prefix: string, suffix = prefix) => {
    const ta = textareaRef.current
    const pos = getCurrentSelection()
    const start = Math.min(pos.start, plantillaLocal.length)
    const end = Math.min(pos.end, plantillaLocal.length)
    const antes = plantillaLocal.slice(0, start)
    const seleccionado = plantillaLocal.slice(start, end)
    const despues = plantillaLocal.slice(end)
    const contenido = seleccionado || 'texto'
    const nueva = `${antes}${prefix}${contenido}${suffix}${despues}`
    const newStart = antes.length + prefix.length
    const newEnd = newStart + contenido.length
    setPlantillaLocal(nueva)
    cursorPositionRef.current = { start: newStart, end: newEnd }
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus()
        ta.setSelectionRange(newStart, newEnd)
      }
    })
  }, [getCurrentSelection, plantillaLocal])

  const handleEditorKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey
    if (isMod && !e.altKey) {
      const key = e.key.toLowerCase()
      if (key === 'b') {
        e.preventDefault()
        wrapSelection('*')
        return
      }
      if (key === 'i') {
        e.preventDefault()
        wrapSelection('_')
        return
      }
      if (key === 'u') {
        e.preventDefault()
        wrapSelection('~')
        return
      }
      if (key === 'k' || e.key === '`') {
        e.preventDefault()
        wrapSelection('```', '```')
        return
      }
    }

    // Tab para indentación simple sin salir del editor.
    if (e.key === 'Tab') {
      e.preventDefault()
      applyAtCursor('  ')
    }
  }, [applyAtCursor, wrapSelection])

  const plantillaServidor = data?.plantilla ?? ''
  const hasUnsavedChanges = plantillaLocal !== plantillaServidor
  const isSaving = guardarMutation.isPending

  const saveStatus = useMemo(() => {
    if (isSaving) {
      return { label: 'Guardando…', icon: Clock3, className: 'text-amber-600 dark:text-amber-400' }
    }
    if (hasUnsavedChanges) {
      return { label: 'Editando', icon: CircleDashed, className: 'text-info' }
    }
    return { label: 'Sin cambios', icon: CheckCircle2, className: 'text-success' }
  }, [hasUnsavedChanges, isSaving])

  const preview = reemplazarVariables(plantillaLocal, VALORES_EJEMPLO)
  const groupedVariables = variables?.length ? groupVariables(variables, VARIABLE_GROUPS) : []
  const handleGuardar = () => {
    guardarMutation.mutate(plantillaLocal)
  }

  if (isLoading) return <LoadingState />
  if (error) {
    return (
      <ErrorState
        title="No se pudo cargar la configuración."
        description="Intente recargar la página para continuar."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Barra de estado y guardado */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Edite la plantilla y guarde para aplicarla en los próximos despachos.</span>
        </div>
        <div className="flex items-center gap-3 sm:shrink-0">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', saveStatus.className)}>
            <saveStatus.icon className="size-3.5" />
            {saveStatus.label}
          </span>
          <ProtectedByPermission permission={PERMISSIONS.PARAMETROS_SISTEMA.EDITAR}>
            <Button
              size="sm"
              onClick={handleGuardar}
              disabled={isSaving || !plantillaLocal.trim() || !hasUnsavedChanges}
            >
              <Save className="size-4 mr-1.5" />
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
          </ProtectedByPermission>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Editor */}
        <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Plantilla del mensaje</Label>
            <p className="text-xs text-muted-foreground">
              Atajos: Ctrl+B negrita · Ctrl+I cursiva · Ctrl+U tachado · Tab indentar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('*')} title="Negrita">
              <Bold className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('_')} title="Cursiva">
              <Italic className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('~')} title="Tachado">
              <Strikethrough className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('```', '```')} title="Monoespacio">
              <Code className="size-4" />
            </Button>
          </div>

          <Textarea
            ref={textareaRef}
            value={plantillaLocal}
            onChange={(e) => setPlantillaLocal(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            onFocus={guardarPosicionCursor}
            onBlur={guardarPosicionCursor}
            onSelect={guardarPosicionCursor}
            onKeyUp={guardarPosicionCursor}
            onClick={guardarPosicionCursor}
            placeholder={'Ej: Despacho {{numero_manifiesto}}\nFecha: {{fecha_despacho}}...'}
            rows={14}
            className="min-h-[300px] resize-y font-mono text-sm leading-relaxed"
          />

          {groupedVariables.length > 0 && (
            <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Insertar variable</p>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {groupedVariables.map(({ group, variables: vars }) => (
                  <div key={group.id} className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vars.map((v) => (
                        <Button
                          key={v.clave}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onMouseDown={keepTextareaFocus}
                          onClick={() => insertarVariable(v.clave)}
                          title={v.descripcion}
                          className="h-7 px-2 font-mono text-[11px]"
                        >
                          {`{{${v.clave}}}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Vista previa estilo chat */}
        <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Vista previa</Label>
            <p className="text-xs text-muted-foreground">
              Datos de ejemplo · *negrita* _cursiva_ ~tachado~ ```mono```
            </p>
          </div>
          <div className="whatsapp-preview-bg flex min-h-[360px] flex-1 flex-col rounded-xl p-4">
            <div className="mt-auto max-w-[92%] self-start">
              <div
                className="whatsapp-bubble"
                aria-live="polite"
              >
                {preview ? renderPreviewComoWhatsApp(preview) : (
                  <span className="italic text-muted-foreground">Sin contenido</span>
                )}
              </div>
              <p className="mt-1 pl-1 text-[10px] text-muted-foreground/70">12:00</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
