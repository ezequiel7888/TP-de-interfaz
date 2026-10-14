import { useEffect, useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import { useToast } from '../common/Toast.jsx'
import { Avatar } from '../common/ui.jsx'

const UNDO_SECONDS = 15

export default function VoterReceipt({ onRestart }) {
  const { myVote, ballotOptions, mesas, undoVote } = useElection()
  const toast = useToast()
  const [remaining, setRemaining] = useState(UNDO_SECONDS)

  useEffect(() => {
    if (!myVote) return undefined
    const started = new Date(myVote.time).getTime()
    const tick = () => {
      const elapsed = Math.floor((Date.now() - started) / 1000)
      setRemaining(Math.max(0, UNDO_SECONDS - elapsed))
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [myVote])

  if (!myVote) return null

  const option = ballotOptions.find((item) => item.id === myVote.candidateId)
  const isBlank = option?.tipo === 'blanco'
  const mesa = mesas.find((item) => item.id === myVote.mesaId)
  const canUndo = remaining > 0

  const handleUndo = () => {
    const result = undoVote()
    if (result.ok) {
      toast.show('info', 'Voto deshecho. Podés volver a votar.')
      onRestart()
    } else {
      toast.show('error', result.error || 'No se pudo deshacer el voto.')
    }
  }

  return (
    <div className="receipt-wrap">
      <div className="receipt">
        <span className="receipt-check" aria-hidden="true">
          ✅
        </span>
        <h2 className="receipt-title">¡Tu voto fue registrado!</h2>
        <p className="receipt-sub">El sistema confirmó el registro correctamente en la urna.</p>

        <div className="receipt-folio">
          <span className="receipt-folio-label">Número de comprobante</span>
          <span className="receipt-folio-value">{myVote.receipt}</span>
        </div>

        <div className="receipt-summary">
          <Avatar iniciales={option?.iniciales} color={option?.color} size={44} />
          <div>
            <p className="summary-name">{option?.nombre}</p>
            <p className="summary-meta">
              {isBlank ? 'No se elige ningún candidato' : `${option?.partido} · ${option?.lista}`}
            </p>
            {!isBlank && option?.vicepresidente && (
              <p className="summary-meta">Vice: {option.vicepresidente}</p>
            )}
          </div>
        </div>

        <dl className="summary-details">
          <div>
            <dt>Mesa</dt>
            <dd>{mesa ? `N°${mesa.numero} · ${mesa.responsable}` : '—'}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{new Date(myVote.time).toLocaleTimeString('es-AR')}</dd>
          </div>
        </dl>

        {canUndo ? (
          <div className="undo-box" role="status">
            <p className="undo-text">
              ¿Te equivocaste? Podés deshacerlo durante <strong>{remaining}s</strong>.
            </p>
            <button type="button" className="btn btn-danger btn-block" onClick={handleUndo}>
              ↺ Deshacer voto y volver a votar
            </button>
          </div>
        ) : (
          <p className="notice notice-ok">🔒 Voto confirmado definitivamente. Ya no puede modificarse.</p>
        )}

        <button type="button" className="btn btn-ghost btn-block" onClick={onRestart}>
          Volver al inicio del votante
        </button>
      </div>
    </div>
  )
}
