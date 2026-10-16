import { useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import VoterIdentify from './VoterIdentify.jsx'
import VoterBallot from './VoterBallot.jsx'
import VoterConfirm from './VoterConfirm.jsx'
import VoterReceipt from './VoterReceipt.jsx'

const STEP_LABELS = ['Identificación', 'Boleta', 'Confirmación']

export default function VoterFlow({ onVolverInicio }) {
  const { myVote, status } = useElection()
  const [step, setStep] = useState(() => (myVote ? 'receipt' : 'identify'))
  const [dni, setDni] = useState('')
  const [selected, setSelected] = useState(null)

  const restart = () => {
    setDni('')
    setSelected(null)
    setStep('identify')
  }

  const stepIndex = ['identify', 'ballot', 'confirm'].indexOf(step)

  return (
    <div className="voter">
      <ol className="stepper" aria-label="Pasos para votar">
        {STEP_LABELS.map((label, index) => (
          <li
            key={label}
            className={`step ${index === stepIndex ? 'is-current' : ''} ${
              step === 'receipt' || index < stepIndex ? 'is-done' : ''
            }`}
            aria-current={index === stepIndex ? 'step' : undefined}
          >
            <span className="step-num" aria-hidden="true">
              {step === 'receipt' || index < stepIndex ? '✓' : index + 1}
            </span>
            <span className="step-label">{label}</span>
          </li>
        ))}
      </ol>

      {status !== 'abierta' && (
        <p className="notice notice-warn" role="alert">
          La votación no está abierta en este momento. No se pueden emitir votos.
        </p>
      )}

      {myVote && step !== 'receipt' && (
        <p className="notice notice-info" role="status">
          Ya registraste un voto en esta sesión. Para probar de nuevo, usá “Reiniciar demo” en la
          barra superior.
        </p>
      )}

      {step === 'identify' && (
       <VoterIdentify
          dni={dni}
          onDniChange={setDni}
          onContinue={() => setStep('ballot')}
          onVolverInicio={onVolverInicio}
       />
      )}

      {step === 'ballot' && (
        <VoterBallot
          selected={selected}
          onSelect={setSelected}
          onBack={() => setStep('identify')}
          onContinue={() => setStep('confirm')}
        />
      )}

      {step === 'confirm' && (
        <VoterConfirm
          dni={dni}
          candidateId={selected}
          onBack={() => setStep('ballot')}
          onRestart={restart}
          onRegistered={() => setStep('receipt')}
        />
      )}

      {step === 'receipt' && <VoterReceipt onRestart={restart} />}
    </div>
  )
}
