import { useEffect, useRef, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { FieldError } from 'react-hook-form'
import { ArrowLeft, Loader2, Save, type LucideProps } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'
import { FormSkeleton } from '@/components/states/FormSkeleton'
import { ErrorState } from '@/components/states'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useDirtyGuard } from '@/hooks/useDirtyGuard'
import { notify } from '@/lib/notify'
import { UnsavedChangesDialog } from './UnsavedChangesDialog'
import { cn } from '@/lib/utils'

interface PrimaryActionConfig {
  label: string
  icon?: ComponentType<LucideProps>
  /** Texto mostrado mientras `isSubmitting`. */
  loadingLabel?: string
  /** Si true, oculta el botón. */
  hidden?: boolean
  /** Deshabilita el botón aún cuando no esté submitting. */
  disabled?: boolean
}

export interface FormPageLayoutProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  /** URL al que vuelve el botón "Atrás" / "Cancelar". */
  backUrl: string
  /** ID del `<form>`; obligatorio para que el botón primario haga submit. */
  formId: string
  /** Estado de submit (deshabilita botones y muestra spinner). */
  isSubmitting?: boolean
  /** Estado de carga inicial de la entidad (muestra `FormSkeleton`). */
  isLoading?: boolean
  /** Si hay error de carga, se muestra `ErrorState`. */
  loadError?: unknown
  onRetry?: () => void
  /** Errores del formulario (para mostrar resumen). Acepta `errors` de `useForm` directamente. */
  errors?: Record<string, unknown>
  /** Form RHF (para activar dirty guard automáticamente). Solo se lee `formState.isDirty`. */
  form?: { formState: { isDirty: boolean } }
  /** Si true, fuerza el dirty guard (sobrescribe `form.formState.isDirty`). */
  isDirty?: boolean
  /**
   * Si true, no se muestra el diálogo de cambios sin guardar ni se bloquea la
   * navegación por formulario sucio (útil en altas nuevas donde se prefiere
   * salir con Atrás/Cancelar sin confirmación).
   */
  skipUnsavedPrompt?: boolean
  /**
   * Si true, no se muestra el diálogo "Cambios sin guardar": se asume que
   * el formulario persiste sus datos en localStorage como borrador.
   * En su lugar, al salir se muestra un toast informativo y la navegación
   * continúa normalmente. Tampoco se activa `beforeunload`.
   */
  draftMode?: boolean
  /** Mensaje del toast en `draftMode` (solo se muestra si hay cambios). */
  draftToastMessage?: string
  /** Configuración del botón primario. */
  primaryAction?: PrimaryActionConfig
  /** Acciones secundarias antes del botón primario. */
  secondaryActions?: ReactNode
  /** Skeleton custom a usar en `isLoading`. */
  loadingFallback?: ReactNode
  /** Slot debajo del header (ej. stepper). */
  subheader?: ReactNode
  /** Ancho del contenedor. */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Si false, oculta el botón "Cancelar". */
  showCancel?: boolean
  /** Etiqueta para el botón cancelar. */
  cancelLabel?: string
  /** Contenido del formulario (FormSection, etc.). */
  children: ReactNode
  className?: string
}

const ERROR_MAP_LIMIT = 4

function flattenErrors(
  errors: Record<string, unknown> | undefined,
  parentKey = ''
): Array<{ path: string; message: string }> {
  if (!errors) return []
  const out: Array<{ path: string; message: string }> = []
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== 'object') continue
    const path = parentKey ? `${parentKey}.${key}` : key
    const candidate = value as FieldError & Record<string, unknown>
    if ('message' in candidate && candidate.message) {
      out.push({ path, message: String(candidate.message) })
    } else {
      out.push(...flattenErrors(candidate as Record<string, unknown>, path))
    }
  }
  return out
}

export function FormPageLayout({
  title,
  subtitle,
  icon,
  backUrl,
  formId,
  isSubmitting = false,
  isLoading = false,
  loadError,
  onRetry,
  errors,
  form,
  isDirty,
  primaryAction = { label: 'Guardar', icon: Save },
  secondaryActions,
  loadingFallback,
  subheader,
  width = 'lg',
  showCancel = true,
  cancelLabel = 'Cancelar',
  skipUnsavedPrompt = false,
  draftMode = false,
  draftToastMessage,
  children,
  className,
}: FormPageLayoutProps) {
  const navigate = useNavigate()

  const computedDirty =
    typeof isDirty === 'boolean'
      ? isDirty
      : !!form?.formState.isDirty

  const dirtyGuardEnabled =
    computedDirty && !isSubmitting && !isLoading && !skipUnsavedPrompt
  const guard = useDirtyGuard({
    enabled: dirtyGuardEnabled,
    enableBeforeUnload: dirtyGuardEnabled && !draftMode,
  })

  const draftToastShownRef = useRef(false)
  useEffect(() => {
    if (!draftMode) return
    if (!guard.isBlocked) return
    if (!draftToastShownRef.current) {
      draftToastShownRef.current = true
      notify.info(
        draftToastMessage ??
          'Guardamos tus cambios como borrador. Al volver a entrar podrás continuar.',
        {
          position: 'bottom-right',
          duration: 4000,
          closeButton: false,
        }
      )
      window.setTimeout(() => {
        draftToastShownRef.current = false
      }, 1500)
    }
    guard.proceed()
  }, [draftMode, guard, draftToastMessage])

  const handleBack = () => {
    void navigate({ to: backUrl })
  }

  const PrimaryIcon = primaryAction.icon
  const primaryLabel = isSubmitting
    ? primaryAction.loadingLabel ?? 'Guardando...'
    : primaryAction.label

  const flatErrors = errors ? flattenErrors(errors) : []

  const actions = (
    <>
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      {secondaryActions}
      {!primaryAction.hidden && (
        <Button
          type="submit"
          form={formId}
          disabled={isSubmitting || primaryAction.disabled}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : PrimaryIcon ? (
            <PrimaryIcon className="h-4 w-4" />
          ) : null}
          {primaryLabel}
        </Button>
      )}
    </>
  )

  const headerIcon =
    icon ??
    (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="h-8 w-8"
        aria-label="Volver"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    )

  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      icon={headerIcon}
      actions={<div className="flex flex-wrap items-center gap-2">{actions}</div>}
      width={width}
    >
      <div className={cn('px-4 sm:px-6 py-5 space-y-5', className)}>
        {subheader}

        {loadError ? (
          <ErrorState
            title="No se pudo cargar la información"
            description={getApiErrorMessage(loadError, 'Intenta nuevamente en unos segundos.')}
            action={
              onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  Reintentar
                </Button>
              ) : undefined
            }
          />
        ) : isLoading ? (
          (loadingFallback ?? <FormSkeleton />)
        ) : (
          children
        )}

        {flatErrors.length > 0 && !isLoading && !loadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="font-medium mb-1">
              Revisa los siguientes campos antes de guardar:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-xs">
              {flatErrors.slice(0, ERROR_MAP_LIMIT).map((e) => (
                <li key={e.path}>
                  <span className="font-medium">{e.path}:</span> {e.message}
                </li>
              ))}
              {flatErrors.length > ERROR_MAP_LIMIT && (
                <li className="opacity-80">
                  …y {flatErrors.length - ERROR_MAP_LIMIT} más.
                </li>
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {!draftMode && (
        <UnsavedChangesDialog
          open={guard.isBlocked}
          onCancel={guard.reset}
          onConfirm={guard.proceed}
        />
      )}
    </StandardPageLayout>
  )
}
