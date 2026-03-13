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
import { useDestinatarioDirecto, useCreateDestinatarioDirecto, useUpdateDestinatarioDirecto } from '@/hooks/useDestinatariosDirectos'
import {
  destinatarioDirectoSchema,
  destinatarioDirectoFormDataToDto,
  destinatarioToFormData,
  generarCodigo10Digitos,
  type DestinatarioDirectoFormData,
} from '@/schemas/destinatario-directo'
import { ArrowLeft, User, MapPin, Building2, Save, Loader2, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { SectionTitle } from '@/components/ui/section-title'
import { FormError } from '@/components/ui/form-error'
import { LoadingState } from '@/components/states'
import { cn } from '@/lib/utils'

export default function DestinatarioDirectoForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: destinatario, isLoading: loadingDestinatario } = useDestinatarioDirecto(id ? Number(id) : undefined)
  const createMutation = useCreateDestinatarioDirecto()
  const updateMutation = useUpdateDestinatarioDirecto()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DestinatarioDirectoFormData>({
    resolver: zodResolver(destinatarioDirectoSchema),
    defaultValues: { activo: true },
  })

  useEffect(() => {
    if (destinatario) {
      reset(destinatarioToFormData(destinatario))
    }
  }, [destinatario, reset])

  const onSubmit = async (data: DestinatarioDirectoFormData) => {
    const destinatarioData = destinatarioDirectoFormDataToDto(data)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: destinatarioData })
      } else {
        await createMutation.mutateAsync(destinatarioData)
      }
      navigate({ to: '/destinatarios-directos' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingDestinatario) {
    return <LoadingState label="Cargando información del destinatario..." className="min-h-[50vh]" />
  }

  return (
    <StandardPageLayout
      title={isEdit ? 'Editar Destinatario' : 'Nuevo Destinatario'}
      subtitle={isEdit ? `Modificando: ${destinatario?.nombreDestinatario ?? '...'}` : 'Registrar nuevo destinatario directo'}
      icon={<User className="h-4 w-4" />}
      className="animate-in fade-in duration-500"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/destinatarios-directos' })} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: '/destinatarios-directos' })}>
            Cancelar
          </Button>
          <Button type="submit" form="destinatario-directo-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <form id="destinatario-directo-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-8">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Información personal" variant="form" icon={<User className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombreDestinatario">Nombre completo <span className="text-destructive">*</span></Label>
                <Input
                  id="nombreDestinatario"
                  {...register('nombreDestinatario')}
                  placeholder="Ej: Juan Pérez"
                  className={cn(errors.nombreDestinatario && 'border-destructive')}
                  autoFocus={!isEdit}
                />
                <FormError message={errors.nombreDestinatario?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefonoDestinatario">Teléfono <span className="text-destructive">*</span></Label>
                <Input
                  id="telefonoDestinatario"
                  {...register('telefonoDestinatario')}
                  placeholder="Ej: 0912345678"
                  className={cn(errors.telefonoDestinatario && 'border-destructive')}
                />
                <FormError message={errors.telefonoDestinatario?.message} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4 pb-8">
            <SectionTitle title="Ubicación y referencias" variant="form" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="canton">Cantón</Label>
                <Input id="canton" {...register('canton')} placeholder="Ej: Quito" />
                <FormError message={errors.canton?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    {...register('codigo')}
                    placeholder="Opcional"
                    className={cn('font-mono flex-1', errors.codigo && 'border-destructive')}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={() => setValue('codigo', generarCodigo10Digitos())}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Generar
                  </Button>
                </div>
                <FormError message={errors.codigo?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activo">Estado</Label>
                <Select
                  value={watch('activo') ? 'true' : 'false'}
                  onValueChange={(value) => setValue('activo', value === 'true')}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombreEmpresa" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Nombre empresa
                </Label>
                <Input id="nombreEmpresa" {...register('nombreEmpresa')} placeholder="Opcional" />
                <FormError message={errors.nombreEmpresa?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccionDestinatario">Dirección</Label>
                <Textarea
                  id="direccionDestinatario"
                  {...register('direccionDestinatario')}
                  placeholder="Calle principal, secundaria, número de casa..."
                  className="min-h-[80px] resize-none"
                />
                <FormError message={errors.direccionDestinatario?.message} />
              </div>
            </div>
          </section>
        </form>
      </div>
    </StandardPageLayout>
  )
}
