import type { ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyTextToClipboard } from '@/utils/clipboard'
import { toast } from 'sonner'

interface CopyActionButtonProps {
  textToCopy: string
  successMessage?: string
  errorMessage?: string
  title?: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  children?: ReactNode
}

export function CopyActionButton({
  textToCopy,
  successMessage = 'Texto copiado',
  errorMessage = 'No se pudo copiar',
  title = 'Copiar',
  className,
  size = 'sm',
  variant = 'outline',
  children,
}: CopyActionButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      title={title}
      onClick={async () => {
        const ok = await copyTextToClipboard(textToCopy)
        if (ok) toast.success(successMessage)
        else toast.error(errorMessage)
      }}
    >
      {children ?? (
        <>
          <Copy className="h-4 w-4" />
          Copiar
        </>
      )}
    </Button>
  )
}
