import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SegmentedToggleOption<T extends string> {
  value: T
  label: string
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
    <div className={cn('inline-flex items-center rounded-md bg-muted p-1', className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            'h-8 rounded-sm px-3 text-xs font-medium transition-all',
            value === option.value
              ? 'bg-background text-foreground shadow-sm hover:bg-background'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
