import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    info:    'bg-gray-900',
  }

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50
      ${styles[type]} text-white text-sm font-medium
      px-5 py-3 rounded-2xl shadow-lg
      max-w-[320px] w-[90vw] text-center
      animate-[slideDown_0.3s_ease]`}
    >
      {message}
    </div>
  )
}

// Hook simple pour afficher des toasts
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
  }

  function ToastContainer() {
    if (!toast) return null
    return <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  }

  return { showToast, ToastContainer }
}
