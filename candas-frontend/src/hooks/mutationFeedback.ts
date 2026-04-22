import { notify, type ToastId } from '@/lib/notify'

/**
 * Wrappers retrocompatibles. Para nuevo código preferir `import { notify } from '@/lib/notify'`.
 */

export function showMutationSuccess(message: string): void {
  notify.success(message)
}

export function showMutationError(error: unknown, fallbackMessage: string): void {
  notify.error(error, fallbackMessage)
}

export function showProcessStart(message: string): ToastId {
  return notify.start(message)
}

export function showProcessSuccess(toastId: ToastId, message: string): void {
  notify.finish(toastId, message)
}

export function showProcessError(toastId: ToastId, error: unknown, fallbackMessage: string): void {
  notify.fail(toastId, error, fallbackMessage)
}
