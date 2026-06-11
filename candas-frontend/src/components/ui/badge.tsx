import { cn } from "@/lib/utils"
import { cva,type VariantProps } from "class-variance-authority"
import * as React from "react"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-success-border bg-success-surface text-success-content hover:bg-success-surface/80",
        warning:
          "border-warning-border bg-warning-surface text-warning-content hover:bg-warning-surface/80",
        info:
          "border-info-border bg-info-surface text-info-content hover:bg-info-surface/80",
        error:
          "border-error-border bg-error-surface text-error-content hover:bg-error-surface/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge,badgeVariants }
