// Utility file for protecting list actions
// This file provides helper functions and patterns for protecting actions in lists

import ProtectedByPermission from '@/components/auth/ProtectedByPermission'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'


interface ActionButtonsProps {
  resource: string
  id: number
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
}

export function ProtectedActionButtons({
  resource,
  // id, // Not used but kept in interface for consistency? Or just remove from destructuring
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2">
      {showView && (
        <ProtectedByPermission permission={`${resource}:ver`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onView}
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </ProtectedByPermission>
      )}
      {showEdit && (
        <ProtectedByPermission permission={`${resource}:editar`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </ProtectedByPermission>
      )}
      {showDelete && (
        <ProtectedByPermission permission={`${resource}:eliminar`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </ProtectedByPermission>
      )}
    </div>
  )
}
