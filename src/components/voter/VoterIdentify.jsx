import { useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import Volver from '../back/buttonback' 

export default function VoterIdentify({ dni, onDniChange, onContinue, onVolverInicio }) {
  const { checkDni } = useElection()
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [checking, setChecking] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const clean = dni.replace(/\D/g, '')
    if (clean.length < 7 || clean.length > 8) {
      setError('Ingresá un DNI válido: 7 u 8 números, sin puntos.')
      return
    }
    setError('')
    setChecking(true)
    try {
      if (await checkDni(clean)) {
        setError('Este DNI ya registró un voto. No puede votar nuevamente.')
        return
      }
      onContinue()
    } catch (verificationError) {
      setError(verificationError.message || 'No se pudo verificar el DNI. Intentá de nuevo.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="panel-card">
      <Volver onClick={onVolverInicio} titulo="Volver a selección de roles"/>
      <p className="step-kicker">Paso 1 de 3</p>
      <h2 className="panel-title">Identificate para votar</h2>
      <p className="panel-sub">
        Ingresá tu número de documento. Es rápido y no necesitás registrarte.
      </p>

      <form onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">Número de documento (DNI)</span>
          <input
            className={`input ${error ? 'input-error' : ''}`}
            type="text"
            inputMode="numeric"
            value={dni}
            onChange={(event) => {
              onDniChange(event.target.value.replace(/[^\d]/g, ''))
              if (error) setError('')
            }}
            placeholder="Ej: 30123456"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'dni-error' : 'dni-help'}
            autoFocus
          />
        </label>

        {error ? (
          <p id="dni-error" className="field-error" role="alert">
            ⚠️ {error}
          </p>
        ) : (
          <p id="dni-help" className="field-help">
            Se guarda una huella protegida del DNI para evitar votos repetidos. El DNI completo no se
            guarda; “Reiniciar demo” borra ese registro.
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={checking}>
          {checking ? 'Verificando DNI…' : 'Comenzar a votar'}
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => setShowHelp((value) => !value)}
        aria-expanded={showHelp}
      >
        ¿Necesitás ayuda?
      </button>

      {showHelp && (
        <div className="help-box">
          <p>1. Escribí tu DNI y tocá “Comenzar a votar”.</p>
          <p>2. Elegí un candidato de la boleta.</p>
          <p>3. Confirmá tu voto. Tenés 15 segundos para deshacerlo si te equivocaste.</p>
        </div>
      )}
    </div>
  )
}
