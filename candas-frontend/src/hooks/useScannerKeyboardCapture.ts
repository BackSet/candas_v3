import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export interface ScannerKeyboardCaptureOptions {
  /** Solo captura cuando está activo (p. ej. paso 2 + subpaso "capturar" sin pegado en bloque). */
  active: boolean
  /** Input principal de captura: se ignora como objetivo (lo maneja su propio onKeyDown) y se reenfoca tras finalizar. */
  inputRef: RefObject<HTMLInputElement | null>
  /** Procesa una guía finalizada que se capturó fuera del input principal. */
  onGuia: (guia: string) => void
  /** Enfoca el input principal de forma resiliente. */
  focusInput: () => void
}

/** Teclas que una tipiadora/escáner envía como finalizador de guía. */
const FINALIZERS = new Set(['Enter', 'NumpadEnter', 'Tab'])
/** Si pasa este tiempo sin teclas, se descarta el buffer parcial (evita mezclar dos escaneos). */
const BUFFER_RESET_MS = 1000

/** True si el evento ocurre sobre un control donde el usuario está editando/navegando y no se debe interceptar. */
function esObjetivoEditable(target: EventTarget | null, inputPrincipal: HTMLInputElement | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target === inputPrincipal) return true // el input principal lo maneja su propio onKeyDown
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  // Combobox/listbox/menús (Radix) y diálogos: no robar el teclado.
  if (target.closest('[role="dialog"],[role="listbox"],[role="combobox"],[role="menu"],[contenteditable="true"]')) return true
  return false
}

/**
 * Modo "captura continua" para operar con tipiadora/escáner: cuando el foco cae accidentalmente
 * en el body, un botón o una zona no editable del subpaso, acumula los caracteres del escaneo y
 * los procesa al recibir un finalizador (Enter, NumpadEnter o Tab), reenfocando luego el input.
 * No interfiere si el usuario está escribiendo en otro campo editable, combobox, select o diálogo.
 */
export function useScannerKeyboardCapture({ active, inputRef, onGuia, focusInput }: ScannerKeyboardCaptureOptions) {
  // Callbacks en refs para no re-suscribir el listener en cada render.
  const onGuiaRef = useRef(onGuia)
  const focusInputRef = useRef(focusInput)
  onGuiaRef.current = onGuia
  focusInputRef.current = focusInput

  useEffect(() => {
    if (!active) return
    let buffer = ''
    let resetTimer: ReturnType<typeof setTimeout> | undefined

    const limpiarBuffer = () => {
      buffer = ''
      if (resetTimer) { clearTimeout(resetTimer); resetTimer = undefined }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar atajos y combinaciones: no son escaneo.
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // Si el usuario está en otro campo editable o el propio input, no interceptar globalmente.
      if (esObjetivoEditable(e.target, inputRef.current)) return

      if (FINALIZERS.has(e.key)) {
        const guia = buffer.trim()
        if (!guia) return // sin escaneo en curso: dejar la navegación/activación normal (Tab, Enter en botón…)
        e.preventDefault()
        limpiarBuffer()
        onGuiaRef.current(guia)
        focusInputRef.current()
        return
      }

      // Acumular solo caracteres imprimibles de un escaneo.
      if (e.key.length === 1) {
        e.preventDefault()
        buffer += e.key
        if (resetTimer) clearTimeout(resetTimer)
        resetTimer = setTimeout(() => { buffer = '' }, BUFFER_RESET_MS)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      limpiarBuffer()
    }
  }, [active, inputRef])
}
