import { useEffect, useRef } from 'react'

/**
 * Diálogo de confirmación reutilizable (prevención de errores).
 * Se cierra con Escape o al hacer clic fuera, y enfoca el botón de confirmar.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}) {
  const overlayRef = useRef(null)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    confirmRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel?.()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="overlay"
      ref={overlayRef}
      onMouseDown={(event) => {
        if (event.target === overlayRef.current) onCancel?.()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className="dialog-title">
          {title}
        </h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
