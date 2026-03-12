import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/errors'

export function showMutationSuccess(message: string) {
  toast.success(message)
}

export function showMutationError(error: unknown, fallbackMessage: string) {
  toast.error(getApiErrorMessage(error, fallbackMessage))
}
