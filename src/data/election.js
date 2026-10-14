// Datos base de la elección de intendente.
// Cambiá acá los candidatos, la ciudad, la fecha y las mesas.

export const ELECTION = {
  ciudad: 'Córdoba Capital',
  distrito: 'Capital',
  cargo: 'Intendente/a',
  fecha: '25 de octubre de 2026',
  horario: '08:00 a 18:00 hs',
  anio: 2026,
}

// Candidatos a intendente, cada uno con su vicepresidente.
export const CANDIDATES = [
  {
    id: 'c1',
    nombre: 'Ana Torres',
    vicepresidente: 'Julián Pizarro',
    lista: 'Lista 12',
    partido: 'Frente Vecinal',
    lema: 'Cercanía y trabajo',
    color: '#2563eb',
    iniciales: 'AT',
  },
  {
    id: 'c2',
    nombre: 'Bruno Medina',
    vicepresidente: 'Noelia Cabrera',
    lista: 'Lista 5',
    partido: 'Unión por la Ciudad',
    lema: 'Gestión y desarrollo',
    color: '#16a34a',
    iniciales: 'BM',
  },
  {
    id: 'c3',
    nombre: 'Carla Ferreyra',
    vicepresidente: 'Martín Quiroga',
    lista: 'Lista 23',
    partido: 'Proyecto Común',
    lema: 'Todos contamos',
    color: '#ea580c',
    iniciales: 'CF',
  },
  {
    id: 'c4',
    nombre: 'Diego Salas',
    vicepresidente: 'Rocío Aguirre',
    lista: 'Lista 7',
    partido: 'Renovación Municipal',
    lema: 'Un nuevo rumbo',
    color: '#9333ea',
    iniciales: 'DS',
  },
]

// Opción especial: voto en blanco.
export const BLANK_VOTE = {
  id: 'blanco',
  nombre: 'Voto en blanco',
  vicepresidente: '',
  lista: '',
  partido: '',
  lema: 'No elige ningún candidato',
  color: '#6b7280',
  iniciales: '—',
  tipo: 'blanco',
}

// Todo lo que puede elegir el votante en la boleta.
export const BALLOT_OPTIONS = [...CANDIDATES, BLANK_VOTE]

// Votos de ejemplo para que los paneles arranquen con datos visibles.
export const DEMO_VOTES = { c1: 1240, c2: 1118, c3: 986, c4: 704, blanco: 96 }

// Mesas de votación (la suma de votos coincide con el total de DEMO_VOTES = 4144).
export const DEMO_MESAS = [
  { id: 'M1', numero: 1, responsable: 'Marta Gómez', padron: 800, votos: 736, estado: 'abierta' },
  { id: 'M2', numero: 2, responsable: 'Raúl Ibarra', padron: 800, votos: 716, estado: 'abierta' },
  { id: 'M3', numero: 3, responsable: 'Silvia Núñez', padron: 800, votos: 706, estado: 'abierta' },
  { id: 'M4', numero: 4, responsable: 'Hugo Peralta', padron: 800, votos: 676, estado: 'abierta' },
  { id: 'M5', numero: 5, responsable: 'Lucía Ramírez', padron: 800, votos: 666, estado: 'abierta' },
  { id: 'M6', numero: 6, responsable: 'Nicolás Vera', padron: 800, votos: 644, estado: 'abierta' },
]

// Descripción de cada rol participante y sus prioridades (según la consigna).
export const ROLES = [
  {
    id: 'votante',
    icon: '🧑‍🤝‍🧑',
    nombre: 'Votante',
    descripcion: 'Emite su voto de forma simple y segura.',
    prioridades: ['Deshacer errores', 'Aprendizaje rápido', 'Velocidad', 'Confianza en el conteo'],
  },
  {
    id: 'candidato',
    icon: '🤝',
    nombre: 'Candidato',
    descripcion: 'Sigue la transparencia y puede pedir recuento.',
    prioridades: ['Prevención de errores', 'Recuperación', 'Eficiencia y velocidad'],
  },
  {
    id: 'responsable',
    icon: '🧑‍💼',
    nombre: 'Responsable de las elecciones',
    descripcion: 'Coordina las mesas y resuelve incidentes.',
    prioridades: ['Eficiencia', 'Prevenir y recuperar errores', 'Aprendizaje sencillo', 'Reconocimiento'],
  },
  {
    id: 'tribunal',
    icon: '⚖️',
    nombre: 'Tribunal Electoral',
    descripcion: 'Fiscaliza la honestidad del proceso.',
    prioridades: ['Prevención de errores', 'Rendimiento y velocidad', 'Recuperación', 'Auditoría'],
  },
]
