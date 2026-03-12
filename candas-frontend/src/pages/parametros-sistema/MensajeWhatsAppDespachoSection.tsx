import { useState, useRef, useCallback, useEffect, useMemo, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { usePlantillaWhatsAppDespacho, useVariablesPlantillaDespacho, useGuardarPlantillaWhatsAppDespacho } from '@/hooks/usePlantillaWhatsAppDespacho'
import type { VariablePlantillaDespacho } from '@/lib/api/parametroSistema.service'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { PERMISSIONS } from '@/types/permissions'
import { Save, MessageSquare, Bold, Italic, Strikethrough, Code, CheckCircle2, Clock3, CircleDashed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { reemplazarVariables } from '@/utils/plantillaWhatsApp'
import { useUIStore } from '@/stores/uiStore'

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
      return { label: 'Editando', icon: CircleDashed, className: 'text-blue-600 dark:text-blue-400' }
    }
    return { label: 'Sin cambios', icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' }
  }, [hasUnsavedChanges, isSaving])

  const preview = reemplazarVariables(plantillaLocal, VALORES_EJEMPLO)
  const groupedVariables = variables?.length ? groupVariables(variables, VARIABLE_GROUPS) : []
  const resolvedTheme = useUIStore((state) => state.resolvedTheme)

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
    <section className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Mensaje de despacho WhatsApp</h2>
            <p className="text-sm text-muted-foreground">
              Se ha cargado la configuración actual. Edite la plantilla y guarde para aplicar los cambios.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide', saveStatus.className)}>
            <saveStatus.icon className="size-4" />
            {saveStatus.label}
          </span>
          <ProtectedByPermission permission={PERMISSIONS.PARAMETROS_SISTEMA.EDITAR}>
            <Button
              onClick={handleGuardar}
              disabled={isSaving || !plantillaLocal.trim() || !hasUnsavedChanges}
            >
              <Save className="size-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </ProtectedByPermission>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Editor del mensaje</Label>
            <p className="text-xs text-muted-foreground">Formato rápido y edición de plantilla.</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('*')} title="Negrita">
                <Bold className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('_')} title="Cursiva">
                <Italic className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('~')} title="Tachado">
                <Strikethrough className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onMouseDown={keepTextareaFocus} onClick={() => wrapSelection('```', '```')} title="Monoespacio">
                <Code className="size-4" />
              </Button>
            </div>
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
            placeholder="Ej: Despacho {{numero_manifiesto}}&#10;Fecha: {{fecha_despacho}}..."
            rows={16}
            className="font-mono text-sm resize-y min-h-[340px]"
          />

          {groupedVariables.length > 0 && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <div className="space-y-1">
                <Label>Variables disponibles</Label>
                <p className="text-xs text-muted-foreground">
                  Haga clic para insertar en la posición del cursor.
                </p>
              </div>
              <div className="space-y-4">
                {groupedVariables.map(({ group, variables: vars }) => (
                  <div key={group.id} className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {vars.map((v) => (
                        <Button
                          key={v.clave}
                          type="button"
                          variant="outline"
                          size="sm"
                          onMouseDown={keepTextareaFocus}
                          onClick={() => insertarVariable(v.clave)}
                          title={v.descripcion}
                          className="font-mono"
                        >
                          {v.clave}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vista previa (como en WhatsApp)</Label>
            <p className="text-xs text-muted-foreground">
              Se actualiza en tiempo real mientras escribe. Formato: *negrita* · _cursiva_ · ~tachado~ · ```mono```
            </p>
          </div>
          <div
            className={cn(
              'w-full min-h-[280px] rounded-lg border border-border/50 px-4 py-3 shadow-sm',
              resolvedTheme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-black',
              'whitespace-pre-wrap text-sm leading-relaxed'
            )}
            aria-live="polite"
          >
            {preview ? renderPreviewComoWhatsApp(preview) : '(Sin contenido)'}
          </div>
        </div>
      </div>
    </section>
  )
}
