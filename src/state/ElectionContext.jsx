import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { BALLOT_OPTIONS, CANDIDATES, DEMO_MESAS, DEMO_VOTES, ELECTION } from '../data/election.js'

const OPTION_IDS = BALLOT_OPTIONS.map((option) => option.id)
const BLANK_ID = 'blanco'
const UNDO_WINDOW_MS = 15_000

export const INCIDENT_TYPES = [
  'Falta de boletas',
  'Problema con la urna',
  'Votante con dudas',
  'Falla técnica',
  'Otro',
]

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function auditEntry(rol, accion, detalle) {
  return { id: newId('a'), fecha: new Date().toISOString(), rol, accion, detalle }
}

function initialState() {
  return {
    votes: { ...DEMO_VOTES },
    mesas: DEMO_MESAS.map((mesa) => ({ ...mesa })),
    status: 'abierta', // abierta | escrutinio | certificada
    incidents: [],
    audit: [auditEntry('Sistema', 'Apertura de la jornada', 'Mesas habilitadas para votar.')],
    myVote: null,
    receiptSeq: 1,
    recountRequests: 0,
  }
}

const ElectionContext = createContext(null)

export function ElectionProvider({ children }) {
  const [state, setState] = useState(initialState)
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    fetch('/api/state')
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo leer la base de datos.')
        return response.json()
      })
      .then((saved) => {
        if (saved) {
          const fresh = initialState()
          setState({ ...fresh, ...saved, myVote: null, votes: { ...fresh.votes, ...(saved.votes || {}) } })
        }
        setReady(true)
      })
      .catch(() => {
        setStorageError('No hay conexión con la base de datos. Los cambios no se guardarán.')
        setReady(true)
      })
  }, [])

  useEffect(() => {
    if (!ready || storageError) return
    saveQueue.current = saveQueue.current
      .then(() => fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }))
      .then(async (response) => {
        if (response.ok) return
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'No se pudo guardar en la base de datos.')
      })
      .catch((error) => setStorageError(`No se pudo guardar en la base de datos: ${error.message}`))
  }, [state, ready, storageError])

  const addAudit = (rol, accion, detalle) =>
    setState((prev) => ({ ...prev, audit: [auditEntry(rol, accion, detalle), ...prev.audit] }))

  const checkDni = async (dni) => {
    const normalizedDni = String(dni || '').replace(/\D/g, '')
    const response = await fetch('/api/check-dni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni: normalizedDni }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'No se pudo verificar el DNI.')
    return result.registered === true
  }

  // Registra el voto del votante y devuelve un comprobante.
  const registerVote = async ({ dni, candidateId, mesaId, rol = 'Votante' }) => {
    if (state.status !== 'abierta') {
      return { ok: false, error: 'La votación no está abierta en este momento.' }
    }
    const normalizedDni = String(dni || '').replace(/\D/g, '')
    if (normalizedDni.length < 7 || normalizedDni.length > 8) {
      return { ok: false, error: 'Ingresá un DNI válido para registrar el voto.' }
    }
    if (!OPTION_IDS.includes(candidateId)) {
      return { ok: false, error: 'La opción seleccionada no es válida.' }
    }
    if (state.myVote && Date.now() - new Date(state.myVote.time).getTime() < UNDO_WINDOW_MS) {
      return { ok: false, error: 'Esperá a que termine el plazo para deshacer el voto anterior antes de registrar otro.' }
    }

    const openMesas = state.mesas.filter((mesa) => mesa.estado === 'abierta')
    if (openMesas.length === 0) {
      return { ok: false, error: 'No hay mesas abiertas disponibles.' }
    }

    const mesaAsignada = mesaId
      ? openMesas.find((mesa) => mesa.id === mesaId) || openMesas[0]
      : openMesas.reduce((a, b) => (b.votos < a.votos ? b : a))

    const seq = state.receiptSeq
    const receipt = `V-${ELECTION.anio}-${String(seq).padStart(5, '0')}`
    const nextState = {
      ...state,
      votes: { ...state.votes, [candidateId]: (state.votes[candidateId] || 0) + 1 },
      mesas: state.mesas.map((mesa) =>
        mesa.id === mesaAsignada.id ? { ...mesa, votos: mesa.votos + 1 } : mesa,
      ),
      myVote: {
        dni: normalizedDni,
        candidateId,
        receipt,
        mesaId: mesaAsignada.id,
        time: new Date().toISOString(),
      },
      receiptSeq: seq + 1,
      audit: [
        auditEntry(rol, 'Voto registrado', `Comprobante ${receipt} · Mesa ${mesaAsignada.numero}`),
        ...state.audit,
      ],
    }

    try {
      await saveQueue.current
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: normalizedDni, state: nextState }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return { ok: false, error: result.error || 'No se pudo registrar el voto.' }
      setState(nextState)
      return { ok: true, receipt, mesa: mesaAsignada }
    } catch (error) {
      return { ok: false, error: `No se pudo guardar el voto: ${error.message}` }
    }
  }

  // Deshace el voto dentro de la ventana permitida (recuperación de errores).
  const undoVote = async (rol = 'Votante') => {
    if (!state.myVote) return { ok: false, error: 'No hay un voto para deshacer.' }
    const { dni, candidateId, mesaId, receipt } = state.myVote
    const nextState = {
      ...state,
      votes: { ...state.votes, [candidateId]: Math.max(0, (state.votes[candidateId] || 0) - 1) },
      mesas: state.mesas.map((mesa) =>
        mesa.id === mesaId ? { ...mesa, votos: Math.max(0, mesa.votos - 1) } : mesa,
      ),
      myVote: null,
      audit: [auditEntry(rol, 'Voto deshecho', `Se anuló el comprobante ${receipt}`), ...state.audit],
    }
    try {
      const response = await fetch('/api/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, state: nextState }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return { ok: false, error: result.error || 'No se pudo deshacer el voto.' }
      setState(nextState)
    } catch (error) {
      return { ok: false, error: `No se pudo deshacer el voto: ${error.message}` }
    }
    return { ok: true }
  }

  const setMesaEstado = (mesaId, estado, rol = 'Responsable') =>
    setState((prev) => {
      const mesa = prev.mesas.find((m) => m.id === mesaId)
      const reanudarEleccion = estado === 'abierta' && prev.status === 'escrutinio'
      return {
        ...prev,
        status: reanudarEleccion ? 'abierta' : prev.status,
        mesas: prev.mesas.map((m) => (m.id === mesaId ? { ...m, estado } : m)),
        audit: [
          ...(reanudarEleccion
            ? [auditEntry(rol, 'Votación reanudada', 'Se abrió una mesa durante el escrutinio.')]
            : []),
          auditEntry(rol, estado === 'abierta' ? 'Mesa abierta' : 'Mesa cerrada', `Mesa N°${mesa?.numero ?? mesaId}`),
          ...prev.audit,
        ],
      }
    })

  const setAllMesas = (estado, rol = 'Responsable') =>
    setState((prev) => {
      const reanudarEleccion = estado === 'abierta' && prev.status === 'escrutinio'
      return {
        ...prev,
        status: reanudarEleccion ? 'abierta' : prev.status,
        mesas: prev.mesas.map((mesa) => ({ ...mesa, estado })),
        audit: [
          ...(reanudarEleccion
            ? [auditEntry(rol, 'Votación reanudada', 'Se abrieron todas las mesas durante el escrutinio.')]
            : []),
          auditEntry(rol, estado === 'abierta' ? 'Apertura general de mesas' : 'Cierre general de mesas', 'Todas las mesas'),
          ...prev.audit,
        ],
      }
    })

  const addIncident = ({ mesaId, tipo, descripcion, rol = 'Responsable' }) => {
    const incident = {
      id: newId('i'),
      mesaId: mesaId || null,
      tipo,
      descripcion,
      estado: 'abierto',
      fecha: new Date().toISOString(),
    }
    setState((prev) => ({
      ...prev,
      incidents: [incident, ...prev.incidents],
      audit: [auditEntry(rol, 'Incidente registrado', tipo), ...prev.audit],
    }))
    return { ok: true, id: incident.id }
  }

  const resolveIncident = (id, rol = 'Responsable') =>
    setState((prev) => ({
      ...prev,
      incidents: prev.incidents.map((incident) =>
        incident.id === id
          ? { ...incident, estado: 'resuelto', resueltoEn: new Date().toISOString() }
          : incident,
      ),
      audit: [auditEntry(rol, 'Incidente resuelto', `Incidente ${id}`), ...prev.audit],
    }))

  const setStatus = (status, rol = 'Tribunal', detalle = '') =>
    setState((prev) => ({
      ...prev,
      status,
      audit: [auditEntry(rol, `Estado de la elección: ${status}`, detalle), ...prev.audit],
    }))

  const requestRecount = (rol = 'Candidato', detalle = '') =>
    setState((prev) => ({
      ...prev,
      recountRequests: prev.recountRequests + 1,
      incidents: [
        {
          id: newId('i'),
          mesaId: null,
          tipo: 'Solicitud de recuento',
          descripcion: detalle || 'Recuento de votos solicitado.',
          estado: 'abierto',
          fecha: new Date().toISOString(),
        },
        ...prev.incidents,
      ],
      audit: [auditEntry(rol, 'Recuento solicitado', detalle || 'Solicitud de recuento'), ...prev.audit],
    }))

  const certify = (rol = 'Tribunal') =>
    setState((prev) => ({
      ...prev,
      status: 'certificada',
      audit: [
        auditEntry(rol, 'Resultados certificados', 'El escrutinio fue aprobado por el Tribunal.'),
        ...prev.audit,
      ],
    }))

  const resetAll = async () => {
    const freshState = initialState()
    await saveQueue.current
    const response = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: freshState }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'No se pudo reiniciar la demo.')
    setState(freshState)
  }

  const totalVotes = OPTION_IDS.reduce((sum, id) => sum + (state.votes[id] || 0), 0)
  const totalPadron = state.mesas.reduce((sum, mesa) => sum + mesa.padron, 0)
  const participation = totalPadron > 0 ? (totalVotes / totalPadron) * 100 : 0

  const openIncidents = state.incidents.filter((incident) => incident.estado === 'abierto').length

  const value = {
    ...state,
    candidates: CANDIDATES,
    ballotOptions: BALLOT_OPTIONS,
    blankId: BLANK_ID,
    election: ELECTION,
    incidentTypes: INCIDENT_TYPES,
    totalVotes,
    totalPadron,
    participation,
    openIncidents,
    ready,
    storageError,
    addAudit,
    checkDni,
    registerVote,
    undoVote,
    setMesaEstado,
    setAllMesas,
    addIncident,
    resolveIncident,
    setStatus,
    requestRecount,
    certify,
    resetAll,
  }

  return <ElectionContext.Provider value={value}>{children}</ElectionContext.Provider>
}

export function useElection() {
  const context = useContext(ElectionContext)
  if (!context) throw new Error('useElection debe usarse dentro de ElectionProvider')
  return context
}
