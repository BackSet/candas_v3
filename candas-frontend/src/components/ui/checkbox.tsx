import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-[5px] border border-border bg-background ring-offset-background transition-colors duration-150 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current animate-in zoom-in-50 duration-150")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

/**
 * Visual-only checkbox indicator that avoids Radix compose-refs.
 * Use this instead of <Checkbox> when the checkbox is purely decorative
 * (e.g., inside a clickable row with pointer-events-none).
 */
function CheckboxIndicator({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background transition-colors",
        checked && "bg-primary text-primary-foreground",
        className
      )}
      aria-hidden
    >
      {checked && (
        <div className="flex items-center justify-center text-current">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

export { Checkbox,CheckboxIndicator }
