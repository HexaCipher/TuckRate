import { IconCircleCheck, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import type { ToastOptions } from '../hooks/useToast'

interface ToastProps {
  toast: ToastOptions
}

function Toast({ toast }: ToastProps) {
  const type = toast.type ?? 'success'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card border border-border-default shadow-warm-md text-xs font-medium text-primary select-none max-w-[90vw] animate-in fade-in duration-200"
    >
      {type === 'success' && <IconCircleCheck size={16} className="text-good shrink-0" />}
      {type === 'error' && <IconAlertCircle size={16} className="text-bad shrink-0" />}
      {type === 'info' && <IconInfoCircle size={16} className="text-accent shrink-0" />}
      <span className="truncate">{toast.message}</span>
    </div>
  )
}

export default Toast
