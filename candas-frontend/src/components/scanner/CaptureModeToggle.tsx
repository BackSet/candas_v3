import { cn } from '@/lib/utils'
import { Camera, Keyboard } from 'lucide-react'

export type CaptureMode = 'LECTOR' | 'CAMARA'

interface CaptureModeToggleProps {
  value: CaptureMode
  onChange: (value: CaptureMode) => void
  className?: string
}

const OPTIONS: Array<{ value: CaptureMode; label: string; icon: typeof Keyboard }> = [
  { value: 'LECTOR', label: 'Lector', icon: Keyboard },
  { value: 'CAMARA', label: 'Cámara', icon: Camera },
]

export function CaptureModeToggle({ value, onChange, className }: CaptureModeToggleProps) {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-auto sm:min-w-[220px]',
        className
      )}
      role="group"
      aria-label="Modo de captura"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
