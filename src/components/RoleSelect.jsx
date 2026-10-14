import { useElection } from '../state/ElectionContext.jsx'
import { ROLES } from '../data/election.js'
import { StatCard } from './common/ui.jsx'

export default function RoleSelect({ onSelect }) {
  const { election, mesas, totalVotes, totalPadron, participation } = useElection()
  const abiertas = mesas.filter((mesa) => mesa.estado === 'abierta').length

  return (
    <div className="role-select">
      <section className="hero">
        <span className="hero-kicker">Sistema de soporte al voto</span>
        <h2 className="hero-title">Elección de {election.cargo}</h2>
        <p className="hero-sub">
          {election.ciudad} · {election.fecha} · {election.horario}
        </p>
        <div className="hero-stats">
          <StatCard label="Votos registrados" value={totalVotes} icon="📊" tone="primary" />
          <StatCard label="Mesas abiertas" value={`${abiertas} / ${mesas.length}`} icon="🏛️" tone="ok" />
          <StatCard
            label="Participación"
            value={`${participation.toFixed(1)}%`}
            hint={`de ${totalPadron} electores`}
            icon="👥"
          />
        </div>
      </section>

      <section className="section" aria-labelledby="roles-title">
        <div className="section-head">
          <h2 id="roles-title">Elegí un tipo de participante</h2>
          <p className="section-hint">Cada rol ve una interfaz distinta, según sus prioridades de usabilidad.</p>
        </div>

        <div className="roles-grid">
          {ROLES.map((role) => (
            <button key={role.id} type="button" className="role-card" onClick={() => onSelect(role.id)}>
              <span className="role-icon" aria-hidden="true">
                {role.icon}
              </span>
              <span className="role-name">{role.nombre}</span>
              <span className="role-desc">{role.descripcion}</span>
              <span className="role-tags">
                {role.prioridades.slice(0, 3).map((priority) => (
                  <span key={priority} className="tag">
                    {priority}
                  </span>
                ))}
              </span>
              <span className="role-enter">Ingresar →</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
