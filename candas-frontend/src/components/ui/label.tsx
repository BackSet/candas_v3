import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: "default" | "muted"
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        variant === "default" && "text-sm font-medium",
        variant === "muted" && "text-sm font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
