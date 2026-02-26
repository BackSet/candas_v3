import { cn } from "@/lib/utils"

export interface FormErrorProps {
  message?: string
  showIcon?: boolean
  className?: string
}

/**
 * Mensaje de error estándar para formularios.
 * Convención: <p className="text-xs text-error"> con icono opcional.
 */
export function FormError({ message, showIcon = false, className }: FormErrorProps) {
  if (!message) return null
  return (
    <p className={cn("text-xs text-error", className)}>
      {showIcon && <span className="mr-1" aria-hidden>⚠</span>}
      {message}
    </p>
  )
}
