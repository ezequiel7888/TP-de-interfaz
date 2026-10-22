import { useElection } from '../state/ElectionContext.jsx'
import { StatusPill } from './common/ui.jsx'

const ROLE_LABELS = {
  votante: 'Votante',
  candidato: 'Candidato',
  responsable: 'Responsable',
  tribunal: 'Tribunal Electoral',
}

export default function AppHeader({ role, onChangeRole, theme, onToggleTheme, onReset }) {
  const { election, status, totalVotes } = useElection()

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            🗳️
          </span>
          <div>
            <h1 className="brand-title">{election.ciudad}</h1>
            <p className="brand-sub">
              Elección de {election.cargo} · {election.fecha}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <StatusPill status={status} />
          <span className="chip chip-votes" title="Votos registrados">
            📊 {totalVotes}
          </span>
          {role && <span className="chip chip-role">Rol: {ROLE_LABELS[role]}</span>}
          
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
            ♻️ Reiniciar demo
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            title="Cambiar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}
