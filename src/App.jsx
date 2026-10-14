import { useState } from 'react'
import { ElectionProvider, useElection } from './state/ElectionContext.jsx'
import { ToastProvider, useToast } from './components/common/Toast.jsx'
import ConfirmDialog from './components/common/ConfirmDialog.jsx'
import { useTheme } from './hooks/useTheme.js'
import RoleSelect from './components/RoleSelect.jsx'
import AppHeader from './components/AppHeader.jsx'
import VoterFlow from './components/voter/VoterFlow.jsx'
import CandidatePanel from './components/candidate/CandidatePanel.jsx'
import OfficialPanel from './components/official/OfficialPanel.jsx'
import TribunalPanel from './components/tribunal/TribunalPanel.jsx'

function Workspace() {
  const { resetAll } = useElection()
  const toast = useToast()
  const { theme, toggleTheme } = useTheme()
  const [role, setRole] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleReset = () => {
    resetAll()
    setConfirmReset(false)
    setRole(null)
    toast.show('info', 'Demo reiniciada: se restauraron los datos iniciales.')
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
        {!role && <RoleSelect onSelect={setRole} />}
        {role === 'votante' && <VoterFlow />}
        {role === 'candidato' && <CandidatePanel />}
        {role === 'responsable' && <OfficialPanel />}
        {role === 'tribunal' && <TribunalPanel />}
      </main>

      <footer className="footer">
        <p>Trabajo de interfaz · Sistema de votación · React + Vite · Sin base de datos</p>
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
