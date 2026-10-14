// Pequeños componentes reutilizables de interfaz.

export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint, icon, tone = 'neutral' }) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-top">
        {icon && (
          <span className="stat-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="stat-label">{label}</span>
      </div>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

export function ProgressBar({ value, tone = 'primary', label }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="progress" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span className={`progress-fill progress-${tone}`} style={{ width: `${safe}%` }} />
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Avatar({ iniciales, color, size = 40 }) {
  return (
    <span
      className="avatar"
      style={{ background: color, width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {iniciales}
    </span>
  )
}

export function StatusPill({ status }) {
  const map = {
    abierta: { text: 'Votación abierta', tone: 'ok' },
    escrutinio: { text: 'En escrutinio', tone: 'warn' },
    certificada: { text: 'Resultados certificados', tone: 'info' },
  }
  const info = map[status] || map.abierta
  return <span className={`chip chip-${info.tone}`}>● {info.text}</span>
}

export function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}
