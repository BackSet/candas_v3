import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useCliente, useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import { clienteSchema, type ClienteFormData, clienteFormDataToDto } from '@/schemas/cliente'
import { ArrowLeft, MapPin, Phone, User, Save, Loader2 } from 'lucide-react'
import { LoadingState } from '@/components/states'
import { SectionTitle } from '@/components/ui/section-title'
import { FormError } from '@/components/ui/form-error'
import { Label } from '@/components/ui/label'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'

export default function ClienteForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: cliente, isLoading: loadingCliente } = useCliente(id ? Number(id) : undefined)
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      activo: true,
    },
  })

  useEffect(() => {
    if (cliente) {
      setValue('nombreCompleto', cliente.nombreCompleto)
      setValue('documentoIdentidad', cliente.documentoIdentidad || '')
      setValue('email', cliente.email || '')
      setValue('pais', cliente.pais || '')
      setValue('provincia', cliente.provincia || '')
      setValue('canton', cliente.canton || '')
      setValue('direccion', cliente.direccion || '')
      setValue('telefono', cliente.telefono || '')
      setValue('activo', cliente.activo ?? true)
    }
  }, [cliente, setValue])

  const onSubmit = async (data: ClienteFormData) => {
    const clienteData = clienteFormDataToDto(data)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: clienteData })
      } else {
        await createMutation.mutateAsync(clienteData)
      }
      navigate({ to: '/clientes' })
    } catch (error) {
      // Error handled in hook
    }
  }

  if (isEdit && loadingCliente) {
    return <LoadingState label="Cargando información del cliente..." className="min-h-[50vh]" />
  }

  return (
    <StandardPageLayout
      title={isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={isEdit ? `Modificando: ${cliente?.nombreCompleto || '...'}` : 'Registrar un nuevo cliente en el sistema'}
      icon={<User className="h-4 w-4" />}
      className="animate-in fade-in duration-500"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/clientes' })} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: '/clientes' })}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Información general" variant="form" icon={<User className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="nombreCompleto">Nombre completo <span className="text-destructive">*</span></Label>
                <Input
                  id="nombreCompleto"
                  {...register('nombreCompleto')}
                  className={errors.nombreCompleto ? 'border-destructive' : ''}
                  placeholder="Ej: Juan Pérez"
                />
                <FormError message={errors.nombreCompleto?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentoIdentidad">Documento de identidad</Label>
                <Input id="documentoIdentidad" {...register('documentoIdentidad')} placeholder="Identificación / RUC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" {...register('email')} placeholder="cliente@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activo">Estado</Label>
                <Select
                  value={watch('activo') ? 'true' : 'false'}
                  onValueChange={(val) => setValue('activo', val === 'true')}
                >
                  <SelectTrigger id="activo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4 pb-12">
            <SectionTitle title="Contacto y dirección" variant="form" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Teléfono
                </Label>
                <Input id="telefono" {...register('telefono')} placeholder="Número de teléfono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input id="pais" {...register('pais')} placeholder="País" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" {...register('provincia')} placeholder="Provincia" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canton">Cantón</Label>
                <Input id="canton" {...register('canton')} placeholder="Cantón" />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea id="direccion" {...register('direccion')} rows={3} className="resize-none" placeholder="Dirección detallada" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </StandardPageLayout>
  )
}
