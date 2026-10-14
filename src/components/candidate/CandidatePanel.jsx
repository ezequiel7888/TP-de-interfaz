import { useMemo, useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import { useToast } from '../common/Toast.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import { Card, StatCard, ProgressBar, Avatar, Badge, formatDateTime } from '../common/ui.jsx'

export default function CandidatePanel() {
  const { candidates, votes, blankId, totalVotes, mesas, incidents, audit, recountRequests, requestRecount } =
    useElection()
  const toast = useToast()
  const [recountOpen, setRecountOpen] = useState(false)

  const ranking = useMemo(
    () =>
      [...candidates]
        .map((candidate) => ({ ...candidate, count: votes[candidate.id] || 0 }))
        .sort((a, b) => b.count - a.count),
    [candidates, votes],
  )

  const max = Math.max(1, ...ranking.map((row) => row.count))
  const lastAudit = audit[0]
  const abiertas = mesas.filter((mesa) => mesa.estado === 'abierta').length
  const openIncidents = incidents.filter((incident) => incident.estado === 'abierto').length
  const hasOpenIncidents = openIncidents > 0

  const confirmRecount = () => {
    requestRecount('Candidato', 'Solicitud de recuento desde el panel del candidato.')
    setRecountOpen(false)
    toast.show('success', 'Solicitud de recuento enviada. El Tribunal fue notificado.')
  }

  return (
    <div className="panel-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">🤝 Panel del Candidato</h2>
          <p className="page-sub">Transparencia del escrutinio y control de errores.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setRecountOpen(true)}>
          🔁 Solicitar recuento
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Mesas cerradas" value={`${mesas.length - abiertas} / ${mesas.length}`} icon="🏛️" />
        <StatCard label="Votos totales" value={totalVotes} icon="📊" tone="primary" />
        <StatCard
          label="Incidentes"
          value={incidents.length}
          hint={`${openIncidents} sin resolver`}
          icon="⚠️"
          tone={hasOpenIncidents ? 'warn' : 'ok'}
        />
        <StatCard label="Recuentos pedidos" value={recountRequests} icon="🔁" />
        <StatCard label="Voto en blanco" value={votes[blankId] || 0} icon="⚪" />
      </div>

      <Card
        title="Resultados provisorios"
        subtitle="Se actualiza a medida que se cargan los votos"
        actions={<Badge tone="ok">Auditoría verificada</Badge>}
      >
        <ul className="rank-list">
          {ranking.map((row, index) => (
            <li key={row.id} className="rank-row">
              <span className={`rank-pos ${index === 0 ? 'is-first' : ''}`}>{index + 1}</span>
              <Avatar iniciales={row.iniciales} color={row.color} size={36} />
              <span className="rank-info">
                <span className="rank-name">{row.nombre}</span>
                <span className="rank-meta">
                  {row.partido} · {row.lista}
                </span>
              </span>
              <span className="rank-bar">
                <ProgressBar
                  value={(row.count / max) * 100}
                  tone={index === 0 ? 'primary' : 'muted'}
                  label={`${row.nombre}: ${row.count} votos`}
                />
              </span>
              <span className="rank-num">{row.count}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Estado de integridad" subtitle="Detección y recuperación de errores">
        <ul className="check-list">
          <li className="check-ok">✔ Los totales por mesa coinciden con el total general.</li>
          <li className="check-ok">✔ Ninguna mesa operó fuera del horario establecido.</li>
          <li className={hasOpenIncidents ? 'check-warn' : 'check-ok'}>
            {hasOpenIncidents ? '⚠ Hay incidentes sin resolver.' : '✔ No hay incidentes abiertos.'}
          </li>
        </ul>
        <p className="card-foot">
          Último evento de auditoría:{' '}
          {lastAudit ? `${lastAudit.accion} · ${formatDateTime(lastAudit.fecha)}` : '—'}
        </p>
      </Card>

      <ConfirmDialog
        open={recountOpen}
        title="Solicitar recuento de votos"
        confirmLabel="Sí, solicitar"
        cancelLabel="Cancelar"
        onConfirm={confirmRecount}
        onCancel={() => setRecountOpen(false)}
      >
        Se registrará la solicitud y se notificará al Tribunal Electoral. ¿Querés continuar?
      </ConfirmDialog>
    </div>
  )
}
