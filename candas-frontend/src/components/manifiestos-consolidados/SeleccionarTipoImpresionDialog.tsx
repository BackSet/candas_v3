import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ManifiestoConsolidadoDetalle } from '@/types/manifiesto-consolidado'
import { imprimirManifiestoConsolidado, generarPDFManifiestoConsolidado } from '@/utils/imprimirManifiestoConsolidado'
import { useAuthStore } from '@/stores/authStore'
import { useAgencia } from '@/hooks/useAgencias'
import { Printer, Download, Building2, Users, LayoutList } from 'lucide-react'
import { toast } from 'sonner'

type TipoFiltro = 'todos' | 'agencias' | 'destinatarios-directos'

interface SeleccionarTipoImpresionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manifiesto: ManifiestoConsolidadoDetalle
}

const OPCIONES: Array<{
  value: TipoFiltro
  label: string
  hint: string
  icon: typeof LayoutList
  color: string
}> = [
    {
      value: 'todos',
      label: 'Todos',
      hint: 'Agencias y destinatarios directos',
      icon: LayoutList,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      value: 'agencias',
      label: 'Solo Agencias',
      hint: 'Despachos a agencias',
      icon: Building2,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    {
      value: 'destinatarios-directos',
      label: 'Dest. Directos',
      hint: 'Solo destinatarios directos',
      icon: Users,
      color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    },
  ]

export default function SeleccionarTipoImpresionDialog({
  open,
  onOpenChange,
  manifiesto,
}: SeleccionarTipoImpresionDialogProps) {
  const user = useAuthStore((s) => s.user)
  const activeAgencyId = useAuthStore((s) => s.activeAgencyId)
  const agenciaOrigenId = activeAgencyId ?? user?.idAgencia
  const { data: agenciaUsuario } = useAgencia(agenciaOrigenId ?? undefined)
  const nombreAgenciaOrigen = agenciaUsuario?.nombre ?? undefined

  const handleImprimir = (tipo: TipoFiltro) => {
    imprimirManifiestoConsolidado(manifiesto, tipo, nombreAgenciaOrigen)
    onOpenChange(false)
  }

  const handleDescargar = async (tipo: TipoFiltro) => {
    try {
      await generarPDFManifiestoConsolidado(manifiesto, tipo, nombreAgenciaOrigen)
      toast.success('PDF descargado correctamente')
      onOpenChange(false)
    } catch {
      toast.error('Error al generar el PDF')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl border-border/50 p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border/30 bg-gradient-to-b from-muted/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Imprimir / Descargar</DialogTitle>
              <DialogDescription>
                Selecciona la acción y el alcance para el manifiesto
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Sección Imprimir */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Printer className="h-3.5 w-3.5 text-muted-foreground/60" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Imprimir</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {OPCIONES.map((opcion) => {
                const Icon = opcion.icon
                return (
                  <Button
                    key={`imprimir-${opcion.value}`}
                    type="button"
                    variant="outline"
                    className="h-auto py-3.5 px-4 min-w-0 whitespace-normal flex flex-col items-start gap-2 text-left rounded-xl border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200"
                    onClick={() => handleImprimir(opcion.value)}
                  >
                    <span className="w-full flex items-center gap-2.5 text-sm font-semibold">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${opcion.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {opcion.label}
                    </span>
                    <span className="w-full text-[11px] text-muted-foreground/70 leading-tight whitespace-normal break-words pl-9.5">
                      {opcion.hint}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Sección Descargar PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5 text-muted-foreground/60" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descargar PDF</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {OPCIONES.map((opcion) => {
                const Icon = opcion.icon
                return (
                  <Button
                    key={`descargar-${opcion.value}`}
                    type="button"
                    variant="outline"
                    className="h-auto py-3.5 px-4 min-w-0 whitespace-normal flex flex-col items-start gap-2 text-left rounded-xl border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200"
                    onClick={() => handleDescargar(opcion.value)}
                  >
                    <span className="w-full flex items-center gap-2.5 text-sm font-semibold">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${opcion.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {opcion.label}
                    </span>
                    <span className="w-full text-[11px] text-muted-foreground/70 leading-tight whitespace-normal break-words pl-9.5">
                      {opcion.hint}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
