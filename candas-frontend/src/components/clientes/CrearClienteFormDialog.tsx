import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { useClienteManager } from '@/hooks/useClienteManager'

interface CrearClienteFormDialogProps {
  title: string
  manager: ReturnType<typeof useClienteManager>
}

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
    {children}
    {required && <span className="text-destructive">*</span>}
  </label>
)

export function CrearClienteFormDialog({ title, manager }: CrearClienteFormDialogProps) {
  return (
    <Dialog open={manager.showCrearClienteDialog} onOpenChange={manager.setShowCrearClienteDialog}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <FieldLabel required>Nombre Completo</FieldLabel>
            <Input value={manager.nuevoClienteNombre} onChange={(e) => manager.setNuevoClienteNombre(e.target.value)} />
          </div>
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <FieldLabel>Documento</FieldLabel>
              <Input value={manager.nuevoClienteDocumento} onChange={(e) => manager.setNuevoClienteDocumento(e.target.value)} />
            </div>
            <div className="space-y-2 flex-1">
              <FieldLabel>Email</FieldLabel>
              <Input value={manager.nuevoClienteEmail} onChange={(e) => manager.setNuevoClienteEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel>Teléfono</FieldLabel>
              <Input value={manager.nuevoClienteTelefono} onChange={(e) => manager.setNuevoClienteTelefono(e.target.value)} placeholder="Número" />
            </div>
            <div className="space-y-2">
              <FieldLabel>País</FieldLabel>
              <Input value={manager.nuevoClientePais} onChange={(e) => manager.setNuevoClientePais(e.target.value)} placeholder="País" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Provincia</FieldLabel>
              <Input value={manager.nuevoClienteProvincia} onChange={(e) => manager.setNuevoClienteProvincia(e.target.value)} placeholder="Provincia" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Cantón</FieldLabel>
              <Input value={manager.nuevoClienteCanton} onChange={(e) => manager.setNuevoClienteCanton(e.target.value)} placeholder="Cantón" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Dirección</FieldLabel>
              <Textarea value={manager.nuevoClienteDireccion} onChange={(e) => manager.setNuevoClienteDireccion(e.target.value)} placeholder="Dirección" className="resize-none" rows={3} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => manager.setShowCrearClienteDialog(false)}>Cancelar</Button>
          <Button onClick={() => manager.handleCrearCliente()}>Crear Cliente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
