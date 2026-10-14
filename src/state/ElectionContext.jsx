import { createContext, useContext, useEffect, useState } from 'react'
import { BALLOT_OPTIONS, CANDIDATES, DEMO_MESAS, DEMO_VOTES, ELECTION } from '../data/election.js'

const STORAGE_KEY = 'votofacil:eleccion:v2'
const OPTION_IDS = BALLOT_OPTIONS.map((option) => option.id)
const BLANK_ID = 'blanco'

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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw)
    const fresh = initialState()
    return {
      ...fresh,
      ...parsed,
      votes: { ...fresh.votes, ...(parsed.votes || {}) },
      mesas: Array.isArray(parsed.mesas) && parsed.mesas.length ? parsed.mesas : fresh.mesas,
      audit: Array.isArray(parsed.audit) && parsed.audit.length ? parsed.audit : fresh.audit,
    }
  } catch {
    return initialState()
  }
}

const ElectionContext = createContext(null)

export function ElectionProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Si el navegador bloquea el almacenamiento, seguimos en memoria.
    }
  }, [state])

  const addAudit = (rol, accion, detalle) =>
    setState((prev) => ({ ...prev, audit: [auditEntry(rol, accion, detalle), ...prev.audit] }))

  // Registra el voto del votante y devuelve un comprobante.
  const registerVote = ({ dni, candidateId, mesaId, rol = 'Votante' }) => {
    if (state.status !== 'abierta') {
      return { ok: false, error: 'La votación no está abierta en este momento.' }
    }
    if (!OPTION_IDS.includes(candidateId)) {
      return { ok: false, error: 'La opción seleccionada no es válida.' }
    }
    if (state.myVote) {
      return { ok: false, error: 'Ya se registró un voto en esta sesión.' }
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

    setState((prev) => ({
      ...prev,
      votes: { ...prev.votes, [candidateId]: (prev.votes[candidateId] || 0) + 1 },
      mesas: prev.mesas.map((mesa) =>
        mesa.id === mesaAsignada.id ? { ...mesa, votos: mesa.votos + 1 } : mesa,
      ),
      myVote: {
        dni,
        candidateId,
        receipt,
        mesaId: mesaAsignada.id,
        time: new Date().toISOString(),
      },
      receiptSeq: seq + 1,
      audit: [
        auditEntry(rol, 'Voto registrado', `Comprobante ${receipt} · Mesa ${mesaAsignada.numero}`),
        ...prev.audit,
      ],
    }))

    return { ok: true, receipt, mesa: mesaAsignada }
  }

  // Deshace el voto dentro de la ventana permitida (recuperación de errores).
  const undoVote = (rol = 'Votante') => {
    if (!state.myVote) return { ok: false, error: 'No hay un voto para deshacer.' }
    const { candidateId, mesaId, receipt } = state.myVote

    setState((prev) => ({
      ...prev,
      votes: { ...prev.votes, [candidateId]: Math.max(0, (prev.votes[candidateId] || 0) - 1) },
      mesas: prev.mesas.map((mesa) =>
        mesa.id === mesaId ? { ...mesa, votos: Math.max(0, mesa.votos - 1) } : mesa,
      ),
      myVote: null,
      audit: [auditEntry(rol, 'Voto deshecho', `Se anuló el comprobante ${receipt}`), ...prev.audit],
    }))
    return { ok: true }
  }

  const setMesaEstado = (mesaId, estado, rol = 'Responsable') =>
    setState((prev) => {
      const mesa = prev.mesas.find((m) => m.id === mesaId)
      return {
        ...prev,
        mesas: prev.mesas.map((m) => (m.id === mesaId ? { ...m, estado } : m)),
        audit: [
          auditEntry(rol, estado === 'abierta' ? 'Mesa abierta' : 'Mesa cerrada', `Mesa N°${mesa?.numero ?? mesaId}`),
          ...prev.audit,
        ],
      }
    })

  const setAllMesas = (estado, rol = 'Responsable') =>
    setState((prev) => ({
      ...prev,
      mesas: prev.mesas.map((mesa) => ({ ...mesa, estado })),
      audit: [
        auditEntry(rol, estado === 'abierta' ? 'Apertura general de mesas' : 'Cierre general de mesas', 'Todas las mesas'),
        ...prev.audit,
      ],
    }))

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

  const resetAll = () => setState(initialState())

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
    addAudit,
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
