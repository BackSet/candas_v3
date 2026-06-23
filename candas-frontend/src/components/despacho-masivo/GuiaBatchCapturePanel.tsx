import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ScanLine } from 'lucide-react'
import { useState } from 'react'

export interface GuiaBatchCapturePanelProps {
  /** Resuelve y agrega una o varias guías a la cola global. */
  onAgregarGuias: (guias: string[]) => void
  /** Indica si hay una resolución en curso (deshabilita la captura). */
  resolviendo?: boolean
}

/** Separa un texto pegado en guías individuales (por salto de línea, coma, espacio o tab). */
export function parsearGuias(texto: string): string[] {
  return texto
    .split(/[\s,;]+/)
    .map((g) => g.trim())
    .filter((g) => g.length > 0)
}

/**
 * Panel de captura de guías para la cola global del despacho masivo: permite
 * escanear/escribir una guía o pegar varias a la vez.
 */
export function GuiaBatchCapturePanel({ onAgregarGuias, resolviendo }: GuiaBatchCapturePanelProps) {
  const [guiaUnica, setGuiaUnica] = useState('')
  const [bloque, setBloque] = useState('')

  const agregarUnica = () => {
    const guias = parsearGuias(guiaUnica)
    if (guias.length === 0) return
    onAgregarGuias(guias)
    setGuiaUnica('')
  }

  const agregarBloque = () => {
    const guias = parsearGuias(bloque)
    if (guias.length === 0) return
    onAgregarGuias(guias)
    setBloque('')
  }

  const totalBloque = parsearGuias(bloque).length

  return (
    <div className="space-y-4">
      {/* Escaneo / captura individual */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          agregarUnica()
        }}
        className="space-y-1.5"
      >
        <label htmlFor="masivo-guia-unica" className="text-xs font-medium text-muted-foreground">
          Escanear o escribir guía
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="masivo-guia-unica"
              value={guiaUnica}
              onChange={(e) => setGuiaUnica(e.target.value)}
              placeholder="Número de guía"
              autoComplete="off"
              className="pl-8"
              disabled={resolviendo}
            />
          </div>
          <Button type="submit" disabled={resolviendo || guiaUnica.trim().length === 0}>
            Agregar
          </Button>
        </div>
      </form>

      {/* Pegado masivo */}
      <div className="space-y-1.5">
        <label htmlFor="masivo-guia-bloque" className="text-xs font-medium text-muted-foreground">
          Pegar varias guías (una por línea o separadas por coma/espacio)
        </label>
        <Textarea
          id="masivo-guia-bloque"
          value={bloque}
          onChange={(e) => setBloque(e.target.value)}
          placeholder={'GUIA001\nGUIA002\nGUIA003'}
          rows={4}
          disabled={resolviendo}
          className="font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {totalBloque > 0 ? `${totalBloque} guía(s) detectada(s)` : 'Sin guías'}
          </span>
          <Button
            type="button"
            variant="secondary"
            onClick={agregarBloque}
            disabled={resolviendo || totalBloque === 0}
          >
            {resolviendo ? <Loader2 className="animate-spin" /> : null}
            Agregar a la cola
          </Button>
        </div>
      </div>
    </div>
  )
}
