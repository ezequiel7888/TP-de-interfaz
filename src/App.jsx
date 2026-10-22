import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ElectionProvider, useElection } from './state/ElectionContext.jsx'
import { ToastProvider, useToast } from './components/common/Toast.jsx'
import { useTheme } from './hooks/useTheme.js'
import Volver from './components/back/buttonback.jsx'
import ConfirmDialog from './components/common/ConfirmDialog.jsx'
import RoleSelect from './components/RoleSelect.jsx'
import AppHeader from './components/AppHeader.jsx'
import VoterFlow from './components/voter/VoterFlow.jsx'
import CandidatePanel from './components/candidate/CandidatePanel.jsx'
import OfficialPanel from './components/official/OfficialPanel.jsx'
import TribunalPanel from './components/tribunal/TribunalPanel.jsx'

function Workspace() {
  const { resetAll, ready, storageError } = useElection()
  const toast = useToast()
  const { theme, toggleTheme } = useTheme()
  const [role, setRole] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleReset = async () => {
    try {
      await resetAll()
      setConfirmReset(false)
      setRole(null)
      toast.show('info', 'Demo reiniciada: se restauraron los datos iniciales y se borró el registro de DNI usados.')
    } catch (error) {
      toast.show('error', error.message || 'No se pudo reiniciar la demo.')
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>


      <AppHeader
        role={role}
        onChangeRole={() => setRole(null)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onReset={() => setConfirmReset(true)}
      />

      <main id="contenido" className="container">
        {!ready && <p className="notice notice-info" role="status">Conectando con la base de datos…</p>}
        {storageError && <p className="notice notice-warn" role="alert">{storageError}</p>}
        {ready && !storageError && <>
        {!role && <RoleSelect onSelect={setRole} />}
        {role === 'votante' && (<VoterFlow onVolverInicio={() => setRole(null)} />)}
        {role === 'candidato' && (<CandidatePanel onVolverInicio={() => setRole(null)} />)}
        {role === 'responsable' && (<OfficialPanel onVolverInicio={() => setRole(null)} />)}
        {role === 'tribunal' && (<TribunalPanel onVolverInicio={() => setRole(null)}/>)}
        </>}
      </main>

      <footer className="footer">
        <p>Trabajo de interfaz · Sistema de votación</p>
      </footer>

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar demo"
        tone="danger"
        confirmLabel="Sí, reiniciar"
        cancelLabel="Cancelar"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      >
        Se van a borrar los votos, incidentes y el registro de auditoría, y se vuelve a los datos
        iniciales. ¿Querés continuar?
      </ConfirmDialog>
    </div>
  )
}

export default function App() {
  return (
    <ElectionProvider>
      <ToastProvider>
        <Workspace />
      </ToastProvider>
    </ElectionProvider>
  )
}
