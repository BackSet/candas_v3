import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDistribuidor, useCreateDistribuidor, useUpdateDistribuidor } from '@/hooks/useDistribuidores'
import type { Distribuidor } from '@/types/distribuidor'
import { Building2, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/app/layout/PageContainer'
import { PageHeader } from '@/app/layout/PageHeader'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'
import { SectionTitle } from '@/components/ui/section-title'
import { LoadingState } from '@/components/states'

const distribuidorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  activa: z.boolean().optional(),
})

type DistribuidorFormData = z.infer<typeof distribuidorSchema>

export default function DistribuidorForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const isEdit = !!id

  const { data: distribuidor, isLoading: loadingDistribuidor } = useDistribuidor(id ? Number(id) : undefined)
  const createMutation = useCreateDistribuidor()
  const updateMutation = useUpdateDistribuidor()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DistribuidorFormData>({
    resolver: zodResolver(distribuidorSchema),
    defaultValues: { activa: true },
  })

  useEffect(() => {
    if (distribuidor) {
      setValue('nombre', distribuidor.nombre)
      setValue('codigo', distribuidor.codigo || '')
      setValue('email', distribuidor.email || '')
      setValue('activa', distribuidor.activa ?? true)
    }
  }, [distribuidor, setValue])

  const onSubmit = async (data: DistribuidorFormData) => {
    const distribuidorData: Distribuidor = {
      ...data,
      email: data.email === '' ? undefined : data.email,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), dto: distribuidorData })
      } else {
        await createMutation.mutateAsync(distribuidorData)
      }
      navigate({ to: '/distribuidores' })
    } catch {
      // Error ya manejado en el hook
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingDistribuidor) {
    return <LoadingState label="Cargando información del distribuidor..." className="min-h-[50vh]" />
  }

  return (
    <PageContainer className="w-full flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <PageHeader
        icon={<Building2 className="h-4 w-4" />}
        title={isEdit ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
        subtitle={isEdit ? `Modificando: ${distribuidor?.nombre ?? '...'}` : 'Registrar nuevo distribuidor'}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: '/distribuidores' })}>
              Cancelar
            </Button>
            <Button type="submit" form="distribuidor-form" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <form id="distribuidor-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-8">

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <SectionTitle title="Información principal" variant="form" icon={<Building2 className="h-4 w-4 text-muted-foreground" />} as="h3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span></Label>
                <Input
                  id="nombre"
                  {...register('nombre')}
                  className={cn(errors.nombre && 'border-destructive')}
                  placeholder="Ej. Distribuidora Central"
                  autoFocus={!isEdit}
                />
                <FormError message={errors.nombre?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código Interno</Label>
                <Input
                  id="codigo"
                  {...register('codigo')}
                  className="font-mono text-xs"
                  placeholder="Ej. DIST-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={cn(errors.email && 'border-destructive')}
                  placeholder="contacto@distribuidora.com"
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

        </form>
      </div>
    </PageContainer>
  )
}
