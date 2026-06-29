import { useCreateDespacho } from '@/hooks/useDespachos'
import type { Despacho } from '@/types/despacho'
import {
  construirDespachoPayload,
  validarDespachoParaCrear,
  type ConstruirDespachoPayloadInput,
} from '@/utils/despachoPayload'
import { useCallback } from 'react'

/**
 * Hook reutilizable para construir y crear despachos individuales sin depender
 * del DOM ni de la navegación. Envuelve `useCreateDespacho` (vía único punto de
 * submit) y la lógica pura de `despachoPayload`, de modo que tanto el formulario
 * individual como el módulo de despacho masivo creen despachos de forma idéntica.
 */
export function useDespachoBuilder() {
  const createMutation = useCreateDespacho()

  /** Construye el DTO sin enviarlo (útil para previsualizar o acumular en un lote). */
  const construirPayload = useCallback(
    (input: ConstruirDespachoPayloadInput): Despacho => construirDespachoPayload(input),
    []
  )

  /**
   * Valida y crea un despacho. Si la validación falla, rechaza la promesa con el
   * mensaje de error (el llamador decide cómo notificarlo). En éxito, delega en
   * `useCreateDespacho`, que mantiene invalidación de caché y notificaciones.
   */
  const crearDespacho = useCallback(
    (input: ConstruirDespachoPayloadInput): Promise<Despacho> => {
      const error = validarDespachoParaCrear({ sacas: input.sacas, destino: input.destino })
      if (error) {
        return Promise.reject(new Error(error))
      }
      return createMutation.mutateAsync(construirDespachoPayload(input))
    },
    [createMutation]
  )

  return {
    crearDespacho,
    construirPayload,
    validar: validarDespachoParaCrear,
    isCreating: createMutation.isPending,
    createMutation,
  }
}
