import { useElection } from '../../state/ElectionContext.jsx'
import { Avatar } from '../common/ui.jsx'

function OptionButton({ option, isSelected, onSelect }) {
  const isBlank = option.tipo === 'blanco'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      className={`ballot-option ${isSelected ? 'is-selected' : ''} ${isBlank ? 'is-blank' : ''}`}
      onClick={() => onSelect(option.id)}
    >
      <Avatar iniciales={option.iniciales} color={option.color} size={44} />
      <span className="ballot-info">
        <span className="ballot-name">{option.nombre}</span>
        {!isBlank && (
          <>
            <span className="ballot-meta">
              {option.partido} · {option.lista}
            </span>
            {option.vicepresidente && <span className="ballot-vice">Vice: {option.vicepresidente}</span>}
          </>
        )}
        <span className="ballot-lema">{option.lema}</span>
      </span>
      <span className="ballot-check" aria-hidden="true">
        {isSelected ? '✅' : '⚪'}
      </span>
    </button>
  )
}

export default function VoterBallot({ selected, onSelect, onBack, onContinue }) {
  const { ballotOptions } = useElection()
  const candidates = ballotOptions.filter((option) => option.tipo !== 'blanco')
  const blank = ballotOptions.find((option) => option.tipo === 'blanco')

  return (
    <div className="panel-card">
      <p className="step-kicker">Paso 2 de 3</p>
      <h2 className="panel-title">Elegí tu candidato/a</h2>
      <p className="panel-sub">
        Tocá una opción para seleccionarla. Podés cambiarla antes de confirmar.
      </p>

      <div className="ballot" role="radiogroup" aria-label="Candidatos a intendente">
        {candidates.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            isSelected={selected === option.id}
            onSelect={onSelect}
          />
        ))}

        {blank && (
          <>
            <div className="ballot-divider" aria-hidden="true">
              o
            </div>
            <OptionButton option={blank} isSelected={selected === blank.id} onSelect={onSelect} />
          </>
        )}
      </div>

      {!selected && <p className="field-hint">Elegí una opción para continuar.</p>}

      <div className="panel-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Volver
        </button>
        <button type="button" className="btn btn-primary" onClick={onContinue} disabled={!selected}>
          Continuar
        </button>
      </div>
    </div>
  )
}
