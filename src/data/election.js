// Datos de la elección municipal de Córdoba Capital del 23 de julio de 2023.
// Las candidaturas se contrastaron con la Resolución 17 de la Junta Electoral Municipal
// y el listado periodístico de las 11 listas oficializadas.
export const ELECTION = {
  ciudad: 'Córdoba Capital',
  distrito: 'Capital',
  cargo: 'Intendente/a',
  fecha: '23 de julio de 2023 · elección histórica',
  horario: '08:00 a 18:00 hs',
  anio: 2023,
  fuentes: [
    'https://tribunaldefaltas.cordoba.gov.ar/wp-content/uploads/2023/06/Resolucion-n%C2%B017-Junta-Electoral-Municipal.pdf',
    'https://www.lanacion.com.ar/politica/quienes-son-los-candidatos-a-intendente-en-cordoba-capital-nid21072023/',
    'https://cordoba.gob.ar/areas-de-gobierno-2025/',
  ],
  aclaracion: 'Candidaturas reales de 2023; los votos de esta aplicación son solo de prueba y no son resultados oficiales.',
}

const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#db2777', '#ca8a04', '#4f46e5', '#059669', '#dc2626', '#64748b']
const candidates = [
  ['passerini', 'Daniel Passerini', 'Javier Pretto', 'Hacemos Unidos por Córdoba'],
  ['de-loredo', 'Rodrigo de Loredo', 'Soher El Sukaria', 'Juntos por el Cambio'],
  ['sikora', 'Verónica Sikora', '', 'La Libertad Primero'],
  ['quinteros', 'Juan Pablo Quinteros', '', 'Somos Córdoba'],
  ['vilches', 'Laura Vilches', '', 'Frente de Izquierda y de Trabajadores-Unidad'],
  ['spaccesi', 'Humberto Spaccesi', '', 'Creo en Córdoba de Todos'],
  ['gonzalez-olguin', 'Eduardo González Olguín', '', 'Partido Humanista'],
  ['orgaz', 'César Orgaz', '', 'Encuentro Vecinal Córdoba'],
  ['scala', 'Jorge Scala', '', 'Partido Demócrata'],
  ['gimenez', 'Romina Anahí Giménez', '', 'Unión Popular Federal'],
  ['bustos', 'Miguel Bustos', '', 'Partido Popular Córdoba'],
]

export const CANDIDATES = candidates.map(([id, nombre, viceintendente, partido], index) => ({
  id,
  nombre,
  viceintendente,
  lista: '',
  partido,
  lema: 'Candidatura oficializada para la elección municipal de 2023',
  color: colors[index],
  iniciales: nombre.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
}))

export const BLANK_VOTE = {
  id: 'blanco', nombre: 'Voto en blanco', viceintendente: '', lista: '', partido: '',
  lema: 'No elige ningún candidato', color: '#6b7280', iniciales: '—', tipo: 'blanco',
}

export const BALLOT_OPTIONS = [...CANDIDATES, BLANK_VOTE]
export const DEMO_VOTES = Object.fromEntries(BALLOT_OPTIONS.map((option) => [option.id, 0]))

// Mesas ficticias para la demostración de la interfaz; no son una distribución oficial.
export const DEMO_MESAS = [
  { id: 'M1', numero: 1, responsable: 'Responsable de mesa 1', padron: 800, votos: 0, estado: 'abierta' },
  { id: 'M2', numero: 2, responsable: 'Responsable de mesa 2', padron: 800, votos: 0, estado: 'abierta' },
  { id: 'M3', numero: 3, responsable: 'Responsable de mesa 3', padron: 800, votos: 0, estado: 'abierta' },
  { id: 'M4', numero: 4, responsable: 'Responsable de mesa 4', padron: 800, votos: 0, estado: 'abierta' },
  { id: 'M5', numero: 5, responsable: 'Responsable de mesa 5', padron: 800, votos: 0, estado: 'abierta' },
  { id: 'M6', numero: 6, responsable: 'Responsable de mesa 6', padron: 800, votos: 0, estado: 'abierta' },
]

export const ROLES = [
  { id: 'votante', icon: '🧑‍🤝‍🧑', nombre: 'Votante', descripcion: 'Emite su voto de forma simple y segura.', prioridades: ['Deshacer errores', 'Aprendizaje rápido', 'Velocidad', 'Confianza en el conteo'] },
  { id: 'candidato', icon: '🤝', nombre: 'Candidato', descripcion: 'Sigue la transparencia y puede pedir recuento.', prioridades: ['Prevención de errores', 'Recuperación', 'Eficiencia y velocidad'] },
  { id: 'responsable', icon: '🧑‍💼', nombre: 'Responsable de las elecciones', descripcion: 'Coordina las mesas y resuelve incidentes.', prioridades: ['Eficiencia', 'Prevenir y recuperar errores', 'Aprendizaje sencillo', 'Reconocimiento'] },
  { id: 'tribunal', icon: '⚖️', nombre: 'Tribunal Electoral', descripcion: 'Fiscaliza la honestidad del proceso.', prioridades: ['Prevención de errores', 'Rendimiento y velocidad', 'Recuperación', 'Auditoría'] },
]
