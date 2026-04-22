import { Skeleton } from '@/components/ui/skeleton'

interface FormSkeletonProps {
  /** Número de secciones a renderizar. */
  sections?: number
  /** Filas de campos por sección. */
  fieldsPerSection?: number
}

export function FormSkeleton({
  sections = 2,
  fieldsPerSection = 4,
}: FormSkeletonProps = {}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: sections }).map((_, sIdx) => (
        <div
          key={`form-skel-${sIdx}`}
          className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {Array.from({ length: fieldsPerSection }).map((_, fIdx) => (
              <div key={`form-field-${sIdx}-${fIdx}`} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
