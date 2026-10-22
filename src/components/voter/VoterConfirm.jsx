import { useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import { useToast } from '../common/Toast.jsx'
import { Avatar } from '../common/ui.jsx'

function maskDni(dni) {
  const value = String(dni || '')
  if (value.length <= 3) return '•••'
  return `••••${value.slice(-3)}`
}

export default function VoterConfirm({ dni, candidateId, onBack, onRestart, onRegistered }) {
  const { ballotOptions, mesas, registerVote } = useElection()
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const option = ballotOptions.find((item) => item.id === candidateId)
  const isBlank = option?.tipo === 'blanco'
  const openMesas = mesas.filter((mesa) => mesa.estado === 'abierta')
  const mesa = openMesas.length
    ? openMesas[Number(String(dni).slice(-1) || 0) % openMesas.length]
    : null

  const confirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await registerVote({ dni, candidateId, mesaId: mesa?.id })
      if (result.ok) {
        toast.show('success', `¡Voto registrado! Comprobante ${result.receipt}.`)
        onRegistered?.()
      } else {
        toast.show('error', result.error || 'No se pudo registrar el voto.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!option) {
    return (
      <div className="panel-card">
        <p className="field-error" role="alert">
          ⚠️ No se seleccionó ninguna opción.
        </p>
        <button type="button" className="btn btn-primary" onClick={onRestart}>
          Volver a empezar
        </button>
      </div>
    )
  }

  return (
    <div className="panel-card">
      <p className="step-kicker">Paso 3 de 3</p>
      <h2 className="panel-title">Confirmá tu voto</h2>
      <p className="panel-sub">
        Revisá bien antes de confirmar. Después vas a poder deshacerlo durante 15 segundos.
      </p>

      <div className="summary">
        <Avatar iniciales={option.iniciales} color={option.color} size={52} />
        <div>
          <p className="summary-name">{option.nombre}</p>
          <p className="summary-meta">
            {isBlank ? 'No se elige ningún candidato' : option.partido}
          </p>
          {!isBlank && option.viceintendente && (
            <p className="summary-meta">Viceintendente: {option.viceintendente}</p>
          )}
        </div>
      </div>

      <dl className="summary-details">
        <div>
          <dt>Documento</dt>
          <dd>{maskDni(dni)}</dd>
        </div>
        <div>
          <dt>Mesa asignada</dt>
          <dd>{mesa ? `Mesa N°${mesa.numero} · ${mesa.responsable}` : 'A asignar'}</dd>
        </div>
      </dl>

      <p className="notice notice-info">
        🔒 Tu voto es secreto. La confirmación garantiza que quede guardado correctamente.
      </p>

      <div className="panel-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Corregir
        </button>
        <button type="button" className="btn btn-primary" onClick={confirm} disabled={submitting}>
          Confirmar voto
        </button>
      </div>
    </div>
  )
}
