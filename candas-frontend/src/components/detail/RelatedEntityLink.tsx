import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelatedEntityLinkProps {
  icon: LucideIcon
  label: string
  value: string | null | undefined
  fallback?: string
  link?: string | null
}

export function RelatedEntityLink({ icon: Icon, label, value, fallback = 'No asignado', link }: RelatedEntityLinkProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => link && navigate({ to: link })}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md border border-transparent hover:bg-muted/50 transition-colors group",
        link && "cursor-pointer border-border/40 hover:border-border"
      )}
    >
      <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-background transition-colors shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium leading-none">{label}</span>
        <span className={cn("text-xs mt-0.5", value ? "text-muted-foreground" : "text-muted-foreground/50 italic")}>
          {value || fallback}
        </span>
      </div>
      {link && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />}
    </div>
  )
}
