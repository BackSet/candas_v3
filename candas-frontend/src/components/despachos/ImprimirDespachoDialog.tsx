import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { Saca } from '@/types/saca'
import { FileText, Loader2, Printer, Tag, Tags } from 'lucide-react'

export type TipoImpresion =
  | 'etiqueta'
  | 'todas'
  | 'etiqueta-zebra'
  | 'todas-zebra'
  | 'documento'

interface ImprimirDespachoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoImpresion: TipoImpresion
  onTipoImpresionChange: (tipo: TipoImpresion) => void
  sacaSeleccionada: number | null
  onSacaSeleccionadaChange: (idSaca: number | null) => void
  sacas: Saca[]
  onPrint: () => void
  onQuickPrint: (tipo: TipoImpresion) => void
  onCancel: () => void
  isPrinting?: boolean
  quickActionLoading?: TipoImpresion | null
}

const OPCIONES_TIPO: Array<{
  value: TipoImpresion
  label: string
  hint: string
  requiereSaca: boolean
  requiereSacas: boolean
}> = [
  {
    value: 'etiqueta',
    label: 'Etiqueta individual',
    hint: 'Imprime una saca específica en formato normal.',
    requiereSaca: true,
    requiereSacas: true,
  },
  {
    value: 'etiqueta-zebra',
    label: 'Etiqueta individual Zebra',
    hint: 'Imprime una saca específica en formato Zebra.',
    requiereSaca: true,
    requiereSacas: true,
  },
]

const ACCIONES_RAPIDAS: Array<{
  value: TipoImpresion
  label: string
  hint: string
  icon: typeof FileText
}> = [
  {
    value: 'documento',
    label: 'Documento',
    hint: 'Manifiesto completo',
    icon: FileText,
  },
  {
    value: 'todas',
    label: 'Todas etiquetas',
    hint: 'Todas en formato normal',
    icon: Tags,
  },
  {
    value: 'todas-zebra',
    label: 'Todas Zebra',
    hint: 'Todas en formato Zebra',
    icon: Tag,
  },
]

function isTipoImpresion(value: string): value is TipoImpresion {
  return OPCIONES_TIPO.some((option) => option.value === value)
}

export default function ImprimirDespachoDialog({
  open,
  onOpenChange,
  tipoImpresion,
  onTipoImpresionChange,
  sacaSeleccionada,
  onSacaSeleccionadaChange,
  sacas,
  onPrint,
  onQuickPrint,
  onCancel,
  isPrinting = false,
  quickActionLoading = null,
}: ImprimirDespachoDialogProps) {
  const sacasOrdenadas = [...sacas].sort(
    (a, b) => (a.numeroOrden || 0) - (b.numeroOrden || 0)
  )
  const sinSacas = sacasOrdenadas.length === 0
  const requiereSaca =
    tipoImpresion === 'etiqueta' || tipoImpresion === 'etiqueta-zebra'
  const requiereSacas =
    tipoImpresion === 'etiqueta' ||
    tipoImpresion === 'etiqueta-zebra' ||
    tipoImpresion === 'todas' ||
    tipoImpresion === 'todas-zebra'
  const botonImprimirDisabled =
    (requiereSaca && !sacaSeleccionada) || (requiereSacas && sinSacas)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir despacho
          </DialogTitle>
          <DialogDescription>
            Imprime todas las etiquetas en 1 clic o usa impresión individual por saca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Acciones rápidas</p>
              <Badge variant="secondary" className="text-[10px]">
                1 clic
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ACCIONES_RAPIDAS.map((action) => {
                const Icon = action.icon
                const requiereSacasAction =
                  action.value === 'todas' || action.value === 'todas-zebra'
                const disabled = requiereSacasAction && sinSacas
                return (
                  <Button
                    key={action.value}
                    type="button"
                    variant="outline"
                    className="h-auto py-3 px-3 flex flex-col items-start gap-1 text-left"
                    onClick={() => onQuickPrint(action.value)}
                    disabled={disabled || isPrinting}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {quickActionLoading === action.value ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      {action.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {action.hint}
                    </span>
                  </Button>
                )
              })}
            </div>
            {sinSacas && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Este despacho no tiene sacas. Solo está disponible la impresión
                de documento.
              </p>
            )}
          </div>

          <div className="space-y-3 border rounded-md p-3 bg-muted/20">
            <p className="text-sm font-medium">Modo avanzado</p>

            <div className="space-y-2">
              <Label variant="muted" className="text-xs uppercase tracking-wide">
                Tipo de impresión
              </Label>
              <Select
                value={tipoImpresion}
                onValueChange={(value) => {
                  if (!isTipoImpresion(value)) return
                  onTipoImpresionChange(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCIONES_TIPO.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.requiereSacas && sinSacas}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {OPCIONES_TIPO.find((x) => x.value === tipoImpresion)?.hint}
              </p>
            </div>

            {requiereSaca && (
              <div className="space-y-2">
                <Label variant="muted" className="text-xs uppercase tracking-wide">
                  Saca a imprimir
                </Label>
                <Select
                  value={sacaSeleccionada?.toString() || ''}
                  onValueChange={(value) =>
                    onSacaSeleccionadaChange(value ? Number(value) : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una saca" />
                  </SelectTrigger>
                  <SelectContent>
                    {sacasOrdenadas.map((saca) => (
                      <SelectItem
                        key={saca.idSaca}
                        value={String(saca.idSaca)}
                      >
                        #{saca.numeroOrden} - {saca.tamano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!sacaSeleccionada && !sinSacas && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Selecciona una saca para continuar.
                  </p>
                )}
              </div>
            )}

            {!sinSacas && sacaSeleccionada && (
              <p className="text-xs text-muted-foreground">
                Si la saca seleccionada es la última, la etiqueta conservará la nota
                <span className="font-medium"> MANIFIESTO IMPRESO</span>.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPrinting}>
            Cancelar
          </Button>
          <Button onClick={onPrint} disabled={botonImprimirDisabled || isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Imprimiendo...
              </>
            ) : (
              'Imprimir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
