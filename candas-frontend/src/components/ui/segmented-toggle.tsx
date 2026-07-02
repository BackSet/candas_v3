import { cn } from '@/lib/utils'
import * as React from 'react'

interface SegmentedToggleOption<T extends string> {
  value: T
  label: React.ReactNode
}

interface SegmentedToggleProps<T extends string> {
  value: T
  options: readonly SegmentedToggleOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex w-full items-center justify-between rounded-xl bg-muted/30 p-1 border border-border/30 backdrop-blur-md shadow-inner max-w-full',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg px-4 text-xs font-semibold tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
              isActive
                ? 'bg-gradient-to-r from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-md shadow-primary/10 scale-[1.01]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
