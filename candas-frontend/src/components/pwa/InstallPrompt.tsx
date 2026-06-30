import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt'
import { notify } from '@/lib/notify'
import { Download, Share, SquarePlus } from 'lucide-react'
import { useState } from 'react'

/**
 * Acción discreta para instalar Candas como aplicación (PWA).
 *
 * - En Chrome/Edge/Android usa el diálogo nativo (`beforeinstallprompt`).
 * - En iOS muestra instrucciones manuales ("Compartir → Añadir a pantalla de inicio").
 * - Si la app ya está instalada (standalone) o no es instalable, no renderiza nada.
 *
 * Pensado para vivir en la fila de iconos del `Header`; usa los componentes UI base.
 */
export function InstallPrompt() {
  const { canInstall, canShowIosHint, promptInstall } = usePwaInstallPrompt()
  const [iosOpen, setIosOpen] = useState(false)

  if (canInstall) {
    return (
      <Button
        variant="ghost"
        size="icon"
        type="button"
        aria-label="Instalar Candas"
        title="Instalar Candas como aplicación"
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={async () => {
          const outcome = await promptInstall()
          if (outcome === 'accepted') notify.success('Instalando Candas…')
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
    )
  }

  if (canShowIosHint) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Instalar Candas"
          title="Añadir Candas a la pantalla de inicio"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setIosOpen(true)}
        >
          <Download className="h-4 w-4" />
        </Button>

        <Dialog open={iosOpen} onOpenChange={setIosOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Instalar Candas en iPhone/iPad</DialogTitle>
              <DialogDescription>
                Añade Candas a tu pantalla de inicio para abrirla como una aplicación.
              </DialogDescription>
            </DialogHeader>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  Pulsa el botón
                  <Share className="inline size-4 text-primary" aria-label="Compartir" />
                  <span className="font-medium">Compartir</span> en la barra de Safari.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  Elige
                  <SquarePlus className="inline size-4 text-primary" aria-label="Añadir" />
                  <span className="font-medium">Añadir a pantalla de inicio</span>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span>
                  Confirma con <span className="font-medium">Añadir</span>. Candas aparecerá como app.
                </span>
              </li>
            </ol>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return null
}
