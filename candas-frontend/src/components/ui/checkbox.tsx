import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/**
 * Visual-only checkbox indicator that avoids Radix compose-refs.
 * Use this instead of <Checkbox> when the checkbox is purely decorative
 * (e.g., inside a clickable row with pointer-events-none).
 */
function CheckboxIndicator({
  checked,
  className,
}: {
  checked: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid size-4 shrink-0 place-content-center rounded-[4px] border border-input transition-colors",
        checked && "border-primary bg-primary text-primary-foreground",
        className
      )}
      aria-hidden
    >
      {checked && <CheckIcon className="size-3.5" />}
    </div>
  )
}

export { Checkbox, CheckboxIndicator }
