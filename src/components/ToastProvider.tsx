import { useState, useCallback, useRef, type ReactNode } from 'react'
import { ToastContext, type ToastOptions } from '../hooks/useToast'
import Toast from './Toast'

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastOptions | null>(null)
  const timerRef = useRef<number | null>(null)

  const showToast = useCallback((options: ToastOptions | string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    const toastOptions: ToastOptions =
      typeof options === 'string' ? { message: options, type: 'success' } : options

    setToast(toastOptions)

    const duration = toastOptions.durationMs ?? 2500
    timerRef.current = window.setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast toast={toast} />}
    </ToastContext.Provider>
  )
}
