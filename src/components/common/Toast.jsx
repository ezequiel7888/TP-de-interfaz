import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3400)
    return () => clearTimeout(timer)
  }, [onClose])

  const icon = toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span className="toast-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="toast-msg">{toast.message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Cerrar aviso">
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((list) => [...list, { id, type, message }])
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
