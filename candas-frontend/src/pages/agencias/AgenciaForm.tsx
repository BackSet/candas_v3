import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgencia, useCreateAgencia, useUpdateAgencia } from '@/hooks/useAgencias'
import { Building2, Save, Loader2, Plus, Trash2, Sparkles, MapPin, Phone } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { SectionTitle } from '@/components/ui/section-title'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { FormError } from '@/components/ui/form-error'
import { LoadingState } from '@/components/states'
import { cn } from '@/lib/utils'
import {
  agenciaSchema,
  agenciaFormDataToDto,
  agenciaToFormData,
  agenciaTelefonosToFormItems,
  type AgenciaFormData,
  type TelefonoFormItem,
} from '@/schemas/agencia'
import { generarCodigo10Digitos } from '@/schemas/destinatario-directo'

export default function AgenciaForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: agencia, isLoading: loadingAgencia } = useAgencia(id ? Number(id) : undefined)
  const createMutation = useCreateAgencia()
  const updateMutation = useUpdateAgencia()
  const [telefonos, setTelefonos] = useState<TelefonoFormItem[]>([
    { numero: '', principal: true }
  ])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AgenciaFormData>({
    resolver: zodResolver(agenciaSchema),
    defaultValues: { activa: true },
  })

  useEffect(() => {
    if (agencia) {
      reset(agenciaToFormData(agencia))
      setTelefonos(agenciaTelefonosToFormItems(agencia))
    }
  }, [agencia, reset])

  const agregarTelefono = () => {
    setTelefonos([...telefonos, { numero: '', principal: false }])
  }

  const eliminarTelefono = (index: number) => {
    if (telefonos.length > 1) {
      const nuevosTelefonos = telefonos.filter((_, i) => i !== index)
      if (telefonos[index].principal && nuevosTelefonos.length > 0) {
        nuevosTelefonos[0].principal = true
      }
      setTelefonos(nuevosTelefonos)
    }
  }

  const cambiarPrincipal = (index: number) => {
    setTelefonos(telefonos.map((t, i) => ({ ...t, principal: i === index })))
  }

  const actualizarTelefono = (index: number, numero: string) => {
    setTelefonos(telefonos.map((t, i) => (i === index ? { ...t, numero } : t)))
  }

  const onSubmit = async (data: AgenciaFormData) => {
    const telefonosValidos = telefonos.filter(t => t.numero.trim() !== '')
    if (telefonosValidos.length === 0) {
      toast.error('Debe ingresar al menos un número de teléfono')
      return
    }

    const agenciaData = agenciaFormDataToDto(data, telefonosValidos)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: agenciaData })
      } else {
        await createMutation.mutateAsync(agenciaData)
      }
      navigate({ to: '/agencias' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingAgencia) {
    return <LoadingState label="Cargando información de la agencia..." className="min-h-[50vh]" />
  }

  return (
    <StandardPageLayout
      title={isEdit ? 'Editar Agencia' : 'Nueva Agencia'}
      subtitle={isEdit ? `Modificando: ${agencia?.nombre ?? '...'}` : 'Registrar nueva agencia'}
      icon={<Building2 className="h-4 w-4" />}
      className="animate-in fade-in duration-500"
      actions={
        <>
          <Button variant="outline" onClick={() => navigate({ to: '/agencias' })}>
            Cancelar
          </Button>
          <Button type="submit" form="agencia-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <form id="agencia-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-8">

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Información principal" variant="form" icon={<Building2 className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Agencia <span className="text-destructive">*</span></Label>
                <Input
                  id="nombre"
                  {...register('nombre')}
                  className={cn(errors.nombre && 'border-destructive')}
                  autoFocus={!isEdit}
                />
                <FormError message={errors.nombre?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    {...register('codigo')}
                    placeholder="Escribir o generar"
                    className="font-mono text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => setValue('codigo', generarCodigo10Digitos())}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Generar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={cn(errors.email && 'border-destructive')}
                />
                <FormError message={errors.email?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activa">Estado</Label>
                <Select
                  value={watch('activa') ? 'true' : 'false'}
                  onValueChange={(value) => setValue('activa', value === 'true')}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Contacto telefónico" variant="form" icon={<Phone className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="space-y-3">
              {telefonos.map((telefono, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Número de teléfono"
                      value={telefono.numero}
                      onChange={(e) => actualizarTelefono(index, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={telefono.principal ? "default" : "outline"}
                    size="sm"
                    onClick={() => cambiarPrincipal(index)}
                    className={cn("h-9 px-3", telefono.principal && "bg-green-600 hover:bg-green-700 text-white")}
                    title={telefono.principal ? "Teléfono principal" : "Marcar como principal"}
                  >
                    {telefono.principal ? "Principal" : "Hacer Principal"}
                  </Button>
                  {telefonos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarTelefono(index)}
                      title="Eliminar teléfono"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={agregarTelefono}
              className="w-full border-dashed"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar otro teléfono
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Ubicación y detalles" variant="form" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="canton">Cantón</Label>
                <Input id="canton" {...register('canton')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombrePersonal">Nombre personal contacto</Label>
                <Input id="nombrePersonal" {...register('nombrePersonal')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  {...register('direccion')}
                  placeholder="Dirección completa..."
                  rows={2}
                  className="min-h-[60px] resize-y"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="horarioAtencion">Horario de atención</Label>
                <Textarea
                  id="horarioAtencion"
                  {...register('horarioAtencion')}
                  placeholder="Lunes a Viernes: 9:00 - 18:00..."
                  rows={2}
                  className="min-h-[60px] resize-y"
                />
              </div>
            </div>
          </section>

        </form>
      </div>
    </StandardPageLayout>
  )
}
