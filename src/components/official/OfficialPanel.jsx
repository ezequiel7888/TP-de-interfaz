import { useState } from 'react'
import { useElection } from '../../state/ElectionContext.jsx'
import { useToast } from '../common/Toast.jsx'
import ConfirmDialog from '../common/ConfirmDialog.jsx'
import { Card, StatCard, ProgressBar, Badge, formatDateTime } from '../common/ui.jsx'
import Volver from '../back/buttonback.jsx'

export default function OfficialPanel({ onVolverInicio }) {
  const { mesas, incidents, incidentTypes, totalVotes, participation, status, setMesaEstado, setAllMesas, addIncident, resolveIncident } =
    useElection()
  const toast = useToast()
  const [form, setForm] = useState({ mesaId: '', tipo: incidentTypes[0], descripcion: '' })
  const [confirmCloseAll, setConfirmCloseAll] = useState(false)

  const abiertas = mesas.filter((mesa) => mesa.estado === 'abierta').length
  const openIncidents = incidents.filter((incident) => incident.estado === 'abierto').length

  const submitIncident = (event) => {
    event.preventDefault()
    if (!form.descripcion.trim()) {
      toast.show('error', 'Escribí una descripción del incidente.')
      return
    }
    addIncident({
      mesaId: form.mesaId || null,
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
    })
    toast.show('success', 'Incidente registrado correctamente.')
    setForm({ mesaId: '', tipo: incidentTypes[0], descripcion: '' })
  }

  const toggleMesa = (mesa) => {
    const nuevo = mesa.estado === 'abierta' ? 'cerrada' : 'abierta'
    setMesaEstado(mesa.id, nuevo)
    const mensaje = nuevo === 'abierta'
      ? status === 'certificada'
        ? `Mesa N°${mesa.numero} abierta. La elección ya está certificada y no admite nuevos votos.`
        : status === 'escrutinio'
          ? `Mesa N°${mesa.numero} abierta y votación reanudada.`
          : `Mesa N°${mesa.numero} abierta.`
      : `Mesa N°${mesa.numero} cerrada.`
    toast.show('info', mensaje)
  }

  return (
    <div className="panel-page">
      <div className="page-head">
        <Volver onClick={onVolverInicio} titulo="Volver a selección de roles"/>
        <div>
          <h2 className="page-title">🧑‍💼 Panel del Responsable de las Elecciones</h2>
          <p className="page-sub">Coordinación de mesas, incidentes y asistencia durante la jornada.</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setAllMesas('abierta')
              toast.show(
                'info',
                status === 'certificada'
                  ? 'Todas las mesas quedaron abiertas, pero la elección ya está certificada y no admite nuevos votos.'
                  : status === 'escrutinio'
                    ? 'Todas las mesas quedaron abiertas y la votación se reanudó.'
                    : 'Todas las mesas quedaron abiertas.',
              )
            }}
          >
            Abrir todas
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmCloseAll(true)}>
            Cerrar todas
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Mesas abiertas" value={`${abiertas} / ${mesas.length}`} icon="🏛️" tone="ok" />
        <StatCard label="Votos emitidos" value={totalVotes} icon="📊" tone="primary" />
        <StatCard label="Participación" value={`${participation.toFixed(1)}%`} icon="👥" />
        <StatCard
          label="Incidentes abiertos"
          value={openIncidents}
          icon="⚠️"
          tone={openIncidents ? 'warn' : 'ok'}
        />
      </div>

      <Card title="Mesas de votación" subtitle="Abrí o cerrá cada mesa. El estado se refleja al instante.">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th>Avance</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => {
                const percent = mesa.padron ? (mesa.votos / mesa.padron) * 100 : 0
                return (
                  <tr key={mesa.id}>
                    <td>
                      <strong>N°{mesa.numero}</strong>
                    </td>
                    <td>{mesa.responsable}</td>
                    <td>
                      {mesa.estado === 'abierta' ? (
                        <Badge tone="ok">Abierta</Badge>
                      ) : (
                        <Badge tone="muted">Cerrada</Badge>
                      )}
                    </td>
                    <td className="cell-progress">
                      <ProgressBar
                        value={percent}
                        tone={percent > 90 ? 'warn' : 'primary'}
                        label={`Mesa ${mesa.numero}: ${Math.round(percent)}%`}
                      />
                      <span className="cell-progress-num">
                        {mesa.votos}/{mesa.padron}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleMesa(mesa)}>
                        {mesa.estado === 'abierta' ? 'Cerrar' : 'Abrir'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="two-col">
        <Card title="Registrar incidente" subtitle="Recuperación de errores durante la jornada">
          <form className="form" onSubmit={submitIncident}>
            <label className="field">
              <span className="field-label">Mesa</span>
              <select
                className="input"
                value={form.mesaId}
                onChange={(event) => setForm({ ...form, mesaId: event.target.value })}
              >
                <option value="">General (sin mesa)</option>
                {mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa N°{mesa.numero} · {mesa.responsable}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Tipo de incidente</span>
              <select
                className="input"
                value={form.tipo}
                onChange={(event) => setForm({ ...form, tipo: event.target.value })}
              >
                {incidentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Descripción</span>
              <textarea
                className="input"
                rows={3}
                value={form.descripcion}
                onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                placeholder="Describí brevemente lo que pasó…"
              />
            </label>

            <button type="submit" className="btn btn-primary btn-block">
              Registrar incidente
            </button>
          </form>
        </Card>

        <Card title="Incidentes" subtitle={`${incidents.length} en total`}>
          {incidents.length === 0 ? (
            <p className="empty">No hay incidentes registrados. 👍</p>
          ) : (
            <ul className="incident-list">
              {incidents.map((incident) => {
                const mesa = mesas.find((item) => item.id === incident.mesaId)
                return (
                  <li
                    key={incident.id}
                    className={`incident ${incident.estado === 'resuelto' ? 'is-resolved' : ''}`}
                  >
                    <div className="incident-top">
                      <Badge tone={incident.estado === 'resuelto' ? 'ok' : 'warn'}>
                        {incident.estado === 'resuelto' ? 'Resuelto' : 'Abierto'}
                      </Badge>
                      <span className="incident-type">{incident.tipo}</span>
                      {mesa && <span className="incident-mesa">Mesa N°{mesa.numero}</span>}
                    </div>
                    <p className="incident-desc">{incident.descripcion}</p>
                    <p className="incident-date">{formatDateTime(incident.fecha)}</p>
                    {incident.estado === 'abierto' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          resolveIncident(incident.id)
                          toast.show('success', 'Incidente marcado como resuelto.')
                        }}
                      >
                        ✔ Marcar resuelto
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmCloseAll}
        title="Cerrar todas las mesas"
        tone="danger"
        confirmLabel="Sí, cerrar todas"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setAllMesas('cerrada')
          setConfirmCloseAll(false)
          toast.show('info', 'Todas las mesas fueron cerradas.')
        }}
        onCancel={() => setConfirmCloseAll(false)}
      >
        Se van a cerrar todas las mesas y no se podrán emitir nuevos votos. ¿Confirmás el cierre?
      </ConfirmDialog>
    </div>
  )
}
