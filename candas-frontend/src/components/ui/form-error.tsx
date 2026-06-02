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
    <p className={cn("flex items-center gap-1 text-xs text-error animate-in fade-in slide-in-from-top-1 duration-200", className)}>
      {showIcon && <span aria-hidden>⚠</span>}
      {message}
    </p>
  )
}
