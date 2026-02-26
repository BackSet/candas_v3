import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, LucideIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

interface RelatedEntity {
  id: number | string
  title: string
  subtitle?: string
  url: string
  icon?: LucideIcon
}

interface RelatedEntitiesProps {
  title: string
  description?: string
  entities: RelatedEntity[]
  emptyMessage?: string
  className?: string
}

export function RelatedEntities({
  title,
  description,
  entities,
  emptyMessage = 'No hay elementos relacionados',
  className,
}: RelatedEntitiesProps) {
  const navigate = useNavigate()

  if (entities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entities.map((entity) => {
            const Icon = entity.icon
            return (
              <div
                key={entity.id}
                className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entity.title}</p>
                    {entity.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {entity.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(entity.url)}
                  className="shrink-0"
                >
                  Ver
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
