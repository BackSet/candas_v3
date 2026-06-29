import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { List as ListIcon, Loader2, Plus } from 'lucide-react'
import type { RefObject } from 'react'

export interface ColaFeedback {
  guia: string
  status: 'success' | 'error' | 'warning'
  message: string
}

export interface ColaPasteResult {
  agregados: number
  yaAgregados: string[]
  noEncontrados: string[]
  invalidos: string[]
}

export interface PaqueteCapturePanelProps {
  colaInput: string
  setColaInput: (value: string) => void
  procesandoCola: boolean
  handleColaSubmit: (e?: React.FormEvent, valueOverride?: string) => void
  showColaPaste: boolean
  setShowColaPaste: (value: boolean | ((prev: boolean) => boolean)) => void
  colaPasteText: string
  setColaPasteText: (value: string) => void
  procesandoColaPaste: boolean
  handleProcesarColaPaste: () => void
  /** Procesa un bloque de guías pegado directamente en la entrada principal. */
  onPasteGuias: (text: string) => void
  colaFeedback: ColaFeedback | null
  colaPasteResult: ColaPasteResult | null
  setColaPasteResult: (value: ColaPasteResult | null) => void
  colaInputRef: RefObject<HTMLInputElement | null>
}

const SEPARADOR_MULTIPLE = /[\n,;\t]/

/** Entrada única para capturar guías: escanear, escribir (Enter) o pegar varias a la vez. */
export function PaqueteCapturePanel({
  colaInput,
  setColaInput,
  procesandoCola,
  handleColaSubmit,
  showColaPaste,
  setShowColaPaste,
  colaPasteText,
  setColaPasteText,
  procesandoColaPaste,
  handleProcesarColaPaste,
  onPasteGuias,
  colaFeedback,
  colaPasteResult,
  setColaPasteResult,
  colaInputRef,
}: PaqueteCapturePanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Capturar guías</h3>
        <p className="text-xs text-muted-foreground">Escanea, escribe (Enter) o pega varias guías a la vez. Se reúnen en una cola para luego distribuirlas en sacas.</p>
      </div>

      <div className="flex gap-2">
        <Input
          ref={colaInputRef}
          value={colaInput}
          onChange={(e) => setColaInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleColaSubmit(undefined, e.currentTarget.value)
            }
          }}
          onPaste={(e) => {
            const texto = e.clipboardData.getData('text')
            if (SEPARADOR_MULTIPLE.test(texto)) {
              // Pegado de varias guías: procesar en bloque sin ensuciar el campo individual.
              e.preventDefault()
              onPasteGuias(texto)
            }
          }}
          placeholder="Escanea, escribe o pega guías…"
          className="font-mono"
          autoFocus
          aria-busy={procesandoCola}
          aria-label="Escanea, escribe o pega guías"
        />
        <Button type="button" size="icon" onClick={() => handleColaSubmit()} disabled={!colaInput.trim() || procesandoCola} title="Agregar a la cola">
          {procesandoCola ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {colaFeedback && (
        <div
          role="status"
          className={`text-xs rounded-md px-3 py-2 border ${
            colaFeedback.status === 'success'
              ? 'bg-success/10 text-success border-success/20'
              : colaFeedback.status === 'warning'
                ? 'bg-warning/10 text-warning border-warning/20'
                : 'bg-error/10 text-error border-error/20'
          }`}
        >
          <span className="font-mono font-medium">{colaFeedback.guia}</span>: {colaFeedback.message}
        </div>
      )}

      {colaPasteResult && (
        <div className="text-xs rounded-md border border-border/60 bg-muted/20 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Resultado del pegado</span>
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setColaPasteResult(null)}>Ocultar</button>
          </div>
          <p className="text-success">Agregadas: {colaPasteResult.agregados}</p>
          {colaPasteResult.yaAgregados.length > 0 && <p className="text-warning">Repetidas/en saca: {colaPasteResult.yaAgregados.join(', ')}</p>}
          {colaPasteResult.noEncontrados.length > 0 && <p className="text-error">No encontradas: {colaPasteResult.noEncontrados.join(', ')}</p>}
          {colaPasteResult.invalidos.length > 0 && <p className="text-error">Inválidas: {colaPasteResult.invalidos.join(', ')}</p>}
        </div>
      )}

      <div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          onClick={() => setShowColaPaste(v => !v)}
        >
          <ListIcon className="h-3.5 w-3.5" /> {showColaPaste ? 'Ocultar pegado en bloque' : '¿Muchas guías? Pegar en bloque'}
        </button>
      </div>

      {showColaPaste && (
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
          <Textarea
            value={colaPasteText}
            onChange={(e) => setColaPasteText(e.target.value)}
            placeholder={"Pega una guía por línea...\nECA7800083946\nECA7800083947"}
            rows={5}
            className="font-mono text-sm"
            disabled={procesandoColaPaste}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setColaPasteText(''); setShowColaPaste(false); setColaPasteResult(null) }} disabled={procesandoColaPaste}>
              Cerrar
            </Button>
            <Button type="button" size="sm" onClick={handleProcesarColaPaste} disabled={!colaPasteText.trim() || procesandoColaPaste}>
              {procesandoColaPaste ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Procesar lista
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
