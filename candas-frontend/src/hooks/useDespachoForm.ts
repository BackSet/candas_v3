import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/authStore'
import type { Despacho } from '@/types/despacho'
import {
  despachoSchema,
  type DespachoFormData,
  defaultDespachoFormData,
  despachoToFormData,
} from '@/schemas/despacho'

export type { DespachoFormData }

export function useDespachoForm(despacho?: Despacho, isEdit: boolean = false) {
  const user = useAuthStore((state) => state.user)

  const form = useForm<DespachoFormData>({
    resolver: zodResolver(despachoSchema),
    defaultValues: defaultDespachoFormData(user),
  })

  const { setValue } = form

  useEffect(() => {
    if (user && !isEdit) {
      const defaults = defaultDespachoFormData(user)
      setValue('usuarioRegistro', defaults.usuarioRegistro)
      setValue('fechaDespacho', defaults.fechaDespacho)
    }
  }, [user, isEdit, setValue])

  useEffect(() => {
    if (despacho) {
      const formData = despachoToFormData(despacho)
      Object.entries(formData).forEach(([key, value]) => {
        if (value != null) {
          setValue(key as keyof DespachoFormData, value)
        }
      })
    }
  }, [despacho, setValue])

  return form
}
