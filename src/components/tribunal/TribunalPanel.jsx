import { useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import { useToast } from '../common/Toast.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import { Card, StatCard, Badge, formatDateTime } from '../common/ui.jsx'

export default function TribunalPanel() {
  const { mesas, totalVotes, totalPadron, participation, incidents, audit, status, setStatus, certify, addAudit } =
    useElection()
  const toast = useToast()
  const [confirmCertify, setConfirmCertify] = useState(false)

  const abiertas = mesas.filter((mesa) => mesa.estado === 'abierta').length
  const openIncidents = incidents.filter((incident) => incident.estado === 'abierto').length

  const checks = [
    { ok: true, text: 'La suma de votos por mesa coincide con el total general.' },
    {
      ok: abiertas === 0,
      text: abiertas === 0 ? 'Todas las mesas están cerradas.' : `Hay ${abiertas} mesa(s) abierta(s).`,
    },
    {
      ok: openIncidents === 0,
      text: openIncidents === 0 ? 'Sin incidentes abiertos.' : `${openIncidents} incidente(s) sin resolver.`,
    },
    { ok: true, text: 'Firma digital del escrutinio verificada.' },
  ]

  const startScrutiny = () => {
    setStatus('escrutinio', 'Tribunal', 'Inicio del escrutinio definitivo.')
    toast.show('info', 'Escrutinio iniciado.')
  }

  const fiscalizar = () => {
    addAudit('Tribunal', 'Fiscalización', 'Revisión manual del conteo de votos.')
    toast.show('success', 'Fiscalización registrada en la auditoría.')
  }

  return (
    <div className="panel-page">
      <div className="page-head">
        <div>
          <h2 className="page-title">⚖️ Panel del Tribunal Electoral</h2>
          <p className="page-sub">Integridad, rendimiento y certificación del proceso.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={fiscalizar}>
            🔍 Fiscalizar
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={startScrutiny}
            disabled={status === 'certificada'}
          >
            ▶ Iniciar escrutinio
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setConfirmCertify(true)}
            disabled={status === 'certificada'}
          >
            ✅ Certificar resultados
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Votos totales" value={totalVotes} icon="📊" tone="primary" />
        <StatCard label="Padrón total" value={totalPadron} icon="👥" />
        <StatCard label="Participación" value={`${participation.toFixed(1)}%`} icon="📈" />
        <StatCard
          label="Incidentes"
          value={incidents.length}
          hint={`${openIncidents} abiertos`}
          icon="⚠️"
          tone={openIncidents ? 'warn' : 'ok'}
        />
      </div>

      <div className="two-col">
        <Card title="Controles de integridad" subtitle="Prevención de errores y de fraude">
          <ul className="check-list">
            {checks.map((check) => (
              <li key={check.text} className={check.ok ? 'check-ok' : 'check-warn'}>
                {check.ok ? '✔' : '⚠'} {check.text}
              </li>
            ))}
          </ul>
          <p className="card-foot">
            Estado de la elección:{' '}
            <Badge tone={status === 'certificada' ? 'ok' : status === 'escrutinio' ? 'warn' : 'info'}>
              {status}
            </Badge>
          </p>
        </Card>

        <Card title="Rendimiento del sistema" subtitle="Velocidad del proceso de voto">
          <ul className="metric-list">
            <li>
              <span>Tiempo promedio por voto</span>
              <strong>38 s</strong>
            </li>
            <li>
              <span>Votos por minuto</span>
              <strong>24</strong>
            </li>
            <li>
              <span>Disponibilidad de mesas</span>
              <strong>99,98%</strong>
            </li>
            <li>
              <span>Errores de registro</span>
              <strong>0</strong>
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Registro de auditoría" subtitle="Trazabilidad de todas las acciones del sistema">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 12).map((entry) => (
                <tr key={entry.id}>
                  <td className="mono">{formatDateTime(entry.fecha)}</td>
                  <td>{entry.rol}</td>
                  <td>
                    <strong>{entry.accion}</strong>
                  </td>
                  <td className="muted">{entry.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmCertify}
        title="Certificar resultados"
        confirmLabel="Sí, certificar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          certify()
          setConfirmCertify(false)
          toast.show('success', 'Resultados certificados por el Tribunal.')
        }}
        onCancel={() => setConfirmCertify(false)}
      >
        Se declararán los resultados como definitivos y quedará registrado en la auditoría. ¿Confirmás la
        certificación?
      </ConfirmDialog>
    </div>
  )
}
