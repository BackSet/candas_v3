import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface Action {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
  disabled?: boolean
  className?: string
}

interface QuickActionsProps {
  primary?: Action[]
  secondary?: Action[]
  className?: string
}

export function QuickActions({ primary, secondary, className }: QuickActionsProps) {
  return (
    <div className={className}>
      {primary && primary.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {primary.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
                className={action.className}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            )
          })}
        </div>
      )}
      {secondary && secondary.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {secondary.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={action.className}
              >
                {Icon && <Icon className="h-3 w-3 mr-1" />}
                {action.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
