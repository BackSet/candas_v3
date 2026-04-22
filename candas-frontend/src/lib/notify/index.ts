import { toast, type ExternalToast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/errors'

export { NOTIFY_MESSAGES } from './messages'

export type ToastId = string | number

export interface NotifyActionOptions {
  label: string
  onClick: () => void
}

export interface NotifyOptions extends Omit<ExternalToast, 'id'> {
  action?: NotifyActionOptions
}

interface PromiseMessages<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: unknown) => string)
}

function buildOptions(opts?: NotifyOptions): ExternalToast | undefined {
  if (!opts) return undefined
  const { action, ...rest } = opts
  if (!action) return rest
  return {
    ...rest,
    action: {
      label: action.label,
      onClick: () => action.onClick(),
    },
  }
}

function notifySuccess(message: string, opts?: NotifyOptions): ToastId {
  return toast.success(message, buildOptions(opts))
}

function notifyInfo(message: string, opts?: NotifyOptions): ToastId {
  return toast.info(message, buildOptions(opts))
}

function notifyWarning(message: string, opts?: NotifyOptions): ToastId {
  return toast.warning(message, buildOptions(opts))
}

function notifyMessage(message: string, opts?: NotifyOptions): ToastId {
  return toast(message, buildOptions(opts))
}

/**
 * Toast de error con dos sobrecargas:
 * - notifyError(message, opts?)            → muestra `message` literal.
 * - notifyError(error, fallback, opts?)    → extrae el mensaje del API o usa `fallback`.
 */
function notifyError(message: string, opts?: NotifyOptions): ToastId
function notifyError(error: unknown, fallback: string, opts?: NotifyOptions): ToastId
function notifyError(
  errorOrMessage: unknown,
  fallbackOrOpts?: string | NotifyOptions,
  opts?: NotifyOptions
): ToastId {
  if (typeof fallbackOrOpts === 'string') {
    return toast.error(
      getApiErrorMessage(errorOrMessage, fallbackOrOpts),
      buildOptions(opts)
    )
  }
  if (typeof errorOrMessage === 'string') {
    return toast.error(errorOrMessage, buildOptions(fallbackOrOpts))
  }
  return toast.error(
    getApiErrorMessage(errorOrMessage, 'Ocurrió un error inesperado.'),
    buildOptions(fallbackOrOpts)
  )
}

function notifyStart(message: string, opts?: NotifyOptions): ToastId {
  return toast.loading(message, buildOptions(opts))
}

function notifyFinish(id: ToastId, message: string, opts?: NotifyOptions): ToastId {
  return toast.success(message, { ...buildOptions(opts), id })
}

/**
 * Cierra un toast `start` con error, con dos sobrecargas:
 * - notifyFail(id, message, opts?)              → muestra `message` literal.
 * - notifyFail(id, error, fallback, opts?)      → extrae el mensaje del API o usa `fallback`.
 */
function notifyFail(id: ToastId, message: string, opts?: NotifyOptions): ToastId
function notifyFail(id: ToastId, error: unknown, fallback: string, opts?: NotifyOptions): ToastId
function notifyFail(
  id: ToastId,
  errorOrMessage: unknown,
  fallbackOrOpts?: string | NotifyOptions,
  opts?: NotifyOptions
): ToastId {
  if (typeof fallbackOrOpts === 'string') {
    return toast.error(getApiErrorMessage(errorOrMessage, fallbackOrOpts), {
      ...buildOptions(opts),
      id,
    })
  }
  if (typeof errorOrMessage === 'string') {
    return toast.error(errorOrMessage, { ...buildOptions(fallbackOrOpts), id })
  }
  return toast.error(getApiErrorMessage(errorOrMessage, 'Ocurrió un error inesperado.'), {
    ...buildOptions(fallbackOrOpts),
    id,
  })
}

function notifyDismiss(id?: ToastId): void {
  toast.dismiss(id)
}

function notifyPromise<T>(
  promise: Promise<T>,
  msgs: PromiseMessages<T>,
  opts?: NotifyOptions
): Promise<T> {
  toast.promise(promise, {
    loading: msgs.loading,
    success: (data) => (typeof msgs.success === 'function' ? msgs.success(data) : msgs.success),
    error: (err) =>
      typeof msgs.error === 'function'
        ? msgs.error(err)
        : getApiErrorMessage(err, msgs.error),
    ...buildOptions(opts),
  })
  return promise
}

function notifyAction(
  message: string,
  action: NotifyActionOptions,
  opts?: Omit<NotifyOptions, 'action'>
): ToastId {
  return toast(message, buildOptions({ ...opts, action }))
}

/**
 * Helper unificado de notificaciones del sistema.
 * Centraliza el uso de Sonner con tono consistente y soporte de tema/acciones.
 */
export const notify = {
  success: notifySuccess,
  error: notifyError,
  info: notifyInfo,
  warning: notifyWarning,
  message: notifyMessage,
  start: notifyStart,
  finish: notifyFinish,
  fail: notifyFail,
  dismiss: notifyDismiss,
  promise: notifyPromise,
  action: notifyAction,
}

export type Notify = typeof notify
